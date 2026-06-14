# 2026-06-14 段階2 D3b＋E＋本番デプロイ完了（Phase F・ノートコミットのみ残）引き継ぎノート

<reliability>
ctx 残量: 中。本ノートの `<known-fact>` は本セッションで Super 自身の Bash（git / gh api / grep / Read）で実測、または実装CC の生出力報告・ユーザー実機操作で確認したもの。
`<finding>`（「60」表示バグ）は再現せず自然消滅したため、機序は状況証拠ベース（断定できない範囲を明記）。
直前ノート `2026-06-14-tier1-phase2-D3a-prod-baselined-handover.md`（D3a 完了時点）の続き。さらに古い `2026-06-14-tier1-phase2-codeedit-handover.md` は誤前提のため参照しない（D3a ノートが既に無効化を明記）。
</reliability>

<context>
kigasuru 記録システム改修・段階2（DB構造変更＋Dexie v6）。
- 設計書: `docs/plans/2026-06-13-tier1-foundation-design.md`（§4 スキーマ差分・§9 移行手順・§10 実装順序が本体）。
- スコープ: 段階2 = DB構造＋Dexie v6 まで。API/sync 実装は段階3（未着手）。重複清掃は段階4。
- 本セッションで D3b（本番 deploy）→ §9-2検証 → Phase E（generate/build/lint/commit/push）→ 本番デプロイ確認 → 動作確認①②③ まで完了。
</context>

<status>
- ✅ D3b: 本番へ `tier1_foundation` を deploy。§9-2 検証 全項目一致（非破壊・既存187件不変）。
- ✅ Phase E: `prisma generate` → build(error0) → lint(error0) → 1コミット(85e554b) → push(origin/main)。
- ✅ 本番デプロイ: Vercel commit status=success、Production に 85e554b 反映（Super が gh api で実測）。
- ✅ 動作確認: ①アプリ起動/ログイン ②ショット1打記録・保存 ③履歴/分析表示 — ユーザー実機で OK。
- ⬜ **Phase F: dev-tier1（`ep-steep-wind-a1ns9o44`）削除。未実行（次セッションの主タスク）。backup は残す。**
- ⬜ **handover ノート3件のコミット。未実行（次セッション初手の housekeeping）。**
- 段階3（API改修＋クライアント）・段階4（重複清掃）: 未着手。
</status>

## 確定事実

<known-fact>
[事実] D3b deploy: 接続先 host = `ep-quiet-term-a1p9eu1n`（本番）。適用は `20260614005736_tier1_foundation` の1件のみ。deploy 後 migrate status = up to date。
[事実] §9-2 検証（本番・psql read-only）: Round 10列＋`Round_userId_date_idx`＋`Round_userId_fkey`／`relrowsecurity=t`／Shot の clientId・distance・holeNumber・roundId すべて nullable=YES／`distance IS NULL`=0／187 shots・11 users（既存不変）。dev-tier1 と同一結果。
[事実] Round の RLS はポリシー無し（`Policies: (none)`）。これは設計どおり＝既存テーブルと同方針（PostgREST/anon 遮断・Prisma direct はバイパス）。ポリシー付与は段階以降も不要（Super確定）。migration.sql に `CREATE POLICY` は無い。
[事実] commit 85e554b（`feat(db): 段階2 土台スキーマ…＋Dexie v6＋migration`）。4ファイル: `prisma/schema.prisma` / `lib/db/index.ts` / `app/api/admin/analytics/route.ts` / `prisma/migrations/20260614005736_tier1_foundation/migration.sql`。.env系・docs は不含。Co-Authored トレーラ付き（push 済のため除去せず）。
[事実] push: `c93cbee..85e554b main -> main`（force なし）。Vercel 自動デプロイ → status=success / Production deployment（2026-06-14 06:45 UTC, sha 85e554b）。
[事実] Dexie v6 の upgrade 関数は `shots` テーブルのみ modify（clientId backfill 等）。`settings`（customClubs 等）は不変。
[事実] backup ブランチ `pre-tier1-20260614`（Neon・main 分岐）健在。段階3クライアント出荷までロールバック点として残す。
[事実] dev-tier1 = `ep-steep-wind-a1ns9o44`（`.env.dev.local` が指す・gitignore 済）。本番 = `ep-quiet-term-a1p9eu1n`（`.env`/`.env.local`）。両者別物。
</known-fact>

<user-confirmed-spec>
動作確認①②③（起動/ログイン・記録保存・履歴/分析表示）は本番でユーザーが実機確認し「とりあえずできる」。段階2の本番デプロイは健全と判断。
</user-confirmed-spec>

