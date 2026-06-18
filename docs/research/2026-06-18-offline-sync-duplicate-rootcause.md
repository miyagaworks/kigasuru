# 2026-06-18 オフライン同期 重複バグ root-cause 調査報告（読み取り専用調査）

<correction severity="high" date="2026-06-18">
⚠️ **本報告書の「具体シナリオ」は実データで誤りと判明。再採用禁止。**

本報告は主因を「編集対象ローカル行が `serverId==null` で、handleSave パス④の create-push が別行を作る」と断定している（§0・§1）。
だが Super が実機取得した有効DBは **serverId 無=0（全 115 行が serverId を保有）** で、この前提と矛盾する。

- ❌ 無効: 「serverId==null 起点の create-push 重複」という**具体シナリオ／発生機序の断定**。
- ✅ 有効: 「`syncShotsFromServer` が **serverId で照合していない**（実効キーが clientId/createdAt のみ）」という**構造的洞察**。これが真因で、Layout マウント毎の pull が同一サーバー行のローカルコピーを増殖させていた。

実コード＋実データを正とし、Phase 1 修正（serverId 最優先照合）でこの真因を直接封鎖済み。
詳細は `docs/handover/2026-06-18-local-shot-dedup-handover.md` の `<finding type="correction">` を参照。
</correction>

調査者: 調査CC（読み取り専用）。コード修正・コミット・DB操作・npm install は一切行っていない。
対象コミット: origin/main 先端（#7 編集PUT配線 `53f0953` 反映後の現行コード）。
凡例: [事実]=Read/Grep で file:line 確認済 / [推測]=コードから直接裏取りできない（本番データ状態に依存）。

---

## 0. 結論サマリ

- **重複バグの構造的 root-cause は「重複排除がクライアント側で実質 `clientId` 一致のみに依存しており、その `clientId` がローカル↔サーバー間で不整合（NULL/undefined または別値）になり得る経路が複数あること」。** `createdAt` フォールバック照合はクライアント生成行に対して機能しない（サーバーが POST 時に自前 createdAt を採番するため）。
- 観測症状「元の記録(150)が更新されず、編集後の値(155)を持つ新規レコードが増えて二重」は、**編集対象のローカル行が `serverId==null` の状態で編集され、handleSave のパス④（no-op）に落ち、オンライン復帰時の create-push が "サーバー側の元行を更新できず新規行を作る"** ことで成立する。元行(150)はサーバーに残り、`syncShotsFromServer` が `clientId` でも `createdAt` でも照合できずに別ローカル行として再追加する。
- 重複2行の `clientId` は **「同一の非NULL値ではない」＝両方 NULL（最有力）または互いに別値**。同一非NULL ならサーバーの `clientId @unique` upsert が1行に収束するため、定義上重複し得ない。
- 自動取得エラー残留は、**record ページに online 復帰トリガが無く、`autoCollect` が再実行されない**ため。`autoCollectStatus.error` は `autoCollect` の再成功でしか消えない。

---

## 1. 重複バグの root-cause（発生機序の断定）

### 1-A. 確定している土台（すべて file:line 事実）

**[事実] 重複排除は `clientId` 一致が唯一の実効キー。`createdAt` フォールバックは死んでいる。**
- pull 照合は `clientId` 優先・`createdAt` フォールバック: `lib/db/index.ts:619-625`
  ```
  let local = serverShot.clientId ? localShotsByClientId.get(serverShot.clientId) : undefined;
  if (!local) local = localShotsByCreatedAt.get(serverCreatedAt);
  ```
- サーバーは POST 本文に `createdAt` を受け取らない（`app/api/shots/route.ts:23-44` の分割代入に createdAt なし、`66-88` の保存フィールドにも無し）。スキーマは `createdAt DateTime @default(now())`（`prisma/schema.prisma` Shot モデル）。→ **クライアント生成ショットは local.createdAt（クライアント時刻 = `Date.now()`、`lib/db/index.ts:198`）≠ server.createdAt（サーバー時刻）** となり、`localShotsByCreatedAt.get(serverCreatedAt)` は外れる。
- 設計書も createdAt 照合を「脆い照合」と明記（`docs/plans/2026-06-13-tier1-foundation-design.md:86`）。
- 補足 [事実]: pull で取り込んだ行は `createdAt: serverCreatedAt` で保存される（`lib/db/index.ts:648`）。つまり「サーバー由来(pull)の行」だけは createdAt がサーバー値で一致するため createdAt フォールバックが効く。**createdAt 照合が破綻するのは「この端末でローカル作成された行」に限定される。**

