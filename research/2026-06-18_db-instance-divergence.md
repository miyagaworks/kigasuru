# 調査報告：DBインスタンス二重化バグの実害範囲

- 対象: `/Users/miyagawakiyomi/Projects/kigasuru`
- 種別: 読み取り専用調査（コード変更なし）
- 日付: 2026-06-18
- 凡例: 事実は `ファイル:行` で根拠提示。推測は **[推測]**、未検証は **[要検証]** を付す。

---

## 0. 結論サマリ（TL;DR）

**「保存系（`getDB()`）」と「同期push系（固定 `db`）」は、ログイン済みユーザーが `initDB` を一度通った時点で、条件付きではなく決定論的に別DBを指す。**

- 保存系の参照先 … `KigasuruDB_${userId}`（ユーザーDB、正）
- push系の参照先 … `KigasuruDB`（userIdなしのフォールバックDB、誤）

理由は、`lib/db/index.ts:173` の `export const db = getDB()` が **モジュール評価時（バンドル読込時）に1回だけ**評価され、その時点では `initDB` が未実行のため必ずフォールバック `new KigasuruDB()`（名前 `KigasuruDB`）が `db` に固定されるため。`initDB` は React の `useEffect` 内でしか呼ばれず（`components/Layout.tsx:32` / `app/history/page.tsx:39`）、モジュール評価より後にしか走らない。したがって `db` がユーザーDBを指すことは**原理的に起こり得ない**。

さらに `initDB` はフォールバックを `dbInstance.close()`（`lib/db/index.ts:149`）で**閉じる**。Dexie 4 の `close()` は引数なしだと `disableAutoOpen: true` が既定（`node_modules/dexie/dist/dexie.js:5556`）で、閉鎖後の操作は `DatabaseClosed` で reject される（同 `:1116` `:1120`）。よって `initDB` 通過後は固定 `db` への `db.shots.*` が**例外を投げる**。

**実害の核心**: `serverId == null` のショット（＝オフライン作成、またはオンライン保存のサーバー失敗で生成）を server へ送る唯一の自動経路 `pushUnsyncedShots()`（`lib/sync.ts:10-66`）が、空 DB ないし閉鎖済み DB を読むため、**ユーザーDB内の未同期ショットを永久に push しない**。`Providers.tsx:87` がユーザーに約束する「記録したデータは次回オンライン時に同期されます」は、この経路では成立していない **[推測：実機未確認だがコード上は成立しない]**。

---

## 1. コード上の事実（根拠）

### 1.1 DB名とインスタンス管理（`lib/db/index.ts`）

| 行 | 内容 |
|---|---|
| `64-67` | `constructor(userId?)` → `const dbName = userId ? `KigasuruDB_${userId}` : 'KigasuruDB'` |
| `127-128` | モジュールスコープ可変変数 `let dbInstance` / `let currentUserId` |
| `137-158` | `initDB(userId)`: 同ユーザーなら再利用（`141`）、別ユーザーなら旧を `close()`（`149`）、新規 `new KigasuruDB(userId)`（`156`）、`currentUserId = userId`（`155`） |
| `163-170` | `getDB()`: `dbInstance` が falsy のとき `new KigasuruDB()`（=フォールバック `KigasuruDB`）を生成して返す（`167`）。**`currentUserId` は触らない** |
| `173` | **`export const db = getDB()`** ← モジュール評価時に1回だけ評価。固定。 |
| `685` | `export default db;` ← 同じフォールバック参照を default でも公開 |

全CRUDは `getDB()` 経由（`addShot:201` / `getAllShots:217` / `getFilteredShots:238` / `saveSetting:307` / `getSetting:344` / `saveCalibration:354` / `getCalibration:384` / `updateShot:444` / `deleteShot:453` / `getShot:461` / `clearAllData:468` / `getTodayManualLocationShots:481` / `updateLocationForShots:503` / `syncSettingsFromServer:544,549,554` / `syncShotsFromServer:`（内部で `getAllShots`/`addShot`/`updateShot`））。
→ これらは `initDB` 後なら全てユーザーDBを指す（正）。

### 1.2 固定 `db` を直接使う箇所（全数）

