# 2026-06-14 段階2 D3a完了（本番ベースライン済・tier1 deploy 直前）引き継ぎノート

<reliability>
ctx 残量: 中。本ノートの `<known-fact>` は、本セッションで Super が CC 報告（migrate status / resolve / deploy の生出力）＋自身の Bash（git / grep / ls）で実測、またはユーザー実機（Neon コンソール画面・endpoint 報告）で確認したもの。**dev-tier1 で全手順を実証済み**。本番は D1（read-only 確認）＋D3a（baseline）まで実測。**D3b（tier1 deploy）は未実行**。
旧ノート `2026-06-14-tier1-phase2-codeedit-handover.md` の前提「既存 migration は適用済記録あり→tier1 のみ適用」は **誤りだった**（本番・dev-tier1 とも `_prisma_migrations` 不在＝migrate 履歴ゼロ）。本ノートが上書きする。**旧ノートは参照しないこと。**
</reliability>

<context>
kigasuru 記録システム改修・段階2（DB構造変更）。
- 設計書: `docs/plans/2026-06-13-tier1-foundation-design.md`（§4 スキーマ差分・§9 移行手順が本体）。
- スコープ: 段階2 = DB構造＋Dexie v6 まで。API/sync 実装は段階3（触らない）。重複清掃は段階4。
- 本セッションで「migration 生成 → dev-tier1 で全手順検証 → 本番 D1確認 → 本番 D3a(baseline)」まで完了。残りは **D3b(本番 deploy) → E(commit/push) → F(dev-tier1 削除)**。
</context>

<status>
- ✅ migration 生成・RLS 手動追記・Super レビュー（設計書 §4.5 と完全一致）。
- ✅ dev-tier1（`ep-steep-wind-a1ns9o44`）: baseline → tier1 deploy → §9-2 検証を**全通過**（手順実証）。
- ✅ 本番 D1: 接続先=本番確認・履歴ゼロ確認（read-only。書き込みなし）。
- ✅ 本番 D3a: 既存5件 baseline（`resolve --applied`）成功・**tier1 のみ pending**・スキーマ/データ不変。
- ✅ バックアップブランチ `pre-tier1-20260614` 作成（main / Branch data and schema / No auto-delete）。
- ⬜ **本番 D3b: tier1_foundation を deploy＋§9-2 検証。未実行（次セッションの初手）。**
- ⬜ Phase E: `prisma generate` → build/lint → 1コミット → push。
- ⬜ Phase F: dev-tier1 削除。
- 段階3・4: 未着手。
</status>

## 確定事実

<known-fact>
[事実] 接続先: 本番 = Neon「kigasuru」/ main、endpoint `ep-quiet-term-a1p9eu1n`（`.env`・`.env.local` とも本番を指す）。dev-tier1 = `ep-steep-wind-a1ns9o44`（`.env.dev.local` が指す・`.gitignore` の `.env*` で除外済）。両者別物・突合済。
[事実] 本番・dev-tier1 とも構築時に Prisma migrate 履歴なし（`_prisma_migrations` テーブル不在）。db push 等で構築されたと判断。正しい手順は「既存5件 baseline → tier1 のみ deploy」（dev-tier1 で実証）。
[事実] 本番 D3a で既存5件（`20251004053544_init` / `20251004105000_add_line_friend_promotion` / `20251004141333_add_email_verification` / `20251005232755_add_pending_registration` / `enable_rls`）を `resolve --applied` 済み。本番に `_prisma_migrations` が作られ5件記録、`tier1_foundation` のみ pending。**resolve は SQL 未実行＝スキーマ/データ不変**。
[事実] migration ファイル: `prisma/migrations/20260614005736_tier1_foundation/migration.sql`。内容＝distance DROP NOT NULL／clientId・roundId・holeNumber を ADD／Round CREATE（10列＋pkey）／`Shot_clientId_key` unique／`Shot_roundId_idx`／`Round_userId_date_idx`／FK2本（roundId→Round=SET NULL・userId→User=CASCADE）／末尾に手動 `ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;`。設計書 §4.5 と一致。
[事実] dev-tier1 検証結果（本番でも同結果を期待）: Round 構造10列・RLS `relrowsecurity=t`・Shot の clientId/roundId/holeNumber/distance すべて nullable=YES・`distance IS NULL`=0・件数 187 shots/11 users 不変。deploy で `tier1_foundation` のみ適用・out-of-order エラーなし。
[事実] 未コミット: `prisma/schema.prisma` / `lib/db/index.ts` / `app/api/admin/analytics/route.ts`（M）＋ `prisma/migrations/20260614005736_tier1_foundation/`（untracked）。本ノート自体も untracked。
[事実] Round の RLS は policy なし（既存テーブルと同方針＝PostgREST/anon 遮断・Prisma direct 接続はバイパス）。policy 付与は**不要**（Super 確定・§rls）。
[事実] psql は `/opt/homebrew/bin/psql`（v14 系。本番 PG17 と版差あるが SELECT / `\d` は可。`pg_dump` 論理ダンプは版差で不可＝バックアップは Neon ブランチ主軸）。
[事実] `dotenv-cli` 未インストール。dev 適用は `npx --yes -p dotenv-cli dotenv -e .env.dev.local -- ...` で都度取得（dev-tier1 で動作実証済）。**本番では使わない**（プレーン `npx prisma`＝`.env`＝本番）。
</known-fact>