**[事実] `clientId` は NULL/undefined になり得る。**
- スキーマ `clientId String? @unique`（nullable・グローバル unique・複数NULL許容、`prisma/schema.prisma`）。設計書 `223` 行「既存187件は clientId=NULL のまま共存」。サーバー migration は列追加のみで既存行へ clientId を採番しない。
- POST で `clientId` が無ければ旧互換 create（NULL 行を作る）: `app/api/shots/route.ts:133-138`。
- push 時 `clientId: shot.clientId`（`lib/sync.ts:44`）。`shot.clientId` が undefined なら JSON.stringify で本文から脱落 → サーバー `if (clientId)` が falsy（`route.ts:93`）→ 旧互換 create。**clientId 無しの行は push のたびに新規 NULL 行を生む（収束しない）。**
- 過去にローカル `clientId` を捨てていた時期がある（`docs/handover/2026-06-15-...B-6-sync-complete-handover.md:47-51`：「addShot が段階2以降 clientId を破棄」→ `a4f7c0d` で修正）。その期間にオフライン作成された行はローカル clientId=undefined。

**[事実] 編集は in-place 更新のみ。新規ローカル行は作らない。**
- handleSave 編集分岐は `updateShot(localId, fields)` のみ（`app/record/page.tsx:573-601`）。`addShot` を呼ぶのは新規作成分岐だけ（`642`/`649`/`654`）。
- 履歴の編集導線は `?edit=${shot.id}`（ローカルID、`app/history/page.tsx:310`）。履歴は IndexedDB のローカル行を表示（`getAllShots`、`history/page.tsx:54-57`）。→ **観測された重複2行は IndexedDB 上に実在する2行**。編集分岐は1行しか触らないので、**2行目は `syncShotsFromServer`（`lib/db/index.ts:627-651`）がサーバー行をローカル不一致と判定して `addShot` した行**である（これが唯一のローカル行増加経路。`addShot` 呼び出し元は record 新規分岐・syncShotsFromServer・設定インポートのみ。`grep` 済）。

**[事実] handleSave 編集分岐のパス分け（`app/record/page.tsx:570-601`）**
- ① ローカル更新 `updateShot(localId, toEditableFields(currentShot))`（`573-577`）。`toEditableFields` は17項目限定で serverId/clientId/dirty/createdAt を除外（`lib/db/index.ts:420-438`）→ Dexie マージで serverId/clientId は温存される。
- ② online && editServerId → 即 PUT、失敗で dirty=true（`580-595`）。
- ③ offline && editServerId → dirty=true（`596-598`）→ 復帰時 `pushDirtyShots` が PUT（`lib/sync.ts:76-111`）。
- ④ **editServerId が無い（serverId==null）→ 何もしない**（`600-601` のコメント「通常の push（create）が編集後の値ごと拾う」）。dirty も付けない。
- `editServerId` は編集ロード時に `getShot()` の `shot.serverId` から確保（`app/record/page.tsx:306-311`）。→ **ローカル行の serverId が null なら editServerId も null → 必ずパス④**。

### 1-B. 観測症状から逆算した serverId 状態の断定

[事実→論理的断定] 症状は「元行(150)がサーバーに残存」かつ「編集値(155)が新規行」。
- もし編集対象が serverId を持っていれば（パス③）、復帰時 `pushDirtyShots` が `PUT /api/shots/{serverId}` で**サーバーの元行自体を155に更新**する（`lib/sync.ts:88-98`）。この場合サーバーに150は残らない（=症状不成立）。
- 元の150がサーバーに残るのは、**編集がサーバーの元行を一切アドレスしなかった**＝パス④（create-push）で**別の新規行**を作った場合のみ。
- ∴ **編集対象ローカル行は編集時点で `serverId==null`** だったと断定できる（症状からの逆算）。pull 由来行は必ず serverId を持つ（`lib/db/index.ts:644`）ので、**この行は pull 由来ではなく「この端末でローカル作成され、serverId を取得できていない行」**。

### 1-C. 重複発生の1本シナリオ（断定）

前提行 L1（この端末でオフライン作成、`clientId` を持たない＝旧 addShot 破棄期 or 何らかの理由で clientId 不在、かつ過去に1度サーバーへ到達したが serverId 書き戻しを取りこぼした行）:
- L1 = `{ serverId: null, clientId: undefined, distance:150, memo:"", createdAt: T_local }`
- サーバー S1 = `{ clientId: NULL, distance:150, createdAt: T_server }`（過去 push で生成、応答ロストで L1.serverId 未書込）

