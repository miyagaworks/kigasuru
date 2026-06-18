# 2026-06-18 根本原因特定: DBインスタンス二重化バグ / 次=調査CC結果で修正判断 引き継ぎノート

<reliability>
ctx: 中。本ノートの `<known-fact>` は当セッションで grep + Read により**正確に**確認した。
前ノート `2026-06-18-multidb-discovery-handover.md` の `<known-fact>` 内「コード（Super Read 実測）」の行番号・内容（L62 `new Dexie('KigasuruDB')` 等）は Super のツール不調による**誤読**だった（本ノート `<correction>` で訂正）。
次セッションも実コード再確認を厳守。
</reliability>

<correction target="2026-06-18-multidb-discovery-handover.md">
前ノートの「`lib/db/index.ts` L62: `new Dexie('KigasuruDB')`（固定）」は**誤読**。
正しくは:
- `lib/db/index.ts` L58 `export class KigasuruDB extends Dexie`。
- constructor(userId?) が L66 `const dbName = userId ? \`KigasuruDB_${userId}\` : 'KigasuruDB';`（**アカウント別 DB が正規設計**）。
- version は 1〜6 まで定義（L69-122）。これが実機で見えた IndexedDB version 60（Dexie が ×10）の正体。
前ノートの EDITABLE_FIELDS/updateShot/syncShotsFromServer の行番号も同様に誤読由来。本ノートの行番号を正とする。
</correction>

<root-cause type="critical">
**DBインスタンス二重化バグ（ケースB「編集がサーバーに届かない」の真因候補）**

1. `getDB()`（L163-170）は dbInstance 未初期化時に `new KigasuruDB()` を作る＝**フォールバックの空DB 'KigasuruDB'（サフィックス無し）**。
2. `initDB(userId)`（L137-158）は `new KigasuruDB(userId)`＝`KigasuruDB_<userId>` で dbInstance を差し替える（ログイン時に呼ばれる想定）。
3. 全CRUD関数（addShot/updateShot/getShot/getAllShots/deleteShot/clearAllShots/syncShotsFromServer）は呼び出し時に `const database = getDB()`（L179-241）→ initDB 後は最新の `KigasuruDB_<userId>` を使う。
4. **ところが L173 `export const db = getDB();` が「モジュール評価時に1回だけ」実行され**、その時点の dbInstance（initDB 前ならフォールバック 'KigasuruDB'）を `db` に**固定**する。
5. **`sync.ts` L1 `import { db }`** で、push系（pushUnsyncedShots/pushDirtyShots）が `db.shots` を直接操作する（前回 sync.ts Read で確認）→ **固定された空の 'KigasuruDB' を見る**。

→ **保存系（getDB＝`KigasuruDB_<userId>`）と 同期push系（db＝固定 'KigasuruDB'）が別DBを指し得る。** 編集はあなた専用DBに保存されるが、同期係は空DBを見るのでサーバーへ push されない。これがケースB失敗の真因の可能性が高い。前回の PUT 404 も、空DB側に残った古い id:57（無効 serverId）に送ろうとしたため、と整合。
</root-cause>

<known-fact>
（grep + Read 実測）
- grep `new Dexie|KigasuruDB`: `dedup.ts` L488 `getDB().name === 'KigasuruDB'`／`index.ts` L58,66,127,137,156,163,167。
- `index.ts` L58-124: `class KigasuruDB(userId?)`、L66 dbName ユーザー別、L69-122 version 1-6。
- `index.ts` L137-158 `initDB(userId)`: dbInstance 差し替え（同一userは再利用・別userは close）。L163-170 `getDB()`: 未初期化時フォールバック `new KigasuruDB()`。L173 `export const db = getDB()`。
- `index.ts` L178-264: 全CRUD関数が `const database = getDB()`。
- `sync.ts` L1 `import { db, updateShot, toEditableFields }`。push系は `db.shots` 直接（前回Read）。
- 実機: 端末DB 3つ（`KigasuruDB`空 / `KigasuruDB_cmgebj45j...` / `KigasuruDB_cmgnocpa30000la04wdumcqy1`=現ユーザー40件）。サーバー40件。データは無事。
</known-fact>

