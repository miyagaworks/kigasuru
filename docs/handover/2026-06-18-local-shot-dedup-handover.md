# 2026-06-18 ローカル shot 重複バグ（コア機能）Phase1検証済・Phase2走行中 引き継ぎノート

<reliability>
本ノートの `<known-fact>` は当セッションで Super 自身が実機取得した事実のみ:
git log / git status / git diff（Phase1 差分を全行 Read）/ npm run lint・npm run build（Super 自身が再実行）/
本番アプリの DevTools 実データ（IndexedDB shots ＋ GET /api/shots をユーザー実機で取得しスクショ照合）。
**Phase 2（修正CC 実装中）の出力は本ノート執筆時点で未着地・未検証**（`lib/db/dedup.ts` まだ不在）。Phase2 は全て `<unconfirmed>`/`<risk>` 扱い。
調査報告書（researcher）の「主張」は鵜呑みにせず、実データで1件の主因誤りを訂正した（後述 finding）。
次セッションも「報告・ノートを信じず実機で再取得」を厳守。特に Phase2 修正CC の出力は diff・データ消失ゼロ性・build/lint を Super 自身で裏取りすること。
</reliability>

<context>
kigasuru 記録システム（ゴルフのショット記録）。Next.js 15.5.19 / Vercel トランクベース（main push → 本番自動デプロイ）。
当セッションは前ノート（`2026-06-18-dependabot-postcss-nextauth-complete-handover.md`）の続きで Dependabot 残確認から開始したが、
実機照合の結果 Dependabot は 0件クローズ済みで完了確認。そこで **Tier1 #7 ケースB（オフライン編集→オンライン復帰で自動同期）の実機スモークテスト**に進んだ。

このスモークテストが**本物のコア機能バグを2件あぶり出した**:
1. 記録のローカル重複（端末 IndexedDB 上）
2. 「自動取得に失敗しました」表示がオンライン復帰後も残る（位置情報・天気の autoCollect 由来・同期とは別機能）

Dependabot 対応とは無関係のコア機能バグ。設計書: `docs/plans/2026-06-13-tier1-foundation-design.md`。
調査報告書（researcher 作成・未追跡）: `docs/research/2026-06-18-offline-sync-duplicate-rootcause.md`。
</context>

<status>
- **診断: 完了**（client/server 両方の実データで根本原因を断定）。
- **Phase 1（コード修正）: 実装済・Super 検証済・未コミット・未デプロイ**。working tree（main）に M で存在。
- **Phase 2（安全な掃除機能）: 修正CC 実装中・未着地・未検証**（執筆時点で `lib/db/dedup.ts` 不在）。
- 本番デプロイ: 無し。ユーザーの本番サーバーデータは元々きれい（後述）。
</status>

<known-fact>
**根本原因（client/server 実データ＋コードで断定）**
- サーバーは正常: `GET /api/shots` → **40件・重複なし**（6I は5件きっかり）。**重複は端末ローカル(IndexedDB)のみ**。本番DB削除は不要。
- 有効ローカルDB `KigasuruDB_cmgnocpa30000la04wdumcqy1`: **shots=115件 / serverId無=0（全行 serverId 保有）/ clientId無=105**。6I は同一 serverId を共有するローカル13行（3重複＋2重複）が server 5件に対応。
- 真因: `lib/db/index.ts` の `syncShotsFromServer` が照合を **clientId→createdAt のみ**で行い **serverId で照合していなかった**（修正前 619-625 付近）。全ローカル行が serverId を持つのに見ないため、Layout マウント毎の pull で同一サーバー行のローカルコピーが生成され得た。clientId 欠落(105/115・旧データ)＋ローカル createdAt(Date.now)とサーバー createdAt の乖離で fallback も外れる。発火源は `components/Layout.tsx:47`。