1. **オフライン編集**（150→155, memo追加）: `updateShot(L1.id, toEditableFields)` で L1 が155+memo に in-place 更新（`app/record/page.tsx:573-577`）。serverId/clientId は温存され依然 `null/undefined`。editServerId=null → **パス④で dirty も付かない**（`600-601`）。
2. **オンライン復帰**: `setupAutoSync` の online ハンドラ（`lib/sync.ts:153-164`、`Providers` 経由でアプリ全体にマウント `app/layout.tsx:75`）→ `triggerPush`（`lib/sync.ts:124-137`）。
   - `pushUnsyncedShots`: L1 は `!serverId` で対象（`lib/sync.ts:12`）。POST 本文の `clientId: shot.clientId` は undefined → 脱落（`sync.ts:44`）。サーバーは `if(clientId)` falsy → **旧互換 create で新規 S2 を作成**（`route.ts:133-138`）。S1(150) は touch されない。成功で L1.serverId=S2 を書込（`sync.ts:50-52`）。
   - サーバー状態: S1(150, clientId NULL) ＋ S2(155, clientId NULL)。
3. **`syncShotsFromServer`**（履歴/ダッシュボード等で `Layout` マウント時にオンラインなら発火、`components/Layout.tsx:34-55`）が S1,S2 を pull:
   - S2(155, clientId NULL): clientId NULL → createdAt フォールバック（`db/index.ts:619-625`）。S2.createdAt(サーバー時刻) はどのローカル行とも一致せず → **新規 addShot（155 の重複行）**。
   - S1(150, clientId NULL): 同様に照合不能 → **新規 addShot（元の150が別行として復活）**。
4. 結果: ローカルに「155(編集後)」と「150(復活した元行)」が併存。履歴は IndexedDB を表示するため両方見える（症状一致）。

[推測] この具体シナリオの **前提（L1 が serverId=null かつ clientId 不在）が成立する原因**は本番データ履歴に依存する（DB 参照は禁止のため未確認）。最有力は「addShot が clientId を破棄していた期間（`470028c`→`a4f7c0d`、いずれも 2026-06-15）にオフライン作成され、push 応答ロストで serverId 未書込のまま残った行」。次点は「clientId 導入前のローカル作成行」。**現行コードで新規に作った清浄な行（clientId あり）では本バグは再現しない**（下記 1-D）。

### 1-D. 反証：清浄データでは重複しない（バグがデータ依存である根拠）

[事実・トレース] 現行コードで online 作成された行は L1=`{serverId:S1, clientId:C1}`／サーバー S1=`{clientId:C1}`。
- オフライン編集（パス③）→ 復帰 `pushDirtyShots` が `PUT /api/shots/S1`（serverId で更新）→ サーバー S1=155。
- `syncShotsFromServer`: S1 を `clientId=C1` で照合（`db/index.ts:620-621`）→ ローカル L1 に一致 → 新規追加なし。
- → **重複なし**。clientId が一致する限りどの経路でも収束する（`pushUnsyncedShots` 経路でもサーバー `findFirst({clientId,userId})→update`、`route.ts:96-102` で収束）。
- ∴ 重複は **clientId 不整合が前提**であり、清浄データでは発生しない。

### 1-E. 重複2行の clientId

**両行とも `clientId = NULL`（サーバー側）/ `undefined`（ローカル側）になっているはず（最有力）。**
- 理由: 同一の非NULL clientId であれば `route.ts:96` の `findFirst({clientId,userId})` が既存行を見つけて update し、サーバー側は1行に収束する（`@unique` 制約・`route.ts:104-131` の P2002 フォールバックも同 clientId を1行に寄せる）。重複が残るのは少なくとも一方が NULL（Postgres は複数NULLを許容）か、互いに別 clientId の場合のみ。
- 本シナリオでは create-push が clientId 無しで2回新規生成するため、**S1・S2 とも clientId=NULL**。pull で取り込んだローカル2行も clientId=undefined。
- まとめ: **「同一」ではない。両方 NULL が最有力、あるいは互いに別値。**

---

## 2. 自動取得エラー残留の root-cause