`import { db }` で値バインディングを取り込むのは **`lib/sync.ts` のみ**（`lib/sync.ts:1`）。固定 `db` のテーブル直アクセスは以下の **3 箇所だけ**（プロジェクト全体 grep 済み）:

| 箇所 | コード | 役割 |
|---|---|---|
| `lib/sync.ts:12` | `await db.shots.filter((s) => !s.serverId).toArray()` | `pushUnsyncedShots`：未同期(create) push 対象抽出 |
| `lib/sync.ts:78` | `await db.shots.filter((s) => s.dirty === true && !!s.serverId).toArray()` | `pushDirtyShots`：dirty 編集の PUT 対象抽出 |
| `lib/sync.ts:183` | `await db.shots.filter((s) => !s.serverId).count()` | `getPendingShotsCount`：未同期件数 |

- いずれも `db.shots` のみ。`db.rounds` / `db.settings` / `db.calibration` を固定 `db` で触る箇所は**存在しない**（grep 0 件）。
- `default import`（`import db from ...`）は**存在しない**（grep 0 件）。`export default db`（`:685`）の利用者なし。
- **書き込み**は `sync.ts` 内でも `updateShot()`（`:52` `:98`）経由＝`getDB()`＝ユーザーDB。**読みは固定 `db`、書きは `getDB()` という不一致**が同一関数内に同居している。

備考: `components/Layout.tsx:83-85` の `const db = getDB()` は**ローカル変数**で、ログアウト時に現行（ユーザー）DBを `close()` する正しい用途。固定エクスポート `db` とは別物。

### 1.3 `initDB` の呼び出し元とタイミング（全数）

| 箇所 | コンテキスト |
|---|---|
| `components/Layout.tsx:32` | `useEffect`（deps: `session?.user?.id` 他, `:62`）内。`if (session?.user?.id)` ガード（`:30`） |
| `app/history/page.tsx:39` | `useEffect`（deps: `session?.user?.id`, `:42`）内。同ガード（`:38`） |

- **モジュールスコープでの `initDB` 呼び出しは存在しない**（定義 `index.ts:137` 以外の呼び出しは上記2件のみ）。
- 2件とも `session.user.id` 必須＝NextAuth セッション解決後にしか走らない。セッション解決は非同期（`SessionProvider` が `/api/auth/session` を取得）。
- ルート構造（`app/layout.tsx:77`）: `<Providers>{children}</Providers>` が最上位。`Layout`/各ページはその子孫。

### 1.4 push の起動経路（`setupAutoSync`）

- `setupAutoSync()` の唯一の呼び出し元: `components/Providers.tsx:50`（`useEffect`, deps `[]`, `:11`）。
- `Providers.tsx:6` の `import { setupAutoSync } from '@/lib/sync'` が、依存して `lib/db/index.ts` のモジュール評価（＝`:173` の `db = getDB()`）を**バンドル読込時に**誘発する。
- `setupAutoSync`（`lib/sync.ts:149-175`）は、(1) `window 'online'`、(2) `document 'visibilitychange'`、(3) セットアップ直後に1回（`:168`）で `triggerPush()` を起動。
- `triggerPush`（`:124-137`）は `pushUnsyncedShots()`（`:129`）→ `pushDirtyShots()`（`:130`）を実行し、例外は try/catch（`:131-133`）で握り潰す。

### 1.5 `serverId == null` 行の生成元（push 依存の発生源）

`app/record/page.tsx` 保存処理:

| 行 | 分岐 | serverId |
|---|---|---|
| `647-667` | オンライン作成 → `POST /api/shots` 成功 → `addShot({...,serverId: result.shotId})` | 設定済（push対象外） |
| `668-672` | オンラインだが POST 失敗 → `addShot(shotData)`（serverId なし） | **null（push対象）** |
| `673-677` | オフライン → `addShot(shotData)`（serverId なし） | **null（push対象）** |

`addShot`（`index.ts:178-204`）は `getDB()`（`:201`）＝**ユーザーDBに書く**。→ データはユーザーDBに安全に残るが、server への送出は `pushUnsyncedShots` 任せ。

