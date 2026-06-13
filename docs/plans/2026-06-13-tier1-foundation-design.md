# 記録システム作り直し・1段目（土台）詳細設計書

- 作成日: 2026-06-13
- 対象: kigasuru（上手くなる気がするぅぅぅ）／本番運用中・Neon PostgreSQL
- 種別: 詳細設計（コード実装なし。スキーマ定義・型・フロー擬似コードのみ）
- 位置づけ: 2段構えの **1段目＝土台**（バグ修正＋スキーマ基盤。見た目はほぼ変わらない）。2段目＝2タップ新記録UIは本書の対象外。
- 上流文書: `docs/redesign/record-system-proposal.md`（提案書）／`docs/handover/2026-06-13-record-redesign-handover.md`（引き継ぎ）

<reliability>
- 本書の `<known-fact>` は、設計者（planner）が対象ファイルを **直接 Read して確認した事実**のみ。確認に使ったコード位置は各所に行番号付きで明記する。
- `<unconfirmed>` は Read で確定できなかった／本番DBの現時点実数など、計測・実機確認が要る項目。
- 提案書の記述と実コードが食い違った点は `<discrepancy>` で明示する（裏取り義務）。
- 本書はコードを書かない。スキーマ・型・SQL・擬似フローは設計表現として記載するが、実装は実装フェーズ（承認後）で行う。
</reliability>

---

## 1. スコープ

<task>
### やること（1段目・7項目）
1. **同期の冪等化**: 記録ごとに `clientId`(UUID) 付与。送信対象は「serverId が無いショットのみ」。サーバーは `clientId` の unique 制約で upsert（再送しても重複しない）。同期成功後もローカル削除しない（serverId を書くだけ）。
2. **distance の nullable 化**: Prisma `distance Int→Int?`、POST API の distance 必須400を撤廃。
3. **位置・気温キャッシュ TTL**: `lastLocationData` を「当日のみ有効」に。過去ラウンドのコース名・気温の混入を止める。
4. **編集 PUT 配線**: 既存 PUT API を編集フローに接続。オフライン編集は dirty フラグ→オンライン時 PUT。
5. **Round モデル新設**: Prisma に Round 追加、Shot に `roundId?`、User に relation。`holeNumber?` も追加（スコアカード機能は対象外）。
6. **Dexie version(6)**: `rounds` テーブル追加、`shots` に `clientId/roundId/holeNumber`（＋ item4 用 `dirty`）追加。
7. **本番データ保全・移行**: バックアップ／Prisma migration／重複検出スクリプト／ロールバック手順（コマンド・検証付き）。
</task>

### やらないこと（厳守）
- **破壊的変更の禁止**。追加・nullable化のみ（既存データ・旧クライアントとの互換を保つ）。
- `strength` / `feeling` は**削除しない**（死にデータだが土台では触らない）。
- **トライアル制限は変更しない**（現状維持。後述 §2-7 で実装を確認済み）。
- **2タップ新記録UI（2段目）は設計しない**。保存即時フィードバック等の新機能も設計しない。
- **Round の行データは Tier 1 では作らない**。Tier 1 は Round の**スキーマ基盤を敷くだけ**で、ラウンド開始フロー・roundId 付与は Tier 2。全ショットの `roundId` は Tier 1 完了時点で null のまま（＝見た目が変わらない）。
- UUID は新規依存を入れず **`crypto.randomUUID()`** を使う（採用可否は §2-8 で確認済み）。

---

## 2. 裏取り結果（提案書との照合）

提案書記載のコード位置をすべて自分で Read した。結果を確定事実・相違として記す。

<known-fact id="trial">
**トライアル制限（変更しない／確認のみ）**: `app/api/trial/validate/route.ts:47-63`。
判定軸は「ユーザーの全 Shot から抽出した**ユニークな日付（YYYY-MM-DD）の数**」。`trialDaysLimit = 3`（63行）。新規日付かつ `uniqueDatesUsed >= 3` で `canRecord:false`。
→ 宮川さん談「3ラウンド」とコードの「ユニーク日付3日」は、1日1ラウンド運用なら実質一致。**本設計では一切変更しない。**
</known-fact>

<known-fact id="shot-prisma">
**Prisma Shot**: `prisma/schema.prisma:141-180`。
- `distance Int`（148行・**必須・非null**）。
- `roundId / clientId / holeNumber / serverId` は**存在しない**。
- `slope/lie/strength/wind/temperature/result/feeling/memo/golfCourse/latitude/longitude/actualTemperature/manualLocation/missType` は存在。
- relation は `user` のみ（175行）。`@@index` は `userId`(177)・`date`(178)・`club`(179)。
- 主キー `id String @id @default(cuid())`（142行）。
</known-fact>

<known-fact id="round-absent">
**Round モデルは存在しない**。リポジトリ全体 grep で `model Round` ヒット0。`roundId` ヒットも0（`clientId` のヒットは `auth.config.ts:15` の Google OAuth 設定で**無関係**）。User relation（42-49行）に `rounds` は無い。→ 新設対象であることを確定。
</known-fact>

<known-fact id="dexie">
**Dexie**: `lib/db/index.ts`。
- `version(1)〜(5)` 実装済み。**次は version(6)**。
- `serverId` は **Dexie 側にのみ存在**（インターフェース10行 `serverId?: string | null`、`version(5)` で index 追加 88行）。ローカル主キーは `id`（auto-increment number、9行）。
- `shots` の現行 index 文字列（v5, 88行）: `++id, serverId, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType, manualLocation`。
- アップグレードは各 version で `.upgrade(tx => tx.table('shots').toCollection().modify(...))` により欠損フィールドを補完する増分方式（62-93行）。
</known-fact>

<discrepancy id="d1-dexie-lines">
提案書／指示は Dexie 該当範囲を「`lib/db/index.ts:54-87`」とするが、実際の version(1)〜(5) 定義は **54-93行**（version(5) の `.upgrade` が 87-93行）。54-87 は v5 stores 途中までで、増分パスの末尾が抜けている。**設計上の実害なし**（同方式で v6 を 94行直後に増設）。
</discrepancy>

<discrepancy id="d2-distance-dexie">
提案書は distance nullable 化で「Dexie・クライアント側を対応」とするが、**Dexie の `distance` は既に `number | null`**（`lib/db/index.ts:19`）、store の `CurrentShot.distance` も `number | null`（`lib/store/index.ts:13`）で**既に nullable**。
→ distance nullable 化で実際に変更が要るのは **(a) Prisma schema の `Int→Int?`、(b) POST API の必須400撤廃** の2箇所のみ。クライアント型の変更は不要。
</discrepancy>

