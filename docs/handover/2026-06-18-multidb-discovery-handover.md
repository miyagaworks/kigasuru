# 2026-06-18 複数 IndexedDB 発覚 / ケースB再テスト無効 / 次=DB構造のコード調査 引き継ぎノート

<reliability>
ctx 残量: 低〜中（当セッションは3時間超・多数往復）。ただし `<known-fact>` は全て当セッションで以下により実測:
- Super 自身の git / Read（lib/db/index.ts, sync.ts, record/page.tsx, sw.js 等）
- ユーザー実機（本番 https://app.kigasuru.com・アカウント `cmgnocpa30000la04wdumcqy1`）の DevTools コンソール出力を Super が照合
`<unconfirmed>` は未検証・推測。次セッションは「報告・ノートを信じず実機・実コードで再確認」を厳守。
**当セッション最大の教訓: Super が DB 名を `KigasuruDB` と誤認して長時間混乱した。次セッションは最初に `await indexedDB.databases()` で DB 実態を確認すること。**

⚠️【後続セッションで訂正済み】本ノート `<known-fact>` 内「コード（Super Read 実測）」の行番号・内容（`L62 new Dexie('KigasuruDB')` 等）は Super のツール不調による**誤読**。正しい `lib/db/index.ts` の構造（class KigasuruDB(userId?)・アカウント別DB）と根本原因（DBインスタンス二重化バグ）は `2026-06-18-db-instance-rootcause-handover.md` を参照すること。
</reliability>

<context>
kigasuru（ゴルフのショット記録）。Next.js 15.5.19 / Vercel トランクベース（main push = 本番自動デプロイ）。
前ノート `2026-06-18-dedup-complete-caseb-retest-handover.md` の続きで「⑤ ケースB再テスト（オフライン編集→オンライン復帰で距離＆メモがサーバー到達）」を実機で行う予定だった。
テスト中に想定外の構造（端末に IndexedDB が複数存在・コードと DB 名が食い違う）が判明し、ケースB再テストは無効となった。
</context>

<status>
- ✅ データは無事: 本物の DB `KigasuruDB_cmgnocpa30000la04wdumcqy1` に shots 40件。重複なし（履歴・分析ページで正常表示）。前回掃除の結果は保たれている。
- ❌ ⑤ ケースB再テスト: **無効**。Super が空の DB `KigasuruDB`（サフィックス無し）を見ていたため検証が成立しなかった。要やり直し。
- 🔍 新発見（要調査）: 端末に IndexedDB が3つ。コード（`lib/db/index.ts`）は `KigasuruDB` だが実データは `KigasuruDB_<userId>`。コードと実態が食い違う。
- 未コミット: 本ノートのみ（コード変更なし）。前ノート `000182b` は依然未push（push は宮川さんの明示 OK 必須）。
</status>

<known-fact>
**git（Super 実測）**
- main / working tree clean / origin/main より1コミット先行（`000182b` 完了ノート docs・未push）。コードコミット `3c237e9`〜`f11382b` は push 済。

**サーバー（ユーザー実機 DevTools・Super 照合）**
- `(await (await fetch('/api/shots')).json()).shots` → 40件。id 一覧40個取得（`cmqh8dnab0007l704xb3d8477` 〜 `cmgoc0e3y0001l7042wdj6wlr`）。
- `shots.some(s=>s.id==='cmgnp2bm3000bjp04rhwfgsl9')` → **false**（この id はサーバーに無い）。

**端末 IndexedDB（`await indexedDB.databases()` 実測）— 核心**
DB が**3つ**存在:
1. `KigasuruDB`（version 60）— shots `getAll().length` = **0**（空）。Super がセッション中ずっとここを見ていた。
2. `KigasuruDB_cmgebj45j00008o5v5935291j`（version 50）— 別アカウント分と推定。
3. `KigasuruDB_cmgnocpa30000la04wdumcqy1`（version 60）— 現ログインユーザー。shots `getAll().length` = **40**。**本物のデータはここ**。

