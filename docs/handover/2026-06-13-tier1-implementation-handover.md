# 2026-06-13 記録システム作り直し・実装フェーズ 引き継ぎノート

<reliability>
ctx 残量: 中〜高。本セッションは設計レビューまでで、コード変更なし。
- `<known-fact>` は Super が本セッションで直接 Read / Grep / 本番 migration ファイル確認で実測したもの。
- 設計書（`docs/plans/2026-06-13-tier1-foundation-design.md`）は planner 作成、Super が全文レビュー＋最重要点（RLS 実在）を独立裏取り済み。信頼度は高い。
- ただし本番DB の「現時点」実数は未再計測（提案書時点 2026-06-13 で 187件）。段階2の移行直前に再計測が必須。
</reliability>

<context>
kigasuru（ゴルフ上達アプリ・本番運用中・Neon PostgreSQL）の記録システム抜本改修。
- 全体は2段構え: **1段目＝土台**（バグ修正＋スキーマ基盤・見た目はほぼ不変）、**2段目＝2タップ新記録UI**（別フェーズ）。
- 上流文書: 提案書 `docs/redesign/record-system-proposal.md` → 1段目詳細設計書 `docs/plans/2026-06-13-tier1-foundation-design.md` まで完成。
- 本セッションで設計レビュー完了。宮川さんが「次セッションから実装」を承認。
- 本ノートは**実装フェーズの初動引き継ぎ**。
</context>

<status>
- 完了: トライアル実態の確定、1段目詳細設計書の作成、Super による全文レビュー、4段階実装方針の確定。
- 未着手: 実装（段階1〜4すべて）。
- コミット: 設計書＋本ノートを main にコミット（`<commit-status>` 参照）。
</status>

<user-confirmed-spec>
宮川さんが本セッションで確認した事項:
1. 下記 `<implementation-plan>` の **4段階の実装方針**で進める。
2. **トライアル制限は1段目では一切変更しない**（現状維持）。再設計は2段目の前に別テーマで扱う。
3. 設計書 §13 の4判断は **Super 確定でよい**（宮川さんの個別判断は不要）:
   - Round の「重複防止の印」(clientId) を1段目で先に入れる
   - 過去重複3件の掃除は段階4
   - サーバー先行→クライアント出荷の間隔は気にしない（利用者が少ないため）
   - 位置・気温の TTL（コース名・気温の混入修正）を段階1で単独先行
</user-confirmed-spec>

<known-fact>
Super が本セッションで実測（次セッションで再確認不要）:
- トライアル制限: `app/api/trial/validate/route.ts:47-63`。判定軸は「ユニーク日付3日」、`trialDaysLimit=3`。★変更しない。宮川さん談「3ラウンド」とは数え方が違う（日付ベース）が、1日1ラウンド運用なら実質一致。
- **RLS**: `prisma/migrations/enable_rls/migration.sql`。User/Shot/Subscription 等**全テーブルで ENABLE ROW LEVEL SECURITY**（Super が grep で実証）。→ 新 Round にも手動追記が必須（設計書 §4.5(6)・§9-2(2)）。Prisma は RLS を生成しない。
- Prisma Shot: `schema.prisma:141-180`。`distance Int`（必須）。roundId/clientId/holeNumber/serverId は**無い**。
- Round モデル: 存在しない（新設対象）。
- Dexie: `lib/db/index.ts`。version(1)〜(5) 実装済み。**次は version(6)**。serverId は Dexie 側にのみ存在。
- `crypto.randomUUID()`: 既存利用あり（`app/api/auth/register/route.ts:40` 等・Super 実証）。**新規依存不要**。
- distance は Dexie/store 側で**既に nullable**（設計書 discrepancy d2）。実変更は **Prisma schema と POST API の2箇所のみ**。
</known-fact>

<design-doc>
1段目詳細設計書: `docs/plans/2026-06-13-tier1-foundation-design.md`（全13章＋付録）。**次セッションは必ずこれを Read**。要参照:
- §3 同期の ID 設計（clientId / serverId の役割固定）
- §5 同期の新フロー（push / pull / upsert の擬似フロー）
- §7 TTL（**段階1の実装範囲**）
- §8 編集PUT配線（serverId 回収が前提）
- §9 本番データ移行手順（バックアップ／migration／重複清掃／ロールバック）
- §10 実装順序（依存関係・デプロイ順序）
- §11 テスト観点
- 付録 変更ファイル一覧
</design-doc>

<implementation-plan>
4段階（設計書 §10 に対応）。**デプロイ順序の鉄則「スキーマ→API→クライアント」を厳守**（新クライアントを旧サーバーに当てない）。