<known-fact id="id-mapping">
**ローカル↔サーバーの ID 対応（裏取り義務項目）**:
- **サーバー正本ID** = Prisma `Shot.id`（cuid, string）。
- **ローカル主キー** = Dexie `Shot.id`（auto-increment number）。サーバーには送らない。
- **連携キー（現状）** = Dexie `Shot.serverId`（cuid or null）。`serverId != null` ⇔ 「サーバー保存済み」。
- **現状のローカル↔サーバー照合は `createdAt`(epoch ms) 一致**で行う（`lib/db/index.ts:520` で `Map(createdAt→shot)`、529行で `new Date(serverShot.createdAt).getTime()` 照合）。これは脆い照合で、**`clientId` が置換すべき対象**。
- **新規 `clientId`(UUID)** = クライアント生成。Prisma・Dexie 双方に持たせ、**冪等同期の主キー**にする。サーバーは `clientId` unique で重複を弾く。
</known-fact>

<known-fact id="sync-bugs">
**同期バグ（提案書通り・確定）**:
- `public/sw.js:349-352` `syncShots()` は**完全な空関数**（コメントのみ）。Background Sync 発火時に何もしない。
- `lib/sync.ts:25-92` `syncShots()` は IndexedDB の**全ショット**を `toArray()`（28行）して `POST /api/shots` に**無条件再送**し、成功分を **`bulkDelete`**（79行）。serverId フィルタも冪等性も無い → 重複量産＋ローカル一時消失。
- `registerBackgroundSync()`（`lib/sync.ts:6-20`）: Background Sync 対応時は SW 登録（→空関数で無効）、非対応時のみ即時 `syncShots()` フォールバック。
- 呼び出し箇所: `components/Providers.tsx:50` が `setupAutoSync()`（online イベント→registerBackgroundSync）、`components/Layout.tsx:47` が `syncShotsFromServer()`（サーバー→ローカルの pull）。
- `app/api/shots/route.ts:49-70` の `create` は**無条件 create**（重複排除なし）。
</known-fact>

<known-fact id="post-api">
**POST `/api/shots`**: `app/api/shots/route.ts:41-46`。必須バリデーションは **`date` / `club` / `distance` の3つ**（distance のみでなく date・club も必須）。distance が undefined/null で 400。
**保存フロー**（`app/record/page.tsx:584-616`）: オンライン時は POST 成功→`addShot({...currentShot, serverId: result.shotId})`（603-606）。POST 失敗（distance 欠損の400含む）は catch して `addShot(currentShot)`（serverId 無し, 610行）し、**それでも「保存しました」トースト**（619行）。→ distance 欠損ショットは serverId が付かず、再送しても400で**永遠にサーバーへ上がらない**（提案書§1.5を確認）。
</known-fact>

<known-fact id="save-button">
**保存ボタンの活性条件**: `app/record/page.tsx:1494` `disabled={(!currentShot.result && !currentShot.missType) || isSaving}`。
→ **result か missType のどちらかがあれば押せる**。distance も 5条件フィールドも不要。提案書§1.5の記述は正確。
</known-fact>

<discrepancy id="d3-isReadyToSave-dead">
`lib/store/index.ts:191-198` の `isShotReadyToSave()` は `slope/club/lie/strength/wind` 全必須＋(result|missType) という**厳しい条件**だが、実際の保存ボタン（§save-button）はこれを**使っていない**（result|missType のみ）。store の当該関数は dead path。土台では触らないが、誤解の元なので記録しておく。
</discrepancy>

<known-fact id="edit-flow">
**編集フローと serverId 脱落（PUT 配線の核心）**:
- `app/record/page.tsx:299-306`: `?edit=<DexieId>` で `getShot(parseInt(editId))` → `setCurrentShot(shot)` → step6。
- しかし store の `CurrentShot` 型に **serverId フィールドが無い**（`lib/store/index.ts:3-21`）。`setCurrentShot` は `initialCurrentShot` 形にスプレッドするため、**serverId は currentShot に乗らない**（脱落する）。
- 保存（editId 分岐, 562-566行）は `updateShot(parseInt(editId), currentShot)`（ローカル更新のみ）＋ `// TODO: Update shot on server as well (requires PUT endpoint)`（566行）。
- → PUT を配線するには、編集対象の **serverId を別経路で回収**する必要がある（§8 で設計）。
</known-fact>

<known-fact id="put-api">
**PUT `/api/shots/[id]`**: `app/api/shots/[id]/route.ts:61-126`。**既に実装済みで動作する**。auth（67行）→ 所有者確認（85行 `existingShot.userId !== session.user.id` で403）→ `prisma.shot.update`（90行）。`id` はサーバー cuid（72行コメント `Server ID is string (cuid)`）。DELETE（12-56行）も同様に存在。
</known-fact>

<known-fact id="lastlocation">
**位置・気温キャッシュ TTL 欠如**:
- 書き込み: `app/record/page.tsx:351-358` `saveSetting('lastLocationData', { golfCourse, temperature, actualTemperature, latitude, longitude, timestamp: Date.now() })`。**timestamp は保存されている**。
- 読み出し: `app/record/page.tsx:393-423` `getSetting('lastLocationData', null)` → `if (savedData) { 無条件で使う }`。**timestamp を一切チェックしない**（403行）。→ 過去ラウンドの値が今日の記録に付与される（提案書§1.5を確認）。
- 別経路: `autoCollect()`（316-376行）は GPS/天気取得後に lastLocationData を更新し、当日の `getTodayManualLocationShots()` を拾って一括更新を促す（360-365行）。これは「当日の手動位置ショットの後追い補完」で、TTL とは別機能。
</known-fact>

<known-fact id="rls">
**RLS（行レベルセキュリティ）が全テーブルで有効**（提案書に言及なし）: `prisma/migrations/enable_rls/migration.sql`。`User/Shot/Subscription/...` 等すべてに `ENABLE ROW LEVEL SECURITY`。ポリシー未作成＝PostgREST（anon/authenticated）アクセスを遮断。Prisma は direct 接続（`DATABASE_URL`/`DIRECT_URL`）で RLS を**バイパス**するためアプリは正常動作。
→ **新規 `Round` テーブルにも `ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;` が必要**（Prisma migrate は RLS を生成しないため手動追記。§9 で手順化）。
</known-fact>

<known-fact id="uuid-ok">
**`crypto.randomUUID()` は採用可**: 既にコードベースで使用実績あり（`app/api/auth/register/route.ts:40`、`forgot-password/route.ts:36` 等）。PWA は HTTPS 配信＝secure context のためブラウザ側でも利用可能。→ **新規依存（uuid パッケージ）は不要**。`package.json` に uuid 依存なしを確認。
</known-fact>

<known-fact id="stack">
**技術スタック（移行コマンドの前提）**: `prisma` / `@prisma/client` `^6.16.3`、`@prisma/adapter-neon` `^7.2.0`、`@neondatabase/serverless`、Neon PostgreSQL。Dexie `^4.2.0`。Next `^15.5.7`。schema.prisma に `url=DATABASE_URL`（pooled）・`directUrl=DIRECT_URL`（direct）の2系統あり（6-9行）→ **migration は DIRECT_URL を使用**。`package.json` の scripts に migrate 専用コマンドは無い（`npx prisma ...` を直接使う）。
</known-fact>