dirty 編集の生成元: `record/page.tsx:616,620`（PUT 失敗 or オフライン編集で `dirty=true`）。これも server 反映は `pushDirtyShots` 任せ。

### 1.6 既存コードがフォールバックDBの存在を認知している証拠

`lib/db/dedup.ts:488`:
```
if (getDB().name === 'KigasuruDB') {
  console.warn('[dedup] DB が未初期化です。…');  // :489
  return empty;
}
```
コメント `:487` 「既定 DB のままだと別(空)DBを掃除してしまうため拒否」。
→ 開発側は **`getDB()` が初期化前に空の `KigasuruDB` を返し得る**ことを既に把握し、dedup には防御ガードを入れている。**しかし `sync.ts` には同等ガードが無い**。

### 1.7 Dexie 4 の `close()` 挙動（`node_modules/dexie/dist/dexie.js`）

| 行 | 内容 |
|---|---|
| `5556` | `close()` 既定引数 `{ disableAutoOpen: true }` |
| `5558,5564` | `disableAutoOpen` 真 → `state.dbOpenError = new DatabaseClosed()` |
| `1116,1120` | 以後のテーブル操作は `dbOpenError` を見て `rejection(new DatabaseClosed())` |

`index.ts:149` の `dbInstance.close()` は**引数なし**＝`disableAutoOpen:true`。→ 閉じられた固定 `db` は**自動再オープンせず、操作は reject**。

---

## 2. タイミング分析（固定 `db` の状態遷移）

| フェーズ | dbInstance / 固定 db の状態 | push が読む DB |
|---|---|---|
| ① モジュール評価（バンドル読込） | `db = getDB()` → フォールバック `KigasuruDB` 生成・`dbInstance=db`（同一参照、未オープン） | — |
| ② 初回コミット（session=loading） | `Layout` の `initDB` はガードで未実行。`Providers` の `setupAutoSync→triggerPush→pushUnsyncedShots` が走り得る | **`KigasuruDB`（空・オープンされ実体化）** → `[]` → 何も push しない。**かつ空の `KigasuruDB` が物理生成される** |
| ③ session 解決 → `initDB(userId)` | `:149` で旧フォールバックを `close()`、`:156` で `dbInstance = KigasuruDB_${userId}`。固定 `db` は**閉鎖済みフォールバックを参照したまま** | — |
| ④ 以後の online / visibilitychange | `triggerPush→pushUnsyncedShots` | **閉鎖済み `KigasuruDB`** → `DatabaseClosed` を throw → `triggerPush` の catch（`sync.ts:131`）で握り潰し → push されない |

- ②と④で**開いている/閉じているの差はあるが、どちらも `KigasuruDB`（フォールバック）であり、ユーザーDBは絶対に読まれない**。結論はタイミング不変。
- ④が現実の支配的状態（一度ログイン経由でページを開けば `initDB` 済み）。**ページ全リロードまで固定 `db` は閉鎖されたまま**＝以後その page セッション中の push は例外で全滅。
- React の effect 順（子→親）と session 非同期解決の関係は②③の開閉状態に影響するが、上記結論を変えない。 **[要検証：実機 DevTools で ② の「空 KigasuruDB 生成」と ④ の DatabaseClosed ログを確認すると確証になる]**

---

## 3. 調査項目への回答

### 項目1: `initDB` の呼び出し元・タイミング、L173 評価時に `initDB` 済みか
- 呼び出し元は `Layout.tsx:32` と `history/page.tsx:39` の**2箇所のみ、いずれも `useEffect` 内・session 依存**（§1.3）。
- `:173` の評価はモジュール読込時で、`useEffect` より**必ず先**。よって **L173 評価時点で `initDB` は未実行**。`db` は常にフォールバック `KigasuruDB` に固定（SSR/CSR を問わず、関係する評価はクライアントバンドル側）。

### 項目2: `import { db }`／直接 `db` 使用の全ファイル・全行
- `lib/sync.ts:1` の1ファイルのみが値 `db` を import。直アクセスは `sync.ts:12 / 78 / 183` の3行（全て `db.shots`）（§1.2）。
- `pushUnsyncedShots` は `:12`、`pushDirtyShots` は `:78`、`getPendingShotsCount` は `:183`。