<unconfirmed>
- `initDB(userId)` の呼び出し元・タイミング（L173 評価時点で initDB 済みか・import順序・SSR/CSR）→ 調査CCで確定。
- 空 'KigasuruDB' に前回テストの id:57 が書かれた経路。
- `import { db }` する他ファイルの有無、rounds/settings/calibration への波及。
</unconfirmed>

<risk>
1. これが事実なら**全ユーザーの同期に関わる重大バグ**。修正は影響範囲を調査CCで固めてから。
2. push = 本番自動デプロイ。push は宮川さんの明示OK必須。
3. 修正は1コミット1論理単位。ビルド/リント確認後にのみ push。
</risk>

<next-action>
1. このノート＋前ノートを Read。git status / log 確認。
2. 調査CC（下記 `<investigation-prompt>`）の結果を受け取る（未投入なら投入）。
3. 「保存系と同期push系が別DBを指す」が確定したら、修正CCで修正:
   - 修正案: L173 `export const db = getDB()` を廃止し全箇所 `getDB()` 呼び出しに統一／`sync.ts` の `db.shots` を `getDB().shots` に／`import { db }` 全廃。
   - 影響範囲（`import { db }` 全箇所）を調査結果で確認してから着手。
4. 修正後、ビルド/リント → 宮川さんOKで push → ケースB再テストを本物DB（`KigasuruDB_<userId>`）でやり直し。
</next-action>

<investigation-prompt>
調査CC（researcher・Opus）へ投入する指示書:

【調査依頼】kigasuru: DBインスタンス二重化バグの実害範囲を確定（読み取りのみ・変更禁止）
プロジェクト: /Users/miyagawakiyomi/Projects/kigasuru

## 確定済みの事実（Super調査済み・前提）
- lib/db/index.ts: class KigasuruDB(userId?) で dbName = userId ? `KigasuruDB_${userId}` : 'KigasuruDB'（L64-67）
- 全CRUD関数（addShot/updateShot/getShot/getAllShots/deleteShot/clearAllShots/syncShotsFromServer）は const database = getDB() を使用（L179-241）
- getDB() は dbInstance 未初期化時に new KigasuruDB()（=フォールバック'KigasuruDB'）を作る（L163-170）
- L173 `export const db = getDB()` がモジュール評価時に1回だけ評価され固定される
- sync.ts L1 `import { db }` で、push系がこの固定dbを使う疑い

## 調べること（コード根拠=ファイルパス+行番号を必須）
1. initDB(userId) の全呼び出し元と実行タイミング（ログイン/セッション確立フロー）。L173の評価時点で initDB は既に呼ばれているか（import順序・SSR/CSRの別）。
2. `import { db }`（または default import）でdbを直接使う全ファイル・全行。特に sync.ts の push系が db.shots を直接触る箇所。
3. 結論: 「保存系（getDB）」と「同期push系（db固定）」が実際に別DBを指し得るか。指す条件を明示。
4. 空の'KigasuruDB'にデータが書かれ得る経路（initDB前にgetDB系が呼ばれるルート）。
5. import{db}でズレる他の不具合候補（rounds/settings/calibration含む）。

## 期待する出力（Markdownレポート・コード変更なし）
- 「保存先DB」と「同期push参照DB」が一致するか/ズレるかを条件付きで断定（根拠付き）
- ズレる場合の修正設計案（例: L173廃止しgetDB()に統一 / import{db}全廃）と影響ファイル一覧
- 事実はファイルパス+行番号、推測は[推測]タグ

## 禁止
- コード変更・コミット・実機アクセス。該当コード引用なき断定。
</investigation-prompt>