<unconfirmed>
- 本番DBの**現時点の**実数（提案書時点 2026-06-13: 総187件/11ユーザー・最大108件/重複1グループ3行）。移行直前に再計測する（§9-1）。
- `currentShot` は zustand に persist なし（`lib/store/index.ts:79` で persist middleware 不使用を確認）。提案書§1.2-4「PWA kill で入力途中消失」は事実だが、**この修正は本設計のスコープ外**（土台7項目に含まれない／2段目のUI再設計で扱う）。記録のみ。
</unconfirmed>

---

## 3. 同期の ID 設計（土台の中核思想）

冪等同期の前提として、3つの ID の役割を固定する。

| ID | 所在 | 型 | 役割 | 生成 |
|---|---|---|---|---|
| `Shot.id` | Prisma（サーバー） | cuid string | サーバー正本ID。PUT/DELETE の対象キー | サーバー |
| `Shot.id` | Dexie（ローカル） | auto-increment number | ローカル主キー。UI 操作・updateShot 対象 | ローカル |
| `serverId` | Dexie のみ | cuid string \| null | 「サーバー保存済みか」の連携キー（=サーバー `Shot.id`） | POST 応答で設定 |
| **`clientId`** | **Prisma＋Dexie 双方（新規）** | UUID string | **冪等同期キー。送信前にクライアントで確定** | `crypto.randomUUID()` |

<known-fact>
不変条件（土台導入後）:
1. ローカルの1ショットは生成時に `clientId` を1つ持つ（以後不変）。
2. `serverId == null` ⇔ 未同期（push 対象）。`serverId != null` ⇔ 同期済み（push しない）。
3. サーバーの `clientId` は unique。同じ `clientId` の二重送信は upsert で1行に収束。
4. 同期しても**ローカルは削除しない**（serverId を書くだけ）。分析は引き続き IndexedDB を単一ソースとして読む。
</known-fact>

この設計が直す**潜在バグ**: 現状はフレーキー回線で「POST はサーバー成功・応答だけロスト」すると、クライアントは catch して serverId 無しで保存→次回再送で**重複生成**する。`clientId` upsert なら再送が既存行に収束し、重複が出ない。これが冪等化の本質的価値。

---

## 4. スキーマ差分

### 4.1 Prisma `Shot`（変更：before / after）

<known-fact>before（`prisma/schema.prisma:141-180` 抜粋）:</known-fact>
```prisma
model Shot {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  club        String
  distance    Int                 // ← 必須・非null
  // ... slope/lie/strength/wind/temperature/result/feeling/memo
  // ... golfCourse/latitude/longitude/actualTemperature/manualLocation/missType
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId]) @@index([date]) @@index([club])
}
```

after（**追加・nullable化のみ**。既存フィールドは全維持）:
```prisma
model Shot {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  club        String
  distance    Int?                // ★ Int → Int?（必須撤廃。既存値は不変）

  // ★ 追加（すべて nullable）
  clientId    String?  @unique    // 冪等同期キー（UUID）。null 可・unique
  roundId     String?             // Round 参照（Tier 1 では常に null）
  holeNumber  Int?                // ホール番号（任意・将来用）

  // 既存フィールドは省略せず全維持（slope/lie/strength/feeling 等も削除しない）
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  round Round? @relation(fields: [roundId], references: [id], onDelete: SetNull)  // ★追加

  @@index([userId]) @@index([date]) @@index([club])
  @@index([roundId])                 // ★追加（ラウンド別取得用）
}
```

<known-fact>
- `clientId String? @unique`: PostgreSQL の部分的事実として、**unique 制約は複数の NULL を許容**する（NULL は互いに distinct）。既存187件は clientId=NULL のまま共存でき、新規行のみ非null UUID で一意。
- `roundId` の `onDelete: SetNull`: Round 削除時にショットを**消さず** roundId を null に戻す（データ保全優先）。
</known-fact>

### 4.2 Prisma `Round`（新規。提案書 §4.1 準拠）

```prisma
model Round {
  id                String   @id @default(cuid())
  userId            String
  date              DateTime
  golfCourse        String?
  latitude          Float?
  longitude         Float?
  temperature       String?   // summer / mid-season / winter（Shot.temperature と同じ語彙）
  actualTemperature Float?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  shots Shot[]

  @@index([userId, date])
}
```

<discrepancy id="d4-round-clientId">
提案書の Round 案に `clientId` は無い。Tier 1 は Round の**行を作らない**ため Round 同期も発生せず、`Round.clientId` は不要。**Round の冪等同期キーは Tier 2 で Prisma・Dexie 対称に追加**する（後述 §4.4 の Dexie 側は前方互換のため枠だけ予約）。本書では提案書通り `Round.clientId` なしとする。
</discrepancy>

### 4.3 Prisma `User`（relation 追加のみ）

```prisma
model User {
  // ... 既存フィールド全維持 ...
  shots   Shot[]
  rounds  Round[]   // ★追加（relation のみ。カラム増加なし）
  // ...
}
```

### 4.4 Dexie `version(6)`（stores 定義差分 ＋ interface 差分）

<known-fact>現行 v5（`lib/db/index.ts:87-93`）の stores は `shots` のみ再宣言（settings/calibration は v1 から継承）。</known-fact>

v6 stores 定義（増分。`shots` に index 追加＋`rounds` 新規）:
```
// 擬似（実装は lib/db/index.ts に version(6) を追記）
this.version(6).stores({
  shots:  '++id, serverId, clientId, roundId, holeNumber, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType, manualLocation',
  rounds: '++id, serverId, clientId, date, golfCourse, createdAt',
}).upgrade(tx => {
  return tx.table('shots').toCollection().modify(shot => {
    if (!shot.clientId)            shot.clientId   = crypto.randomUUID(); // 既存ローカル行に冪等キーを後付け
    if (shot.roundId === undefined)    shot.roundId    = null;
    if (shot.holeNumber === undefined) shot.holeNumber = null;
    if (shot.dirty === undefined)      shot.dirty      = false;          // item4 用
  });
});
```

interface 差分（`Shot` に追加。`dirty` は item4＝編集PUTのオフライン再送フラグ）:
```ts
// 擬似（lib/db/index.ts の interface Shot に追記）
export interface Shot {
  // 既存全フィールド維持（serverId/distance: number|null 等はそのまま）
  clientId?: string;        // ★ UUID（v6 で全既存行に backfill）
  roundId?: string | null;  // ★ Tier1 は null 固定
  holeNumber?: number | null;
  dirty?: boolean;          // ★ true=サーバー未反映の編集あり（オンライン時 PUT）
}

export interface Round {    // ★ 新規 interface
  id?: number;
  serverId?: string | null;
  clientId?: string;        // ★ Tier2 の Round 冪等同期用に予約（Tier1 未使用）
  date: string;
  golfCourse: string | null;
  // latitude/longitude/temperature/actualTemperature は Tier2 で追加（Tier1 は最小）
  createdAt: number;
}
```