### 項目3: 保存系と同期push系は別DBを指し得るか／条件
- **指す。条件付きではなく決定論的。** ログイン済みユーザーが任意の認証ページを開き `initDB` が走った瞬間以降、保存系=`KigasuruDB_${userId}`、push系=`KigasuruDB`（閉鎖済み）で恒久的に乖離（§0, §2）。
- 一致する唯一のケースは「`initDB` が一度も走らない（＝未ログイン）」だが、その場合ユーザーデータ自体が無い。

### 項目4: 空の `KigasuruDB` にデータが書かれ得る経路
- **DB自体の生成**: `:173` の `db = getDB()` がモジュール評価で `new KigasuruDB()` を作り、初回テーブル操作（②の `pushUnsyncedShots` 読みなど）で物理的に空 `KigasuruDB` が IndexedDB に作られる（§2 ②）。引き継ぎの「複数 IndexedDB 発覚」と整合。
- **データ書込み**: `getDB()` ベースの write が `initDB` 完了**前**に走ると、その write はフォールバック `KigasuruDB` に着弾する。該当し得る経路 **[推測：ユーザー操作フロー依存、実機未確認]**:
  - `hooks/useGyro.ts:10` 経由の `saveCalibration`／`saveSetting`（初期化前にジャイロ調整を保存した場合）
  - `app/record/page.tsx:676` 等の `addShot`（initDB 完了前に記録した場合 → そのショットが空 `KigasuruDB` に取り残される）
  - `app/settings/page.tsx:9` の `saveSetting`／`addShot`
  - 子（ページ）の effect は親（`Layout`）の `initDB` effect より先に走り得るため、ページ単独 effect が先行 read/write する窓が存在する **[推測]**
- なお `syncShotsFromServer`（`Layout.tsx:51`）は `getDB()` 経由なので、`initDB` 後に走る限りユーザーDBに正しく書く（pull は正常側）。

### 項目5: 同様に `import{db}` でズレる他の不具合候補
- `pushDirtyShots`（`sync.ts:78`）: 同じ固定 `db` バグ。**dirty なオフライン編集（serverId 有り）の PUT 自動反映が、閉鎖済み `db` で例外→未送出**。`record/page.tsx:616,620` で立てた `dirty=true` が server に反映されない経路 **[推測：実機未確認]**。
- `getPendingShotsCount`（`sync.ts:183`）: 同バグだが**呼び出し元なし**（grep 0 件）→ 現状 UI 影響なし。将来 UI バッジ等で使うと常に 0／例外。
- `rounds` / `settings` / `calibration`: 固定 `db` での直アクセスは皆無（§1.2）。これらは全て `getDB()` 経由のため**乖離しない**。設定・キャリブレーション・ラウンドは本バグの対象外。
- `export default db`（`:685`）: 同じフォールバック参照だが利用者ゼロ→影響なし（潜在地雷として残存）。

---

## 4. 実害範囲のまとめ

| 経路 | 参照DB | 実害 | 確度 |
|---|---|---|---|
| `pushUnsyncedShots`（オフライン作成ショットの create push） | 空/閉鎖 `KigasuruDB` | **未同期ショットが server へ自動送出されない**。ローカル(ユーザーDB)には残るが、端末変更/ローカル削除で消失リスク | コード上ほぼ確実 / 実機 [要検証] |
| `pushDirtyShots`（オフライン編集の PUT 反映） | 空/閉鎖 `KigasuruDB` | **dirty 編集が server へ反映されない** | コード上ほぼ確実 / 実機 [要検証] |
| `getPendingShotsCount` | 空/閉鎖 `KigasuruDB` | 未使用のため現状影響なし | 確実 |
| 空 `KigasuruDB` の生成 | — | 不要な空 IndexedDB が常時生成（「複数 DB」症状） | コード上確実 |
| `getDB()` 全CRUD・pull・settings・calibration | `KigasuruDB_${userId}` | 正常（`initDB` 後） | 確実 |