<critical-deploy-order level="high">
**本番 deploy（D3b）→ その後に commit/push（E）の順を厳守。逆は禁止。**
理由: push すると Vercel が新クライアント（新 Prisma schema 由来の生成 client）をデプロイする。本番に tier1 未適用のまま新 client を当てると、Shot クエリが存在しない列（clientId 等）を SELECT して壊れる可能性。本番 schema を先に tier1 へ揃えてから push する（設計書 §5.7・§10）。
現在: 本番 schema は tier1 未適用（baseline のみ）。デプロイ済みアプリは旧 client（未 push）＝**現状は健全**。D3b で本番 schema を揃え、E で push。
</critical-deploy-order>

<next-action>
次セッションが最初にやること:
1. このノート＋設計書 §4・§9 を Read。旧ノート（codeedit-handover）は誤前提のため Read しない。
2. `git status` で未コミット3ファイル＋migration フォルダが残存か確認。消えていれば旧コード handover「コード編集の内容」から再実装＋下記手順で migration 再生成。
3. **D3b（本番 deploy）**: 下記 `<d3b-prompt>` を実装CC に投入。接続先=本番再確認 → deploy → §9-2 検証。
4. D3b 検証 OK を Super が判定後、**Phase E**: 下記 `<phase-e-prompt>` を実装CC に投入。
5. **Phase F**: dev-tier1 削除（Neon コンソール・ユーザー操作）。バックアップ `pre-tier1-20260614` は段階3クライアント出荷まで残す（可逆性の窓）。
</next-action>

<d3b-prompt>
```
【実装CC / kigasuru 段階2 — Phase D3b: 本番へ tier1_foundation を deploy＋検証】

■ 前提
- D3a 済（本番 baseline 完了・tier1_foundation のみ pending）。backup ブランチ pre-tier1-20260614 あり。dev-tier1 で実証済み。

■ 接続先（厳守・dev⇄prod取り違え厳禁）
- 本番 ep-quiet-term-a1p9eu1n。プレーンな npx prisma（.env が本番）。
- dotenv-cli / -e .env.dev.local は絶対に使わない（dev 用）。
- 書き込み前に host を確認、ep-quiet-term でなければ即 STOP。

■ やること（全出力を報告）
1) npx prisma migrate status
   → "Datasource ... at <host>" が ep-quiet-term-a1p9eu1n、tier1_foundation のみ pending を確認。違えば STOP。
2) npx prisma migrate deploy
   → 出力を一字一句報告。tier1_foundation のみ適用されること。
   ※ エラー・想定外失敗は自力修復せず（resolve --rolled-back / reset を打たない）全文報告して STOP。
3) npx prisma migrate status   → up to date。
4) §9-2 検証（psql・read-only。.env を source し endpoint 確認後）:
   set -a; . ./.env; set +a
   echo "接続先: $(echo "$DIRECT_URL" | grep -oE 'ep-[a-z0-9-]+')"   # ep-quiet-term 確認。違えば中止
   psql "$DIRECT_URL" -c '\d "Round"'
   psql "$DIRECT_URL" -c "SELECT relrowsecurity FROM pg_class WHERE relname='Round';"
   psql "$DIRECT_URL" -c "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='Shot' AND column_name IN ('distance','clientId','roundId','holeNumber') ORDER BY column_name;"
   psql "$DIRECT_URL" -c 'SELECT count(*) FROM "Shot" WHERE distance IS NULL;'
   psql "$DIRECT_URL" -c 'SELECT count(*) AS shots, count(DISTINCT "userId") AS users FROM "Shot";'

■ 禁止事項
- migrate dev / reset / db push 不使用。dotenv-cli / -e 不使用。
- コード変更・git add/commit/push をしない（commit/push は次の Phase E）。
- .env の中身（接続文字列）を出力しない。deploy 失敗時に自力修復しない。

■ 期待値（dev-tier1 と同じはず）
- deploy は tier1_foundation のみ適用。Round 構造10列／RLS=t／4列 nullable=YES／distance IS NULL=0／件数 187/11 不変。

■ 最終報告
- 各コマンド出力（特に deploy 適用 migration 名）＋検証6項目＋異常有無。
```
</d3b-prompt>