**[事実] record ページには online 復帰で `autoCollect` を再実行する経路が存在しない。**
- `autoCollectStatus.error` をクリアするのは次の3点のみ: `autoCollect` 開始時 `error:null`（`app/record/page.tsx:326`）／成功時（`351-356`）／保存済みデータ採用時（`419-431`）。
- これらを呼ぶのは `autoCollect()`（手動「再取得」ボタン `1561`/`1698`、または `loadOrCollectData`）と、`loadOrCollectData`（`396-445`）のみ。`loadOrCollectData` の依存配列は `[editId]`（`445`）でマウント時1回だけ。**`online` を依存にも持たず、`window`/`document` の `online`・`visibilitychange` リスナも record ページには無い**（`grep` 済: record ページの `addEventListener` はドラッグ用 mouse/touch のみ `1333-1372`）。
- オフライン時 `autoCollect` は `getWeather`/`getLocationName`（ネットワーク必須）で throw → `catch` で `error` セット＋手動入力フォーム表示（`374-383`）。
- ∴ **オンライン復帰しても `autoCollect` は自動再実行されず、`autoCollectStatus.error` が残り続ける。** 消すには手動「再取得」が必要。online 復帰で自動的に状態をクリア/再取得する実装が欠落しているのが root-cause。
- 補足 [事実]: `Providers` の online ハンドラは `setShowOfflineNotice(false)` のみ（`components/Providers.tsx:38-40`）で、record の autoCollect 状態には無関係。

---

## 3. 深刻度と影響範囲

| バグ | 深刻度 | 影響範囲 |
|---|---|---|
| (1) 重複 | **高** | データ整合性。重複行が分析（平均飛距離・件数・統計 `lib/db/index.ts:252-298`）を直接汚染。clientId 不整合行（旧 addShot 破棄期・clientId 導入前のローカル作成行）を持つユーザーが、オフライン編集→復帰、または単に `syncShotsFromServer` を通すたびに重複し得る。**本質は「createdAt 照合の死＋clientId 不整合」**で、編集は誘発トリガの一つ。`syncShotsFromServer` が serverId で照合しない（後述）ため、clientId 不整合行は再 pull で増殖する恐れ。 |
| (1-付随) create-after-edit 汚染 | 中〜高 | [事実] 編集成功後 `router.push('/record')`（`page.tsx:617`）は currentShot をリセットしない。`setCurrentShot` は実行時スプレッドで編集行の serverId/clientId/id を currentShot に載せる（`lib/store/index.ts:106-113`）。直後にオフラインで新規作成すると `shotData={...currentShot, clientId:新規}`（`page.tsx:623`）が**旧 serverId を引き継ぎ**、`addShot` が `serverId: shotData.serverId`（`lib/db/index.ts:180`）でその旧 serverId を持つ別行を作る → serverId 衝突。今回の主症状とは別経路だが要修正。 |
| (1-付随) stale 編集 state | 低〜中 | [事実] `editServerId`/`editLocalId` は editId が null になっても解除されない（ロード effect は `if(editId)` ガード `page.tsx:304`）。別記録の編集→新規遷移で値が残る。現状 create 分岐は未使用だが将来の地雷。 |
| (2) autoCollect エラー残留 | 低〜中 | UI 表示のみ。データ破損なし。手動「再取得」で回復可能だが、復帰後も失敗表示が残りユーザーを誤認させる。位置情報・天気が手動入力に流れる。 |

---

## 4. 提案する修正方針（変更ファイルと方針のみ・コードは書かない）

### 重複バグ（最優先）
1. **`lib/db/index.ts` `syncShotsFromServer`（602-661）に serverId 照合を追加**（最も直接的な再 pull 重複の封鎖）。現在は clientId→createdAt のみで、**serverId 一致の照合が無い**。「サーバー行の id が既にローカルのどれかの serverId と一致するなら同一行」を最優先キーにすれば、clientId/createdAt が外れても既存行へ収束し、別行追加を防げる。`localShotsByServerId` Map を1つ足す方針。
2. **`lib/db/index.ts` pull 時にサーバー clientId が NULL の行へ clientId を確定・逆同期**（恒久対策）。pull で照合できた行に clientId を採番し、`PUT`（または専用 API）でサーバーへ書き戻して NULL を解消。以後 clientId 一本で収束させる。※サーバー側 API 追加要否を別途設計。
3. **`app/record/page.tsx` 編集分岐パス④の補強**（573-601）。編集対象が `serverId==null` かつ `clientId` 不在の場合、create-push 前に clientId を確定（`updateShot(localId,{clientId})`）してから push に委ねる。clientId が必ず付けば create-push がサーバーで収束する。
4. **`app/record/page.tsx` create-after-edit 汚染の遮断**（617・623・669-688）。編集成功後に `resetCurrentShot()`（`lib/store/index.ts:116-123`）を呼ぶ、または create 分岐の `shotData` 構築時に serverId/id/dirty を明示除外する。あわせて editId が null のとき `editServerId`/`editLocalId` を null へ戻す。
5. **段階4 重複清掃（設計書 §9-3）**: 既に発生した本番重複の計測→承認制で DELETE。clientId 確定（上記2）後に実施。
6. （任意）**`app/api/shots/route.ts` POST**: clientId 欠落時に `(userId, createdAt)` 等での dedup を入れる案もあるが、createdAt 不一致のため効果薄。クライアント側（1〜3）を優先。