<finding type="resolved-glitch">
「強度を選択」画面に、追加した「60」クラブのカードが一瞬混入して見えた件（ユーザー報告・スクショ IMG_4830）。
- 切り分け結果: **段階2デプロイは原因ではない**（今回コミットは record/page.tsx 不変・Dexie は shots のみ）。
- 「60」カードは現行クラブカードのアイコン（record/page.tsx 1006-1018 の SVG＝Heroicons map パス）で描かれていた＝クラブカードが強度画面に紛れたもの。データは正常。
- 現行コードでは強度ステップ（case 4, 1037-1109行）は `フル/抑えめ/ソフト` の固定3つのみ描画。クラブカードが出る経路は無い。
- ユーザーが PC（素の状態）で再現確認 → 出ず。PWA も再読込で消失（両方で消えた）。
- [推測・断定不可] デプロイ直後 × このアプリの不安定な Service Worker による一時的なキャッシュ不整合（古いJS＋新データの混在描画）。再現せず自然消滅したため、旧バンドルの具体的描画経路までは証明できない。
- 結論: いま追うべきコードのバグは無い。データ損失も無い。再発時はハードリフレッシュで解消。
</finding>

<risk>
1. **Phase F の dev⇄prod / ブランチ取り違え**: dev-tier1 削除時、削除対象が `ep-steep-wind-a1ns9o44`(dev-tier1) であって `main`(本番) でも `pre-tier1-20260614`(backup) でもないことを Neon 画面で必ず確認してから実行。段階的画面確認方式（一気通貫の手順を出さない）。
2. **backup の早期削除禁止**: `pre-tier1-20260614` は段階3クライアント出荷まで残す（可逆性の窓）。
3. **可逆性の窓**: 段階3で新クライアントが clientId/null distance を書き始める前のみ完全ロールバック可（§9-4）。
</risk>

<followup type="record-only">
（いま手を付けない。段階3着手前にどこかで棚卸し）
- **壊れた Service Worker**: 上記グリッチの根。段階3（同期・SW作り直し, 設計書 §5.6/§10）で直す対象に含まれる。それまでデプロイ後の表示異常はハードリフレッシュで対処。
- **Dependabot 66件**（high 34 / moderate 28 / low 4）: 既存依存の脆弱性。今回変更と無関係。放置不可の規模。
- **クラブカードのアイコン取り違え**: record/page.tsx 1006-1018、コメント「ゴルフクラブアイコン」だが実パスは地図アイコン。軽微な見た目バグ。
</followup>

<next-action>
次セッションが最初にやること:
1. `cd ~/Projects/kigasuru` → このノートを Read。設計書 §10（実装順序）も確認。
2. `git status` で working tree 確認。未コミットは handover ノート3件のみのはず（コードは 85e554b で commit/push 済）。
3. **housekeeping: handover ノート3件をコミット**。`codeedit-handover.md` は誤前提のため、コミット前に冒頭へ ⚠️警告ヘッダー（「誤前提・D3a/Eノートが上書き済・参照禁止」）を付けてから（AGENTS.md 規律＝削除せず警告で残す）。docs のみ＝build/lint 不要。
4. **Phase F: dev-tier1 削除**（Neon コンソール・ユーザー操作）。Super は段階的画面確認方式で誘導: 現在の branch 一覧/選択中を画面で確認 → 削除対象が `ep-steep-wind-a1ns9o44`(dev-tier1) であり main/backup でないことを確認 → 削除。`pre-tier1-20260614` は残す。
5. Phase F 後、**段階3 の着手判断**（設計書 §10 #3 API改修 → #4-7 クライアント）。これは計画タスク。並行で followup（壊れた SW・Dependabot）を段階3スコープに織り込むか検討。
</next-action>

<reflection>
- 本セッション冒頭、6/13朝の「提案書作成」CC報告が誤ってこのセッションに貼られた。git status＋ファイル timestamp（6/13 07:30・既コミット 6e994c1）で「貼り間違い・別工程」と切り分け、D3b 出力と誤認しなかった。引き継ぎ・貼付物を鵜呑みにしない規律が機能。
- 「60」グリッチで即ロールバックに走らず、まず実 diff＋実コードで「段階2が原因か」を切り分けた。結果、段階2 は無関係と確定し不要なロールバックを回避。env(キャッシュ) vs code の切り分けはユーザーの素読み込みテストで決着。「環境問題か実装問題かを切り分ける」が正しく効いた事例。
- 機密（接続文字列）は Super に送らせず、endpoint 名のみで dev⇄prod を突合。本番 deploy は host 確認を実行直前に必須化して取り違えゼロ。
</reflection>
</content>
</invoke>