**Phase 1 修正内容（Super が git diff 全行 Read で検証）**
- `lib/db/index.ts` syncShotsFromServer: `localShotsByServerId` を構築し照合を **serverId→clientId→createdAt** に変更。serverId 一致行があれば必ず収束し addShot で新規追加しない。収束時は `patch` で **serverId/clientId の不足分のみ非破壊補完**し、**17データ項目（memo 含む）は一切上書きしない**（未 push の編集を保護）。実コードで上書きしないことを確認済み。
- `app/record/page.tsx`: `autoCollectErrorRef` ＋ online 復帰リスナを追加。!editId かつ error 時のみ `autoCollect()` 再実行（冒頭で error クリア）。編集中スキップ・unmount で解除。
- 変更は2ファイルのみ（+45/-13）。schema/migration/prisma/lib/sync.ts/本番DB は不変。

**Phase 1 品質ゲート（Super 自身が再実行）**
- `npm run lint`（=eslint）: **0 errors / 19 warnings**（全て無関係な既存ファイル。変更2ファイルは無警告）。
- `npm run build`（next build --turbopack）: **成功**（63ページ静的生成・/record 正常）。

**ケースB（元のテスト）の実データ結果**
- 編集した記録（serverId `cmqh8dnab…` / clientId `4b9e78d7…`）は **server=距離155**（距離変更は届いた）。
- だが**追記メモ「ショット」は server に無い（memo=""）＝端末 id=76 に取り残し**。→ **ケースBはきれいには合格していない**。ローカル重複が編集の宛先を混乱させ、編集が確実に届かない。メモは Phase2 のフィールドマージ→PUT で救出可能（消えていない）。
</known-fact>

<finding type="correction" severity="high">
**調査報告書の主因は実データで誤りと判明（再採用禁止）。**
`docs/research/2026-06-18-offline-sync-duplicate-rootcause.md` は「編集対象ローカル行は serverId==null、handleSave パス④で create-push が別行を作る」を主因と断定。
だが Super 実データは **serverId無=0（全行 serverId 保有）** で矛盾。タスク厳守どおりコード＋実データを正とし、
真因は **「syncShotsFromServer が serverId を見ず再 pull で増殖」**（パス④はトリガでない）と訂正。Phase1.1 はこの真因を直接封鎖。
→ 次セッションはこの報告書の「具体シナリオ」を信じない。構造的洞察（serverId 照合欠如）のみ有効。報告書に ⚠️警告ヘッダー追記を推奨。
</finding>

<finding type="overstatement">
**「開くだけで増殖する恐れ」は誇張**。pull で追加された複製は server の createdAt を持つため次回 pull から一致し、**実質は一度きりで収束（現状は安定・無限増殖しない）**。Phase1.1 で恒久的に安定。よって緊急性は低く、通常閲覧は可。当面の注意は「新規オフライン編集を控える」のみ。
</finding>

<commit-status>
- ブランチ **main**。先端 `9568eec`（前ノートの docs コミット）。
- **未コミット（working tree, main）**: `M app/record/page.tsx`・`M lib/db/index.ts`（Phase1）。`?? docs/research/2026-06-18-offline-sync-duplicate-rootcause.md`（調査報告書・未追跡）。本ノートも新規。
- Phase1 は**専用ブランチ未作成・未コミット**（Super の「branch→commit」提案は未実行のままユーザーが Phase2 修正CC を起動）。
- Phase2 のファイルはまだ無い（`lib/db/dedup.ts` 不在）。
- **コミットは Phase2 着地＋Super 検証後**に行う（走行中CC が lib/db/index.ts を追加変更し得るため、今コミットすると半端を掴むリスク。後回しでなく「CC完了後すぐ」コミットする方針）。
</commit-status>