<phase-e-prompt>
```
【実装CC / kigasuru 段階2 — Phase E: client 生成・ビルド確認・1コミット・push】

■ 前提
- 本番 tier1 deploy 済（D3b 検証 OK）。本番 schema が新スキーマと一致＝新 client を push して安全。

■ やること
1) npx prisma generate（新スキーマで Prisma Client 再生成）
2) npm run build（CLAUDE.md: push 前必須）→ エラーあれば修正方針を報告して STOP（勝手に直さない）
3) npm run lint（scripts は "eslint"）→ 同上
4) git add（対象を明示。.env 系は絶対に add しない）:
   git add prisma/schema.prisma lib/db/index.ts app/api/admin/analytics/route.ts prisma/migrations/20260614005736_tier1_foundation/
   ※ git status で .env / .env.dev.local / .env.local が staged に無いことを確認
5) git commit（1論理単位）。メッセージ例:
   feat(db): 段階2 土台スキーマ（clientId/roundId/holeNumber・Round・distance nullable）＋Dexie v6＋migration
   （本文に: 本番は migrate deploy 済・Dexie v6 は backfill のみで後方互換）
6) git status / git log -1 で確認 → git push origin main
   ※ push で Vercel 自動デプロイ。本番 DB は先に migrate 済なので整合。

■ 禁止事項
- .env 系を add/commit しない。force push しない。
- build/lint 失敗を無視して push しない（CLAUDE.md）。
- generate と commit 以外でコード内容を勝手に変更しない。

■ 最終報告
- generate / build / lint 結果、commit hash、push 結果。
```
</phase-e-prompt>

<risk>
1. **デプロイ順序**（上記 `<critical-deploy-order>`）: D3b → E を厳守。push 先行は本番アプリ破壊。
2. **dev⇄prod 取り違え**: 本番は**プレーン** `npx prisma`（.env）。dev は `dotenv -e .env.dev.local`。D3b は本番＝dotenv を使わない。各コマンド前に `migrate status` で host=ep-quiet-term 確認。
3. **未コミット**: PC 障害で消失。D3b 後すぐ E で1コミット。
4. **可逆性の窓**: 段階3クライアント出荷前のみ完全ロールバック可。問題時は backup ブランチ `pre-tier1-20260614` へ切替、または逆 DDL（§9-4）。
5. **D3b deploy 失敗**: 自力修復させず全文報告 → Super 判断（backup あり）。
</risk>

<reflection>
- 旧ノートの未確認前提（migrate 履歴あり）を **dev-tier1 テストで先に潰せた**。本番でいきなり deploy していたら `init` 再適用で "relation already exists" 失敗していた。「テスト用ブランチで先に通す」の価値が実証された。
- 機密（接続文字列＝パスワード入り）は Super に送らせず `.env.dev.local` 直貼り＋endpoint だけ突合で運用。Super の応答にも機密を残さず。
- 本番は baseline（D3a）と deploy（D3b）を2段に分け、各段で host 確認＋報告。dev⇄prod 取り違えゼロ。
- 次セッションへの戒め: 本番はプレーン prisma（dotenv 禁止）。D3b→E の順厳守。失敗時は backup へ。
</reflection>
</content>
</invoke>