**コード（Super Read 実測）**
- `lib/db/index.ts` L62: `new Dexie('KigasuruDB')`（サフィックス無し・固定）。version(1)/version(2) のみ定義（L66-73）。EDITABLE_FIELDS に distance/memo 含む（L28-46）。updateShot は dirty 自動付与なし（L89-91）。syncShotsFromServer は serverId 最優先照合・17項目非上書き（L119-168）。
- `lib/sync.ts`: pushDirtyShots（`dirty===true && serverId` を PUT /api/shots/{serverId}、成功で dirty=false、L76-111）、setupAutoSync（online/visibilitychange/初回で triggerPush、L149-175）。
- `app/record/page.tsx` L592-640: 編集保存で editId 時に toEditableFields → updateShot。offline かつ editServerId 有り → dirty=true（L620）。L304-324: 編集ロードで getShot → setEditServerId(shot.serverId)（L312）。
- `app/history/page.tsx` L310: 各記録に `onClick={()=>router.push('/record?edit=${shot.id}')}`。
- `app/api/shots/route.ts` GET: `{ shots }`（自分のデータのみ・createdAt 降順）。
- `public/sw.js`: L99 `caches.delete`（Cache API のみ・IndexedDB は触らない）。IndexedDB 削除コードは grep で未発見＝SW はデータ消去の犯人ではない。

**ケースB操作（ユーザー実機）**
- 履歴から記録を選び編集 → オフライン（`navigator.onLine`=false 確認）→ 距離148→150・メモ「再テスト0618」→ 保存 →「更新しました」表示。
- `indexedDB.open('KigasuruDB')`（サフィックス無し＝後に空と判明した DB）の `get(57)` が distance:150・memo:再テスト0618・dirty:true・serverId:`cmgnp2bm3000bjp04rhwfgsl9` を返した（11:55頃）。
- `PUT /api/shots/cmgnp2bm3000bjp04rhwfgsl9` → **404**。その後同 DB の `getAll().length` は 0（12:01）。
</known-fact>

<finding type="critical">
**端末に IndexedDB が複数あり、コードと DB 名が食い違う。**
- 実データは `KigasuruDB_<userId>`（アカウント別 DB）。
- コード `lib/db/index.ts` は `new Dexie('KigasuruDB')`（サフィックス無し）。
- → `lib/db/index.ts` の外に「DB 名にアカウントIDを付ける実装」があるはず（未特定）。
- version 50/60 は、Dexie が version() を内部で10倍する慣習なら version 5/6 相当。だが `lib/db/index.ts` は version(2) までしか定義していない → 別の DB 定義・別の Dexie インスタンスが存在する可能性が高い。
</finding>

<unconfirmed>
1. **なぜ DB が複数あるか**: アカウント別分離が正規設計か、移行残骸か不明。
2. **`lib/db/index.ts` の db は使われているか**: 編集保存の `get(57)` が 'KigasuruDB'（サフィックス無し）から値を返した→record の保存が 'KigasuruDB' に書いた可能性。一方、履歴・分析は `KigasuruDB_<userId>` から表示。→ **編集の保存先と表示元が別 DB の疑い**（もし事実ならバグ）。
3. **PUT 404 の真因**: 'KigasuruDB'（空の方）に残っていた古い id:57 の serverId=`cmgnp...` はサーバーに無い→404。本物 DB の記録の serverId 整合性は未確認（履歴・分析が正常表示なので整合している可能性が高い）。
4. **`get(57)`（11:55）が値を返したのに `getAll`（12:01）が0件**: 'KigasuruDB' から id:57 が消えた理由不明（リロードが引き金か）。
5. version 50/60 の正体。
</unconfirmed>

<risk>
1. push = 本番自動デプロイ。次の push も宮川さんの明示 OK 必須。
2. 「編集の保存先が表示元と別 DB」が事実なら、**全ユーザーの編集が反映されない重大バグ**の可能性。最優先で調査。
3. 実機コンソールでの IndexedDB 直接確認は、DB 名を正確に指定しないと誤計測する（本セッションの教訓）。次回は `await indexedDB.databases()` を最初に。
4. ケースB再テストの結果は無効。DB 構造を解明してから、本物 DB を対象にやり直すこと。
5. コンソールへの長いコマンドのコピペが複数回壊れた（改行混入）。短い1行 or コードブロックのコピーボタン使用が必須。
</risk>