オンライン作成（`record/page.tsx:650` の即時 POST）は push 経路に依存しないため、**オンライン主体の利用では表面化しにくい**。表面化するのは「オフラインで記録 → オンライン復帰」「オフライン編集 → 復帰」のシナリオ。引き継ぎコミット `700cde4`（オンライン復帰時の autoCollect 再実行）や「ケースB再テスト」が示す症状と方向性が一致する **[推測]**。

---

## 5. 修正設計案（コード変更は本調査では未実施）

### 案A（推奨・最小差分）: `sync.ts` を `getDB()` 参照に切替

- `lib/sync.ts:1` を `import { getDB, updateShot, toEditableFields } from './db'` に変更。
- `:12` `:78` `:183` の `db.shots` を `getDB().shots` に変更（各関数呼び出し時点の生きた `dbInstance`＝ユーザーDBを読む）。
- 効果: push の読みが保存系と同一DBに収束。閉鎖参照問題も解消（毎回最新 `dbInstance`）。
- 影響ファイル: `lib/sync.ts`（import 1行＋3箇所）。他へ波及なし（`db` 値の他利用者は無い）。

### 案B（併用推奨）: 固定エクスポートの撤去

- `lib/db/index.ts:173 export const db = getDB()` と `:685 export default db` を削除。
- 効果: モジュール評価時の**空 `KigasuruDB` 即時生成を停止**（「複数 DB」症状の主因除去）。
- 影響ファイル: `lib/db/index.ts`。`db` 値 import は `sync.ts` のみ（案Aで除去済み前提）。default import 利用者なし。よって**案A適用後なら破壊なし** [要検証：ビルド/型チェックで未参照を最終確認]。

### 案C（任意・恒久ハードニング）: `getDB()` のフォールバック生成を抑止

- `getDB()` が未初期化時に**別名 `KigasuruDB` を新規生成しない**設計へ（throw もしくは初期化完了を待つ Promise を返す等）。
- 効果: `initDB` 前の read/write がフォールバックに着弾する経路（§3 項目4）を根絶。`dedup.ts:488` の防御ガードも不要化。
- 影響: `getDB()` を同期前提で使う全CRUDの呼び出し契約変更を伴うため**中規模**。別タスク化が妥当。

### 推奨順序
1. 案A（push のDB乖離を即解消）
2. 案B（空DB生成の停止）
3. 案C（初期化前着弾の恒久対策、別タスク）

いずれも適用後は、`push` 系3関数と全CRUDが単一の `KigasuruDB_${userId}` に収束する。**push の読みを直したら、`updateShot`（書き＝既に `getDB()`）との整合は自動的に取れる**。

---

## 6. 未確認・要検証事項

- [要検証] 実機 DevTools（Application → IndexedDB）で `KigasuruDB`（空）と `KigasuruDB_${userId}` の併存、及び online 復帰時に `Auto-sync push failed` / `DatabaseClosed` がコンソールに出るか。
- [要検証] 案B適用時、`tsc`/ESLint/ビルドで `db`・default export の未参照が確証できるか（本調査の grep では利用者ゼロ）。
- [推測] §3 項目4 の「`initDB` 前 write がフォールバックに着弾」は、実際のページ遷移/effect 競合に依存。再現にはレースの実測が要る。
- 本調査はオフライン同期経路に限定。`rounds`/`settings`/`calibration` は固定 `db` 不使用のため対象外（乖離なし）と確認済み。

---

## 付録: 参照ファイル一覧

- `lib/db/index.ts`（KigasuruDB / initDB / getDB / 固定 db / 全CRUD）
- `lib/sync.ts`（固定 db 直アクセス3箇所 / push / setupAutoSync）
- `components/Providers.tsx`（setupAutoSync 呼び出し / sync import）
- `components/Layout.tsx`（initDB 呼び出し / logout close）
- `app/history/page.tsx`（initDB 呼び出し）
- `app/record/page.tsx`（保存・編集・serverId/dirty 生成）
- `app/layout.tsx`（Providers ルート配置）
- `lib/db/dedup.ts`（フォールバックDB認知ガード `:488`）
- `node_modules/dexie/dist/dexie.js`（close/DatabaseClosed 挙動, v4.2.1）