<known-fact id="indexeddb-gotchas">
**IndexedDB / Dexie の index 制約（実装者向け注意）**:
- IndexedDB は **boolean を有効な index キーにできない**。よって `dirty`（boolean）は **stores 文字列に含めない**（interface 追加のみ）。`dirty` の絞り込みは `.filter(s => s.dirty === true)` のスキャンで行う（データ量が小さく問題ない）。※同様に既存の `manualLocation`(boolean) も v4 で index 宣言されているが実質 no-op。
- IndexedDB は **null/undefined を index しない**。よって「未同期＝`serverId==null`」の抽出に `.where('serverId').equals(null)` は**使えない**（null は索引に載らずヒット0）。**`.filter(s => !s.serverId)` のスキャン**を使う。
- `clientId` は非null string のため `.where('clientId').equals(x)` が有効（pull 照合で使用）。
</known-fact>

### 4.5 生成される migration SQL（想定）

`npx prisma migrate dev --name tier1_foundation` が生成する SQL の想定形（§9 で手順）。**末尾の RLS だけは Prisma が生成しないため手動追記**する。

```sql
-- (1) distance を nullable 化（非破壊・即時）
ALTER TABLE "Shot" ALTER COLUMN "distance" DROP NOT NULL;

-- (2) Shot に冪等キー・ラウンド参照・ホール番号を追加（全 nullable）
ALTER TABLE "Shot" ADD COLUMN "clientId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "roundId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "holeNumber" INTEGER;

-- (3) Round 新規
CREATE TABLE "Round" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "golfCourse" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "temperature" TEXT,
  "actualTemperature" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- (4) 制約・index
CREATE UNIQUE INDEX "Shot_clientId_key" ON "Shot"("clientId");  -- 複数NULL許容
CREATE INDEX "Shot_roundId_idx" ON "Shot"("roundId");
CREATE INDEX "Round_userId_date_idx" ON "Round"("userId", "date");

-- (5) 外部キー
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_roundId_fkey"
  FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Round" ADD CONSTRAINT "Round_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- (6) ★手動追記：新規テーブルも既存方針に合わせて RLS 有効化（Prisma は生成しない）
ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;
```

<risk>
(1)〜(5) はすべて **追加 or NOT NULL 解除**で、既存187件のデータを書き換えない（distance の値も不変）。Postgres 上ではテーブル書き換えを伴わない即時 DDL。(6) を**忘れると新 Round だけ RLS 非適用**になり、既存テーブルとセキュリティ姿勢が不揃いになる。チェックリストで必須化（§9・§11）。
</risk>

---

## 5. 同期の新フロー

<context>
置き換え対象（確定バグ §sync-bugs）: `lib/sync.ts`（全件再送→bulkDelete）と `public/sw.js:349` 空関数。
方針: **同期ロジックはクライアント側に一本化**し、SW の Background Sync 依存を外す（理由は §5.5）。
</context>

### 5.1 設計原則（冪等性の3点セット）
1. **生成時に clientId 確定**（`crypto.randomUUID()`）。
2. **push 対象は `serverId == null` のみ**（`.filter` スキャン）。サーバーは **clientId upsert**。
3. **push 成功で serverId を書くだけ・削除しない**。

### 5.2 記録時フロー（擬似）

<known-fact>現行 `handleSave` 新規分岐（`app/record/page.tsx:584-616`）を下記に置換設計。</known-fact>
```
// 擬似フロー（新規ショット保存）
clientId = crypto.randomUUID()          // ★ online/offline 分岐の前に1回だけ生成
payload  = { ...currentShot, clientId } // clientId を本文にも持たせる

if (online):
   try:
      res = POST /api/shots (payload)          // サーバーは clientId upsert
      addShot({ ...payload, serverId: res.shotId })   // ローカルにも clientId と serverId
   catch:
      addShot({ ...payload })                   // serverId 無し（=未同期）。clientId は保持
else:
   addShot({ ...payload })                      // serverId 無し（=未同期）。clientId は保持

// distance が null でも 400 にならない（§6 で API 改修）ため、
// 「成功表示なのにサーバーに上がらない」サイレント欠損が解消される。
```
要点: **同一 clientId を POST 本文とローカル保存の両方に使う**。これにより、応答ロスト時の再 push が upsert で既存行へ収束する。

### 5.3 送信時フロー（push・`lib/sync.ts` 置換, 擬似）

```
// 擬似フロー（pushUnsyncedShots）— 旧 syncShots() を置換
unsynced = db.shots.filter(s => !s.serverId).toArray()      // ★ null は index 不可なので filter
if (unsynced.length === 0) return

for shot in unsynced:                                        // 直列 or 小バッチ
   res = POST /api/shots ({ ...shotFields, clientId: shot.clientId })
   if (res.ok):
      updateShot(shot.id, { serverId: res.shotId })          // ★ 削除しない・serverId だけ書く
   else:
      log & continue                                         // 次回 online で再試行

// 旧実装の「全件再送」「bulkDelete」「createdAt 依存」を全廃。
```

並行して **dirty（編集済み）ショットの PUT 反映**も push の一部として行う（§8）。

```
dirty = db.shots.filter(s => s.dirty === true && s.serverId).toArray()
for shot in dirty:
   res = PUT /api/shots/{shot.serverId} (editableFields(shot))
   if (res.ok): updateShot(shot.id, { dirty: false })
```

### 5.4 サーバー upsert（POST 側の冪等化, 擬似）

<known-fact>現行は無条件 create（`app/api/shots/route.ts:49-70`）。下記に置換設計。</known-fact>
```
// 擬似（POST /api/shots）
if (body.clientId):
   try:
      shot = prisma.shot.upsert({
         where:  { clientId: body.clientId },
         create: { userId, clientId: body.clientId, ...fields },  // distance は null 可
         update: { ...fields },        // 再送=同値上書き（実質no-op）。編集はPUTが主経路
      })
   catch (P2002 unique race):
      shot = prisma.shot.findUnique({ where: { clientId: body.clientId } })  // 競合は既存行を返す
else:
   shot = prisma.shot.create({ userId, ...fields })   // ★ 旧クライアント互換（clientId 無し）
return { shotId: shot.id }
```

<risk>
Prisma `upsert` は内部的に「find→create/update」で完全アトミックではなく、同一 clientId の同時2リクエストで稀に `P2002`（unique 違反）が発生し得る。**catch して findUnique で既存行を返す**フォールバックを必須とする（実装フェーズのテスト観点 §11 に含む）。
</risk>