<reflection>
- Super が `lib/db/index.ts` の `new Dexie('KigasuruDB')` を鵜呑みにし、DB 名を 'KigasuruDB' と決めつけて空の DB を見続けた。最初に `await indexedDB.databases()` で DB 実態を確認すべきだった（CLAUDE.md「コードの記述を盲信せず実態を確認」「環境問題か実装問題か切り分け」の不徹底）。
- 「データが消えた」と早合点して宮川さんを不安にさせた。実際は見る場所違いで、データは一度も消えていなかった。
- Super の Bash/Read ツールが当セッション中、出力トランケートを多発（環境不安定）。grep 結果の corruption もあり、コード調査が難航した。次セッションでツールが安定していれば再調査が捗る。
</reflection>

<next-action>
次セッションが最初にやること:
1. このノートを Read。報告・ノートを信じず実機・実コードで再確認。
2. `git -C ~/Projects/kigasuru status` / `log --oneline -6` で状態確認。
3. **コード調査（調査CC）**: 下記「コード調査指示書」を調査CCに投入し、DB 名の決まり方・複数 DB の理由・編集保存先・`lib/db/index.ts` の使用状況を解明。
4. 調査結果で分岐:
   - 「編集保存先が表示元と別 DB」が事実 → 修正方針を立てる（重大バグ）。
   - 正規のアカウント別設計で問題なし → ケースB再テストを本物 DB（`KigasuruDB_<userId>`）対象でやり直す。
5. 実機確認時は最初に `await indexedDB.databases()` で DB 一覧を取得し、現ユーザーの `KigasuruDB_<userId>` を対象にすること。
</next-action>

<investigation-prompt>
次セッションで調査CC（researcher・Opus）に投入する指示書（本文はチャットにも別途出力済み）:

---
【調査依頼】kigasuru: 端末 IndexedDB の DB 名が複数ある構造を解明（読み取りのみ・変更禁止）

## 背景
本番アプリの端末 IndexedDB に DB が3つ存在することが実機で判明:
- `KigasuruDB`（空）
- `KigasuruDB_cmgebj45j00008o5v5935291j`
- `KigasuruDB_cmgnocpa30000la04wdumcqy1`（現ユーザー・実データ40件）
一方 `lib/db/index.ts` L62 は `new Dexie('KigasuruDB')`（サフィックス無し・固定）。コードと実態が食い違う。この正体をコードを読んで解明する。

## プロジェクト
/Users/miyagawakiyomi/Projects/kigasuru

## 調べること（優先順）
1. 「DB 名にアカウントIDを付ける」実装の所在: `new Dexie(` の全箇所、`KigasuruDB_` 連結箇所、DB を動的生成する関数/フック（例 getDB(userId)）を grep。
2. `lib/db/index.ts` の db / addShot / updateShot / getShot / getAllShots / syncShotsFromServer の import 元を全追跡。record/history/analysis の各ページがどの DB アクセス経路を使うか。
3. 「編集の保存先（record/page.tsx の updateShot/addShot）」と「履歴・分析の表示元」が同一 DB インスタンスか、別 DB 名か。
4. version 50/60 の理由（Dexie version() 定義箇所、アカウント別 DB の version 定義）。
5. DB が複数残る理由（移行コード・旧 DB クリーンアップの有無）。

## 期待する出力（Markdown レポート・コード変更なし）
- DB 名の決まり方（固定 'KigasuruDB' か、アカウント別か）をファイルパス+行番号の根拠付きで断定。
- `lib/db/index.ts` の db が使われているか/デッドコードか。
- 「編集保存先 == 表示元」か「別 DB か」の結論（根拠付き）。
- それが「設計どおり」か「バグ」かの判断材料。
- 事実は ファイルパス+行番号 を引用、推測は [推測] タグ。

## 禁止
- コードの変更・コミット・実機 IndexedDB アクセス（コードのみ）。
- 該当コードの引用なき断定。
---
</investigation-prompt>