<task id="phase1">
**段階1（最初・client-only・本番DB非依存・最小リスク）**
- 内容: 位置・気温キャッシュ TTL（設計書 §7・item3）。
- 対象: `app/record/page.tsx:393-423` の `lastLocationData` 読み出しに「当日のみ有効」チェック（isSameLocalDay）を追加。非当日は `autoCollect()` で再取得。書き込み側（351-358行・timestamp は既に保存済み）は変更不要。
- 狙い: 宮川さんに「何か直った」を最速で見せる可視成果。本番DB に触れない。
</task>

<task id="phase2">
**段階2（DB構造・本番DB変更）**
- 内容: Prisma migration（item2,5）。Shot に clientId?/roundId?/holeNumber? 追加・distance を Int? へ・Round 新設・User relation 追加。**Round.clientId も今回入れる**（§13-1 確定）。Dexie version(6)（item6）。
- ★本番DB操作。Neon branch でバックアップ → migration → **RLS 手動追記** → 検証（設計書 §9）。
</task>

<task id="phase3">
**段階3（同期・距離・編集の本丸・クライアント）**
- 内容: API改修（POST upsert＋distance必須撤廃・item1,2・§6）→ 記録時 clientId 生成（§5.2）→ sync 置換（§5.3,5.5,5.6・item1）→ 編集PUT配線（§8・item4）。
- デプロイ: API（サーバー）先行 → 動作確認 → クライアント出荷。
</task>

<task id="phase4">
**段階4（過去重複掃除・一度きり・本番DB削除）**
- 内容: 重複検出 → 計測 → 削除（設計書 §9-3）。1グループ3行想定。
- ★本番DB DELETE。BEGIN/COMMIT＋件数照合。108件ユーザーの行を誤削除しないこと。
</task>
</implementation-plan>

<next-action>
次セッションの最初にやること:
1. 本ノートを Read。
2. `docs/plans/2026-06-13-tier1-foundation-design.md` を Read（特に §7・§10）。
3. **段階1（TTL）の実装CCプロンプトを Super が設計**する。
   - 対象: `app/record/page.tsx` の `lastLocationData` 読み出し（§7）。
   - スコープ厳守: **TTL のみ**。Round・同期・distance・clientId は段階1では触らない。
   - 実装CC に「`app/record/page.tsx:351-358`（書き込み）と `393-423`（読み出し）を Read してから実装」を指示。
   - 期待出力: 変更箇所・テスト方法・`npx eslint` ＋ `npm run build` の結果。
4. 段階1完了 → 動作確認 → コミット →（push）。区切りごとにコミット必須。
5. 段階2へ進む前に、Super が本番DB移行手順（§9）を宮川さんに提示し、Neon branch 操作の段取りを 1ステップずつ確認する。
</next-action>

<risk>
1. **デプロイ順序事故（最重要）**: 新クライアント×旧サーバーで clientId / null distance が弾かれる。段階3は「API先行→クライアント」を厳守（設計書 §10）。
2. **本番DB操作の接続先/branch確認（段階2,4）**: Super プロファイル「外部DBツールへのSQL依頼時の branch/接続先確認」を必ず適用。migration / SQL 実行前に DIRECT_URL・Neon branch を画面確認してから実行。過去に rodo で main DB へ誤 INSERT 事例あり。
3. **RLS 追記漏れ**: 新 Round に `ENABLE ROW LEVEL SECURITY` を手動追記（Prisma は生成しない）。段階2のレビュー必須項目。
4. **可逆性の窓**: 新クライアント出荷後は完全ロールバック不可（設計書 §9-4）。段階3のクライアント出荷前にロールバック判断を済ませる。
5. **push 前 lint/build**: CLAUDE.md「git push 前に必ずビルド/リント確認」。コード変更を含む段階1,3は push 前に `npx eslint` ＋ `npm run build`（＝`next build --turbopack`）を実行。
6. **マルチデバイス**: 複数端末でのサーバー→ローカル編集の反映は1段目スコープ外（設計書 §5.5 は serverId 済みローカルを上書きしない設計）。単一端末の冪等化が主目的。将来課題として記録のみ。
</risk>

<commit-status>
本セッションのコード変更: なし。
コミット対象: `docs/plans/2026-06-13-tier1-foundation-design.md`（設計書）＋本ノート。ドキュメントのみのため Super 代行コミット。
前提: 提案書・前引き継ぎノートは前セッションでコミット済み（6e994c1）。
実装はすべて次セッション以降。
</commit-status>

<reflection>
本セッション（Super）の良かった点:
- 引き継ぎの「トライアル制限・要再確認」を最優先で自分で Read し確定（Fable が正しかった）。盲信せず実証。
- planner 報告を鵜呑みにせず、RLS 実在を独立裏取り（CLAUDE.md 検証ルール遵守）。
- 設計書 §13 の4判断を宮川さんに丸投げせず Super が確定（判断負荷の引き受け）。
次セッションへの戒め:
- 段階2,4 の本番DB操作で branch/接続先確認を省略しない。
- 各段階の完了時にコミットを後回しにしない。
</reflection>
</content>
</invoke>