### 5.5 受信時フロー（pull・`syncShotsFromServer` 改修, 擬似）

<known-fact>現行 pull（`lib/db/index.ts:495-572`）は **createdAt 一致**で照合（520・529行）。clientId 優先へ改修。</known-fact>
```
// 擬似（syncShotsFromServer）
serverShots = GET /api/shots          // ★ clientId/roundId/holeNumber も返るよう API 拡張（§6）
for s in serverShots:
   local = s.clientId ? db.shots.where('clientId').equals(s.clientId).first() : null
   if (!local):
      local = db.shots.where('createdAt').equals(toMs(s.createdAt)).first()   // ★ 旧データfallback
   if (!local):
      addShot({ ...s, serverId: s.id, clientId: s.clientId ?? undefined, createdAt: toMs(s.createdAt) })
   else if (!local.serverId):
      updateShot(local.id, { serverId: s.id, clientId: local.clientId ?? s.clientId })
```
要点: **clientId を第一照合キー、createdAt を後方互換 fallback** とする。既存187件（clientId=null）は従来通り createdAt 照合で重複なく取り込める。

### 5.6 SW（Background Sync）の扱い

<discrepancy id="d5-sw-db-name">
SW から Dexie を直接同期するのは困難。**DB 名がユーザー別 `KigasuruDB_${userId}`**（`lib/db/index.ts:51`）で、SW は userId を知らないため対象DBを開けない。提案書は「後でクライアント側から呼び出される」とするが、実態としても**クライアント主導が妥当**。
</discrepancy>

- **採用（Option A・推奨）**: **クライアント主導の同期に一本化**。`setupAutoSync()`（`components/Providers.tsx:50`）の online ハンドラで、新 `pushUnsyncedShots()` を**直接呼ぶ**（SW の sync イベント依存を外す）。トリガーは (1) online 復帰、(2) アプリ前面化／Layout マウント、(3) オフライン保存直後。SW の空 `syncShots()` は**無害な no-op として残置**（または削除）。
- **不採用（Option B）**: SW の sync イベント→`postMessage`→クライアントが同期実行。DB名問題は解決するが、SW↔クライアントのメッセージ往復が増えるだけで Phase 0 の利得が薄い。**採用しない**（将来 Android の真のバックグラウンド同期が要件化したら再検討）。

判断材料: データ量が小さく（≤108件/人）、同期は前面でのオンライン復帰時に走れば十分。Android/iOS 両方で**確実に動く**ことを優先し、SW 依存を外す Option A を推す。

### 5.7 移行前後の挙動（old / mixed / new）

| 局面 | クライアント | サーバー | 挙動 |
|---|---|---|---|
| **before** | 旧（全件再送＋削除） | 旧（無条件create） | 重複量産・ローカル一時消失・createdAt照合 |
| **mixed**（サーバー先行デプロイ） | 旧（clientId 無しPOST） | 新（clientId 無し→**create**） | 旧クライアントは従来通り動く（互換維持）。重複は旧来同等まで |
| **mixed** | 新（clientId付きPOST） | 旧（clientId 未対応）※ | 後述の順序で回避（API を先にデプロイ） |
| **after** | 新（serverId==null のみ push＋clientId） | 新（clientId upsert） | 冪等。重複ゼロ・削除なし・clientId照合 |

<risk>
mixed の「新クライアント × 旧サーバー」は事故るため、**デプロイ順序を「スキーマ→API→クライアント」に固定**（§10）。サーバー（schema＋API）が clientId/upsert/distance-null を受け入れられる状態にしてから、新クライアントを出す。逆順は禁止。
</risk>

---

## 6. API 変更

### 6.1 POST `/api/shots`（`app/api/shots/route.ts`）
- **distance 必須を撤廃**（41-46行）: バリデーションを `if (!date || !club)` に変更（distance 条件を削除）。`create`/`upsert` の data も `distance: distance != null ? parseInt(...) : null` に。
- **clientId upsert**（§5.4）: `clientId` を受理。あれば upsert（P2002 フォールバック付き）、無ければ従来 create（旧クライアント互換）。
- **roundId/holeNumber 受理**: 受け取って保存（Tier 1 では新クライアントも roundId は送らない＝null のまま。枠だけ用意）。
- 応答は従来通り `{ success, shotId }`（clientId を含めても可）。

### 6.2 PUT `/api/shots/[id]`（`app/api/shots/[id]/route.ts`）
- **改修不要**（§put-api で動作確認済み）。`distance` は `body.distance !== undefined ? parseInt : undefined`（95行）で、未指定はスキップ・指定時のみ更新。distance を null 更新したい場合のみ「null 明示」を受けられるか要確認（現行は `parseInt(String(null))`→`NaN` の懸念）。
  <unconfirmed>PUT で distance を**明示的に null へ**更新する経路は現行コードに無い。Tier 1 の編集要件（条件・メモ追記が主）では distance を null 化する操作は想定薄。必要になれば `body.distance === null ? null : ...` の分岐を足す（実装フェーズで判断）。</unconfirmed>
- 配線は §8。

### 6.3 GET `/api/shots`（`app/api/shots/route.ts:90-119`）
- **改修ほぼ不要**。Prisma `findMany` は新カラム `clientId/roundId/holeNumber` を自動で返す。pull 側（§5.5）がそれを使う。

### 6.4 distance nullable の影響範囲（互換確認）

<known-fact>
- **分析（analysis）**: `app/analysis/page.tsx:146` `if (shot.distance !== null && shot.distance > 0)` で null ガード済み。集計は安全。表示 `app/analysis/page.tsx:993` `{shot.distance}Yd` は null で「Yd」とだけ描画される（**クラッシュしない**・軽微表示崩れのみ）。
- **ダッシュボード（dashboard）**: `app/dashboard/page.tsx:149` `if (shot.distance !== null && shot.distance > 0)`、`:176` `if (!shot.distance || shot.distance === null) return false;`、`:177` 範囲フィルタ。すべて null ガード済み。
- **getStatistics**（`lib/db/index.ts:228`）: `.filter((d): d is number => d !== null && d > 0)`。ガード済み。
→ distance nullable 化は既存分析と**互換**。実害なし。
</known-fact>

---

## 7. 位置・気温キャッシュ TTL（item 3）

<task>
`lastLocationData` を「当日のみ有効」にする。書き込みは既に `timestamp: Date.now()` を保存済み（§lastlocation）なので、**読み出し側に TTL チェックを足すだけ**（書き込み構造の変更不要）。
</task>

```
// 擬似（app/record/page.tsx:393-423 の読み出しに TTL を追加）
savedData = getSetting('lastLocationData', null)
if (savedData && isSameLocalDay(savedData.timestamp, Date.now())):
    // 当日のキャッシュ → 使う（現状の挙動）
    updateCurrentShot(... savedData ...)
else:
    // 無効（昨日以前）or 無し → 再取得
    await autoCollect()
```
- `isSameLocalDay(a, b)`: `new Date(a)` と `new Date(b)` の年月日が一致するか（ローカルタイム基準）。
- 効果: 過去ラウンドのコース名・気温の混入が止まる（提案書§1.5の暫定対処＝「当日のみ有効」）。