### 自動取得エラー残留
7. **`app/record/page.tsx`**: `online` 復帰リスナを追加し、編集中でない（`!editId`）かつ error 状態のとき `autoCollect()` を再実行（または最低限 `autoCollectStatus.error` をクリア）。`loadOrCollectData` の依存に online を絡めるか、専用 `useEffect` で `window.addEventListener('online', ...)` を張りクリーンアップする方針。`visibilitychange` も併用すると PWA 前面化で回復。

---

## 5. 修正前に追加で実機確認すべき点

1. **問題の記録のローカル行を DevTools→IndexedDB（`KigasuruDB_<userId>` の `shots`）で確認**: 重複2行それぞれの `serverId`（null か）・`clientId`（null/undefined か別値か）・`createdAt`。本報告の「編集行 serverId=null・clientId 不在」断定の直接確認になる。
2. **サーバー側の該当ショット行数と clientId** を管理経路で確認（本調査では DB 参照禁止のため未確認）。元行(150)の clientId が NULL か。
3. **清浄データでの非再現確認**: 現行コードでオンライン新規作成（clientId 必ず付与）→オフライン編集→復帰、で**重複しない**ことを確認（1-D の検証）。再現が「clientId 不整合の旧行」限定であることの裏取り。
4. **#7 ケースB（オフライン編集→dirty→復帰 PUT→dirty=false）の実機スモーク**（`docs/handover/2026-06-16-...#7...:72,98` で未確認と明記）。serverId を持つ清浄行で正しく1行更新に収束するかを確認。
5. **`syncShotsFromServer` 単独での重複有無**: 編集せず履歴/ダッシュボードを開く（Layout マウント→sync）だけで重複が増えるか。増えるなら clientId 不整合の再 pull 増殖（深刻度引き上げ）。
6. autoCollect: オフライン→失敗表示→オンライン復帰で、手動「再取得」を押さずに表示が残ることを確認（2 の裏取り）。

---

## 付録: 確認した主な file:line

- 編集分岐/パス④: `app/record/page.tsx:570-601`（特に 600-601 no-op、580-598 dirty 分岐）
- editServerId 確保: `app/record/page.tsx:301-322`（306-311）
- 新規作成分岐/clientId 生成: `app/record/page.tsx:619-655`（623 生成、642/649/654 addShot）
- create-after-edit 汚染源: `app/record/page.tsx:617`（reset せず遷移）、`lib/store/index.ts:106-113`（setCurrentShot 実行時スプレッド）
- autoCollect 定義/エラー: `app/record/page.tsx:325-384`、表示 `1556-1575`、再取得 `1561`/`1698`
- loadOrCollectData（online 非依存）: `app/record/page.tsx:396-445`
- record ページに online リスナ無し: `grep` 済（mouse/touch のみ `1333-1372`）
- push（create）: `lib/sync.ts:10-66`（12 フィルタ、44 clientId、50-52 serverId 書込）
- push（dirty PUT）: `lib/sync.ts:76-111`、`triggerPush` `124-137`、`setupAutoSync` `149-175`
- POST upsert/旧互換 create: `app/api/shots/route.ts:93-138`
- PUT（serverId 更新）: `app/api/shots/[id]/route.ts:61-126`
- pull 照合（clientId→createdAt・serverId 照合なし）: `lib/db/index.ts:602-661`（619-625 照合、644/648 serverId/createdAt 設定、649 clientId 正規化）
- createdAt 採番（サーバー）: `app/api/shots/route.ts:66-88`（createdAt 無し）＋ `prisma/schema.prisma` `createdAt @default(now())`
- v6 clientId backfill（ローカルのみ・サーバー未採番）: `lib/db/index.ts:115-122`
- Providers/Layout マウント: `app/layout.tsx:75`、`components/Layout.tsx:34-55`
- 設計書 createdAt 脆弱性/既存NULL: `docs/plans/2026-06-13-tier1-foundation-design.md:86,223`
- 旧 addShot の clientId 破棄（既修正）: `docs/handover/2026-06-15-tier1-stage3-B-6-sync-complete-handover.md:47-51`
- #7 ケースB 未検証: `docs/handover/2026-06-16-tier1-stage3-7-edit-put-complete-handover.md:72,98`
</content>
</invoke>