<risk>
1. **Phase2 修正CC の出力は未検証**。着地したら Super が diff・データ消失ゼロ性（serverId==null 不触/PUT 成功後のみ DELETE/memo マージで「ショット」保全/競合は破棄せずマージ）・build・lint を全て裏取りしてから採用。CC 報告は鵜呑みにしない。
2. **Phase1 はデプロイ前**。push=本番自動デプロイ（トランクベース）。コア同期を触るため push 前に build/lint 再確認（CLAUDE.md）＋ユーザー明示 OK 必須。autoCollect 修正の実機（オンライン復帰でエラー消える）も本番反映後に確認。
3. **掃除（Phase2 実行）はデータ操作**。必ず dryRun→件数/マージ内容をユーザー承認→実行（`{dryRun:false,confirm:true}`）。自動実行禁止。実行前に shots を JSON エクスポートでバックアップ推奨。
4. **取り残しメモ「ショット」**は端末 id=76 に残存・回収可能だが Phase2 実行まで server 未反映。
5. ローカルDBが3つ存在（古い `KigasuruDB`＝空/レガシー、`KigasuruDB_cmgebj45j0…`＝別アカウント shots=0、有効な `KigasuruDB_cmgnocpa3…`＝115件）。別アカウントでのログイン履歴あり。掃除対象は有効DBのみ。レガシーDBの扱いは別途任意。
6. 段階4 本番DB重複清掃は**不要**（サーバーきれい）。設計書 §9-3 の本番DELETE は今回スコープ外。
</risk>

<verification>
[診断] client（IndexedDB 115件/serverId無0/clientId無105）＋server（40件/重複なし/cmqh8dnab=155 memo空）をユーザー実機スクショで Super 照合。
[Phase1静的] Super 再実行: lint=0 errors / build=success（63ページ）。git diff 全行 Read で「17項目を上書きしない」を確認。
[Phase2] 未検証（CC 実装中）。
</verification>

<next-action>
次セッションが最初にやること:
1. このノートを Read。報告・ノートを信じず実機照合:
   - `git -C ~/Projects/kigasuru status --short`（Phase1 の M 2件＋Phase2 着地で `lib/db/dedup.ts` 等が増えているか）
   - `git -C ~/Projects/kigasuru log --oneline -3`（先端 `9568eec`・未コミットのはず）
   - `git -C ~/Projects/kigasuru diff`（Phase1＋Phase2 の現状）
2. **Phase2 修正CC の出力を受け取り Super 自身で裏取り**: 追加ファイル diff／データ消失ゼロ性（serverId==null 不触・PUT 成功後のみ DELETE・memo「ショット」がマージで救出・競合は破棄せずマージ・dryRun/confirm 2モード）／`npm run lint`／`npm run build`。CC 報告は鵜呑みにしない。
3. 問題なければコミット（branch→commit を推奨。トランクベースで push=本番デプロイのため）。CLAUDE.md の push 前 build/lint を満たす。
4. **ユーザー明示 OK を取って push（=本番デプロイ）**。Phase1（同期serverId照合＋autoCollect）と Phase2（掃除機能）をまとめて反映。
5. 反映後、掃除を実行: `await __dedupeShots({dryRun:true})` → 削除件数とメモ救出を**ユーザーに提示・承認** → `await __dedupeShots({dryRun:false,confirm:true})`。ローカルが ~40件に減り、メモ「ショット」が server に戻ることを確認。
6. **ケースB をきれいに再テスト**（オフライン編集→復帰→距離＆メモ両方が server へ届くこと）。autoCollect エラーが復帰で消えることも確認。
7. 完了引き継ぎノートを作成。
※ Dependabot は別件で 0件クローズ済み（前ノート）。今回のコア機能バグと混同しない。
</next-action>

<reflection>
- 実機スモークテスト（ケースB）が、build/lint では出ない本物のコア機能バグ（ローカル重複＋編集不達）をあぶり出した。「コード+ビルド検証済」を過信せず実機を踏んだ価値。
- サブエージェント報告を鵜呑みにせず実データで裏取りし、調査報告書の主因（serverId==null シナリオ）を1件訂正できた。修正CC の Phase1 も git diff 全行＋lint/build 再実行で「メモ非上書き」を実証してから採用。
- 「増殖する恐れ」を実コードで再検証して誇張と判定し、ユーザーに不要な不安（アプリを開くな等）を与えなかった。環境問題（サーバー無関係）と実装問題（ローカル照合）を切り分け。
- 本番DB削除（怖い承認制操作）が不要と確定できたのは、ローカルとサーバーの実データを突き合わせたから。
</reflection>
</content>