<known-fact>
**Round 導入との役割分担**:
- **Tier 1**: TTL のみ実装。`lastLocationData`（IndexedDB settings）の当日キャッシュは残す。Round は**まだ使わない**（行を作らないため）。
- **Tier 2**: 「ラウンド開始」で Round に golfCourse/temperature を1回確定し、各ショットはアクティブ Round から位置・気温を引く。`lastLocationData` の使い回しは Round 文脈に置き換わる。TTL は安全網として残してよい。
- → Tier 1 の TTL は**スコープを越えない最小の止血**。Round ベースの位置取得は Tier 1 では設計・実装しない。
</known-fact>

<risk>
TTL は client-only・スキーマ非依存・本番DB に触れない最小変更。**最初に独立リリース可能**（§10 で着手順の先頭に置く）。日跨ぎラウンド（深夜0時またぎ）は実用上稀で、「当日＝同一カレンダー日」で許容。
</risk>

---

## 8. 編集 PUT 配線（item 4）

<context>
現状: 編集保存はローカルのみ（`updateShot`）、PUT 未配線（TODO 566行）。かつ **serverId が currentShot から脱落**（§edit-flow）。PUT の対象キーは serverId（cuid）なので、まず serverId の回収が要る。
</context>

### 8.1 serverId の回収
- 編集ロード時（`app/record/page.tsx:299-306`）に、`getShot()` で得た Dexie shot の `serverId` と `id`(ローカル) を**コンポーネント state に保持**（例: `editServerId`, `editLocalId`）。`setCurrentShot` は serverId を落とすため、state で別持ちする。

### 8.2 保存時の配線（擬似）

```
// 擬似（handleSave の editId 分岐, app/record/page.tsx:562-583 を置換設計）
await updateShot(editLocalId, currentShot)        // ① ローカル更新（従来通り）

if (online && editServerId):
   try:
      PUT /api/shots/{editServerId} (editableFields(currentShot))   // ② サーバー反映
      // 成功：dirty は付けない
   catch:
      await updateShot(editLocalId, { dirty: true })                // ③ 失敗→後で再送
else if (!editServerId):
   // まだ一度も同期されていないショット（serverId 無し）。
   // PUT 対象が無い → 通常の push（§5.3）で create され、編集後の値がそのまま上がる。
   // dirty 付与は不要（push が拾う）。
else: // offline
   await updateShot(editLocalId, { dirty: true })                   // ③ オンライン時に PUT
```

### 8.3 dirty の回収（オンライン復帰時）
- §5.3 の push 内で `dirty===true && serverId` のショットを PUT し、成功で `dirty=false`。
- これにより「オフライン編集 → オンラインで自動サーバー反映」が成立する。

<risk>
`editableFields(currentShot)` は currentShot が持つ編集可能フィールド（date/club/distance/slope/lie/strength/wind/temperature/result/feeling/memo/golfCourse/lat/lng/actualTemperature/missType/manualLocation）。currentShot は **serverId/clientId/id を含まない**ため、`updateShot(editLocalId, currentShot)` は Dexie マージで serverId/clientId/dirty を**温存**する（上書きしない）。PUT は serverId をURLに使うのみで本文に clientId 不要。整合する。
</risk>

---

## 9. 本番データ移行手順

<context>
本番: Neon PostgreSQL。提案書時点（2026-06-13）で総187件/11ユーザー・最大108件/重複1グループ3行。**実数は移行直前に再計測**する。CLAUDE.md「実数確認前の煽り禁止／measure before acting」に従い、各破壊的操作の前に read-only SELECT を置く。
</context>

### 9-0. 事前確認（read-only）
```bash
# 接続先・件数・ユーザー分布・重複の現況を計測（変更しない）
psql "$DIRECT_URL" -c 'SELECT count(*) AS shots, count(DISTINCT "userId") AS users FROM "Shot";'
psql "$DIRECT_URL" -c 'SELECT "userId", count(*) FROM "Shot" GROUP BY "userId" ORDER BY 2 DESC LIMIT 5;'
# 重複候補（userId × createdAt × club × result）
psql "$DIRECT_URL" -c 'SELECT "userId","createdAt",club,(result::text) AS r, count(*)
  FROM "Shot" GROUP BY "userId","createdAt",club,(result::text) HAVING count(*) > 1;'
```
検証: shots 件数が提案書の187と大きく乖離していないか。乖離があれば原因（その後の利用 or 同期バグ進行）を確認してから進む。

### 9-1. バックアップ（二重化）

**(A) Neon ブランチ（推奨・即時・無料・即ロールバック可）**
```bash
# Neon CLI（or コンソールで同等操作）。移行前点を分岐として固定
neonctl branches create --name pre-tier1-$(printf '%(%Y%m%d)T' -1)
# → 失敗時はこのブランチに接続を切り替えるだけで全データを瞬時復元できる
```
**(B) 論理ダンプ（belt-and-suspenders・ファイル保全）**
```bash
mkdir -p backups
pg_dump "$DIRECT_URL" -Fc -f "backups/kigasuru_pre_tier1_$(printf '%(%Y%m%d)T' -1).dump"
# Shot だけの CSV も併取（人間可読・件数確認用）
psql "$DIRECT_URL" -c '\copy (SELECT * FROM "Shot" ORDER BY "createdAt") TO '"'"'backups/shots_pre_tier1.csv'"'"' CSV HEADER'
```
検証: `pg_restore -l backups/..dump | head`（中身一覧が出る）／CSV 行数 = 9-0 の shots 件数 +1（ヘッダ）。

<known-fact>schema.prisma に `directUrl = env("DIRECT_URL")`（9行）。migration・pg_dump は **pooled の DATABASE_URL ではなく DIRECT_URL** を使う（Neon の pooler 経由だと DDL/ダンプが不安定）。</known-fact>

### 9-2. マイグレーション適用

```bash
# (1) dev/ステージング DB で生成（schema.prisma を §4 の after に編集後）
npx prisma migrate dev --name tier1_foundation
#   → prisma/migrations/<ts>_tier1_foundation/migration.sql が生成される

# (2) 生成 SQL の末尾に RLS を手動追記（§4.5 の(6)）
#     ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;
#   （Prisma は RLS を生成しないため必須。レビューで diff 確認）

# (3) 本番へ適用（DIRECT_URL）
npx prisma migrate deploy

# (4) Prisma Client 再生成（型を新スキーマに更新）
npx prisma generate
```
検証:
```bash
npx prisma migrate status                     # Applied になっているか
psql "$DIRECT_URL" -c '\d "Round"'            # テーブル・index・FK
psql "$DIRECT_URL" -c '\d "Shot"'            # clientId(unique)/roundId/holeNumber/distance(nullable)
psql "$DIRECT_URL" -c "SELECT relrowsecurity FROM pg_class WHERE relname='Round';"  # t（RLS有効）
psql "$DIRECT_URL" -c 'SELECT count(*) FROM "Shot" WHERE distance IS NULL;'         # 0（既存値不変）
```

<known-fact>(1)〜(5) の DDL は既存187件を書き換えない（distance は型の NOT NULL 解除のみ・値不変、他は ADD COLUMN/CREATE）。データ移行（UPDATE）は伴わない。</known-fact>

### 9-3. 重複検出・計測（measure → 必要時のみ削除）

<task>提案書§4.2 の重複検出（`userId × createdAt × club × result` 一致）。**まず SELECT で計測**、件数が想定（1グループ3行）通りか確認してから削除を判断。</task>

**計測（read-only）**: 9-0 の HAVING クエリで重複グループと余剰行数を確定。
**削除（最小id温存・実行は計測後の承認制）**:
```sql
-- 各重複グループで最小 id を残し、それ以外を削除（実行前に必ず BEGIN; ... 確認 ... COMMIT;）
BEGIN;
WITH d AS (
  SELECT id, row_number() OVER (
    PARTITION BY "userId","createdAt",club,(result::text) ORDER BY id
  ) AS rn
  FROM "Shot"
)
DELETE FROM "Shot" WHERE id IN (SELECT id FROM d WHERE rn > 1);
-- 件数確認（想定: 3行）。問題なければ COMMIT、違えば ROLLBACK
COMMIT;
```
検証: 削除件数が計測した余剰行数（想定3）と一致。削除後に 9-0 の HAVING が0件。

<risk>
重複削除は**破壊的**。Neon ブランチ（9-1A）取得後・トランザクション内で実行し、件数が想定と乖離したら ROLLBACK。clientId 導入後は新規重複が出ないため、この削除は**一度きりの過去清掃**。108件ユーザーの行が誤って消えないよう、削除前後で当該 userId の件数を必ず確認。
</risk>

### 9-4. ロールバック手順

| 状況 | 手段 | 備考 |
|---|---|---|
| 新クライアント出荷**前**に問題発覚 | **Neon ブランチ（9-1A）へ接続切替** | 即時・全復元。最優先手段 |
| ブランチが無い／個別復元 | 逆 DDL を手動適用 | 下記。**新カラムに新データが入る前のみ安全** |
| データ破損 | `pg_restore` で論理ダンプ復元 | `pg_restore --clean --if-exists -d "$DIRECT_URL" backups/...dump` |

逆 DDL（追加のみだったため単純。**null distance や clientId が新クライアントから書かれる前に限り完全可逆**）:
```sql
ALTER TABLE "Shot" DROP CONSTRAINT IF EXISTS "Shot_roundId_fkey";
DROP INDEX IF EXISTS "Shot_roundId_idx";
DROP INDEX IF EXISTS "Shot_clientId_key";
ALTER TABLE "Shot" DROP COLUMN IF EXISTS "holeNumber";
ALTER TABLE "Shot" DROP COLUMN IF EXISTS "roundId";
ALTER TABLE "Shot" DROP COLUMN IF EXISTS "clientId";
DROP TABLE IF EXISTS "Round";
-- distance を再 NOT NULL 化するのは「null 値が無い」ことを確認後のみ
-- SELECT count(*) FROM "Shot" WHERE distance IS NULL;  -- 0 を確認してから↓
ALTER TABLE "Shot" ALTER COLUMN "distance" SET NOT NULL;
```
<risk>
**可逆性の窓**: 新クライアントが null distance や clientId を書き始めた後は、`distance SET NOT NULL` が失敗し、clientId/roundId を落とすと新データの同期情報を失う。→ ロールバックは「新クライアント出荷前」を原則とし、出荷後は Neon ブランチ＋前方修正（roll-forward）で対応する。
</risk>

---

## 10. 実装順序（依存関係）

<context>
鉄則（§5.7）: **デプロイ順序は「スキーマ→API→クライアント」**。新クライアントを旧サーバーに当てない。以下は着手・リリースの推奨順。各ステップ後に CLAUDE.md のビルド/リント確認を行う（push 前）。
</context>

| # | ステップ | 依存 | 本番DB | 独立リリース可 |
|---|---|---|---|---|
| 0 | **TTL（item3, §7）** | なし（client-only） | 触らない | ◯（最初に出せる・最小リスクの可視成果） |
| 1 | **バックアップ＋計測（§9-0,9-1）** | なし | read-only | — |
| 2 | **Prisma migration（item2,5・§4,9-2）** | 1 | DDL適用 | サーバーのみ（UI 不変） |
| 3 | **API 改修（item1,2・§6）** POST upsert＋distance撤廃／GET 新カラム | 2 | — | サーバーのみ |
| 4 | **Dexie v6（item6・§4.4）** clientId backfill＋rounds＋dirty | なし（client）※2と並行可 | — | クライアント |
| 5 | **記録時 clientId 生成（§5.2）** | 3,4 | — | クライアント |
| 6 | **sync 置換（item1・§5.3,5.5,5.6）** push/pull 冪等化・SW依存撤廃 | 3,4,5 | — | クライアント |
| 7 | **編集 PUT 配線（item4・§8）** serverId回収＋dirty | 3,4 | — | クライアント |
| 8 | **重複清掃（§9-3）** | 2 | DELETE | 一度きり・承認制 |

着手順の要点:
- **#0 TTL を最初に**（独立・即効・本番DB非依存）。宮川さんに「何か直った」を最速で見せられる。
- **#2→#3 をサーバー先行**でデプロイ（API が新スキーマと clientId/null distance を受けられる状態に）。
- **#4 Dexie v6 は #2 と並行**で作れる（client-only）が、リリースは #3 の後（新クライアントが旧サーバーに当たらないよう #5,#6 と束ねる）。
- **#5,#6,#7 はまとめて1クライアントリリース**にすると mixed 期間を最短化できる。
- **#8 重複清掃は #2 後の任意タイミング**（一度きり）。

---

## 11. テスト観点

<verification>
### 同期の冪等性（最重要）
- 同一 `clientId` を**2回 POST** → サーバー Shot が**1行**（2行目は upsert で収束、件数不変）。
- POST 成功・**応答ロストを模擬**（クライアントは catch）→ 再 push → 重複が**増えない**（clientId upsert）。
- `serverId != null` のショットは push 対象に**入らない**（`.filter(s => !s.serverId)` の確認）。
- push 成功後、ローカル件数が**減らない**（bulkDelete 廃止の確認）。serverId が書かれている。
- 同時2リクエスト（同一 clientId）で `P2002` を発生させ、**500 にならず**既存行で 200 を返す（findUnique フォールバック）。
- pull: clientId 一致で重複取り込みが起きない。clientId=null の旧データは createdAt fallback で1件に収束。

### distance null
- distance 未入力（null）で保存 → POST が **400 を返さず** 201/200、サーバーに保存される（サイレント欠損の解消）。
- 分析（analysis/dashboard）が distance=null 混在データで**クラッシュせず**、平均・距離帯集計から null が除外される（§6.4 のガード経路）。

### 位置・気温 TTL
- `lastLocationData.timestamp` を**前日**に偽装 → 記録画面で再 `autoCollect` が走る（古いコース名が付かない）。
- 同日中の2回目の記録ではキャッシュを再利用（再取得が走りすぎない）。

### 編集 PUT
- オンライン編集 → サーバー `Shot` が更新される（PUT 200、`updatedAt` 進む、所有者外は 403）。
- オフライン編集 → ローカル `dirty=true` → オンライン復帰で PUT 反映 → `dirty=false`。
- serverId 未付与（未同期）ショットの編集 → PUT は走らず、通常 push で編集後の値が create される。

### migration
- 適用後: `\d "Shot"` に clientId(unique)/roundId/holeNumber、distance が nullable。`\d "Round"` 存在。`Round` の RLS が `t`。
- 既存187件: distance 値不変・件数不変・`distance IS NULL` が0。
- 旧クライアント（clientId 無し POST）が **mixed 期間で従来通り保存**できる（create フォールバック）。
- ロールバック逆DDL がエラーなく通る（新データ書き込み前の窓で）。

### 回帰
- `components/Layout.tsx:47` の pull、`components/Providers.tsx:50` の auto-sync が新フローで動作。
- トライアル制限（§trial）が**変わっていない**（ユニーク日付3日で confirm 表示）。
</verification>

---

## 12. リスクと未確認事項

<risk>
1. **デプロイ順序事故**: 新クライアント×旧サーバーで clientId/null distance が弾かれる。→ §10 の「スキーマ→API→クライアント」を厳守。
2. **upsert の race（P2002）**: §5.4 のフォールバック必須。テスト §11 で担保。
3. **重複清掃の破壊性**: §9-3。Neon ブランチ＋トランザクション＋件数照合で防御。108件ユーザーの行誤削除に特に注意。
4. **可逆性の窓**: 新クライアント出荷後は完全ロールバック不可（§9-4）。出荷前にロールバック判断を済ませる運用。
5. **RLS 追記漏れ**: Round だけ RLS 非適用になる。§9-2(2) をレビュー必須項目に。
6. **IndexedDB の index 制約**: `serverId==null` を `.where().equals(null)` で引くと**ヒット0の静かな同期不全**。`.filter` 厳守（§4.4 gotchas）。実装レビューで確認。
7. **SW 空関数の残置**: Option A では no-op として残すが、将来「直ったはず」と誤認されないようコメントで「同期はクライアント主導（lib/sync）」と明記する。
</risk>

<unconfirmed>
1. **本番の現時点実数**（移行直前に §9-0 で再計測）。提案書は 2026-06-13 時点 187件。
2. **PUT で distance を明示 null 更新**する経路（§6.2）。Tier 1 の編集要件では不要の見込みだが、必要化したら分岐追加。
3. **`currentShot` の persist 欠如**（入力途中の揮発）は事実だが**本設計のスコープ外**（2段目で対応）。記録のみ。
4. **108件ユーザーの正体**（本人か実ユーザーか）は引き継ぎ未確定。データ保全方針は同じだが、お知らせ配慮に影響。
5. **Neon CLI（neonctl）の利用可否**。使えない環境なら §9-1A はコンソール操作 or §9-1B のダンプのみで代替。
6. **mixed 期間の長さ**: サーバー先行デプロイから新クライアント出荷までの間、旧クライアントが clientId 無しで POST し続ける。この間の重複は旧来同等（clientId upsert の恩恵を受けない）。期間を短くするほど良い。
</unconfirmed>

---

## 13. オーナー（宮川さん）確認事項（設計確定の前に1問ずつ）

<next-action>
本設計は「土台7項目・追加とnullable化のみ・Round はスキーマだけ」で閉じている。実装着手の前に、以下を**1問ずつ**確認したい（引き継ぎ §next-action 5 に従い、まとめて聞かない）。

1. **Round.clientId を Tier 1 で先に入れるか**（前方互換のため）。本設計は「Tier 2 で対称に追加」で提案書準拠。Dexie 側は枠だけ予約済み。Tier 1 で Prisma にも入れておけば Tier 2 の migration が1回減る。
2. **重複清掃（§9-3）を Tier 1 でやるか／Tier 2 へ送るか**。1グループ3行と軽微なので、清掃を急がない選択もある（clientId 導入で新規重複は止まる）。
3. **mixed 期間の許容**: サーバー先行→新クライアント出荷の間隔をどれだけ詰められるか（同日リリース可能か）。
4. **TTL を単独で先行リリースしてよいか**（§10 #0）。本番DB に触れず即出せる最小の可視成果。

※ `strength`/`feeling` の廃止・トライアル制限の再設計は提案書§6のオーナー判断事項だが、**いずれも Tier 1 では触らない**ため本設計の確定には不要（Tier 2 以降で扱う）。
</next-action>

---

## 付録: 変更ファイル一覧（実装フェーズの対象。設計のみ・本書では未変更）

| ファイル | 変更内容 | 項目 |
|---|---|---|
| `prisma/schema.prisma` | Shot 変更（distance Int?/clientId/roundId/holeNumber/round relation/index）、Round 新設、User に rounds | 2,5 |
| `prisma/migrations/<ts>_tier1_foundation/migration.sql` | 生成＋RLS手動追記 | 5,7 |
| `lib/db/index.ts` | Dexie `version(6)`＋interface（Shot 追加フィールド/Round）／pull を clientId 照合へ | 1,6 |
| `lib/sync.ts` | `syncShots` を冪等 push へ全面置換（serverId フィルタ＋clientId＋削除廃止）＋dirty PUT | 1,4 |
| `public/sw.js` | 空 `syncShots` の扱い（no-op 残置＋コメント明記。Option A） | 1 |
| `app/api/shots/route.ts` | POST: distance必須撤廃＋clientId upsert（P2002 フォールバック）＋roundId/holeNumber 受理 | 1,2 |
| `app/api/shots/[id]/route.ts` | 改修ほぼ不要（必要時のみ distance null 分岐） | 4 |
| `app/record/page.tsx` | 記録時 clientId 生成（§5.2）／編集時 serverId 回収＋PUT 配線（§8）／lastLocationData TTL（§7） | 1,3,4 |
| `components/Providers.tsx` | online ハンドラで client 主導 push を直接呼ぶ（§5.6 Option A） | 1 |

以上。
</content>
</invoke>
