> ⚠️ **【警告・参照禁止】このノートは誤前提・中間スナップショットです（2026-06-14 追記）**
> 本ノートは「コード未コミット・migration 未生成・dev-tier1 endpoint 未確認」時点の記録です。
> その後すべて解消済み（migration 生成 → commit `85e554b` → push → 本番デプロイ完了・動作確認 OK）。
> **正となるノート**: `2026-06-14-tier1-phase2-E-deploy-complete-handover.md`（最新・正）。中間記録として `2026-06-14-tier1-phase2-D3a-prod-baselined-handover.md`。
> 本ノートの `<status>` / `<next-action>` 等は現状と矛盾するため**参照しないこと**（AGENTS.md 規律＝削除せず警告で残置）。

---

# 2026-06-14 段階2 コード編集完了＋migration生成前 引き継ぎノート

<reliability>
ctx 残量: 中〜やや低。本セッションは precheck A〜D 完遂 ＋ コード編集（schema / Dexie / 互換シム）完遂＋Super独立検証 ＋ テスト用 Neon ブランチ dev-tier1 の作成指示まで。
- `<known-fact>` は Super が本セッションで直接 Read / git diff / ローカルコマンド（tsc・eslint・git）で実測、またはユーザー実機（Neon コンソール画面）で確認したもの。
- dev-tier1 の接続先 endpoint は **Super 未確認**（ユーザーが作成後そのまま次セッションへ移行したため）。次セッションで再確認。
- コード変更3ファイルは **未コミット**（working tree に存在）。
</reliability>

<context>
kigasuru 記録システム改修・1段目（土台）。4段階のうち段階1（TTL）完了済み。本セッションは段階2（DB構造変更）の precheck＋コード編集まで。
- 設計書: `docs/plans/2026-06-13-tier1-foundation-design.md`（§4 スキーマ差分・§9 移行手順が段階2本体）。
- 前ノート: `docs/handover/2026-06-13-tier1-phase2-prep-handover.md`（precheck 設計）。
- スコープ: 段階2 = DB構造＋Dexie v6 まで。API/sync 実装は段階3（触らない）。重複清掃は段階4。
</context>

<status>
- ✅ precheck A〜D 全解消（下記 known-fact）。
- ✅ コード編集（schema.prisma / lib/db/index.ts / admin/analytics）完了・Super 独立検証済（tsc・eslint EXIT 0）。**未コミット**。
- ⬜ テスト用ブランチ dev-tier1: 本セッション末にユーザーが作成（設定は下記）。次セッションで存在＋接続先を再確認。
- ⬜ migration 生成 → dev-tier1 でテスト: 未着手。
- ⬜ 本番バックアップ → 本番適用 → コミット → push: 未着手。
- ⬜ 段階3・4: 未着手。
</status>

## precheck 結果（全解消・確定事実）

<known-fact>
[事実] DB接続先 = Neon プロジェクト「**kigasuru**」（個人org `miyagawakiyomi@gmail.com`・Free）の **main ブランチ＝本番**。endpoint=`ep-quiet-term-a1p9eu1n`（pooled は `-pooler` 付き）、db=`neondb`、role=`neondb_owner`、region=ap-southeast-1、**PostgreSQL 17**。`.env`・`.env.local` の両方が同一 endpoint を指す（**専用 dev DB は存在しなかった**）。Connect ダイアログで突合済。
[事実] 別org「Vercel: Senrigan」の `invoice-prod` / `rodo-prod` は kigasuru と無関係（混同注意）。
[事実] precheck D: `SELECT count(*) FROM "Shot"` → **shots=187 / users=11**（設計書想定と一致・データ正常）。
[事実] バックアップは **Neon ブランチを主軸**（本番PG17 vs ローカル pg_dump 14.17 ＝版不一致で論理ダンプは拒否される。§9-1B は使わない or 版を上げる）。
[事実] migration/dump は **DIRECT_URL**（非pooled＝Connection pooling OFF 側）を使う（§9-1 known-fact）。
[事実] `shadowDatabaseUrl` は schema.prisma に未設定。
</known-fact>

## コード編集の内容（未コミット・git diff 実証済）

<known-fact>
変更3ファイルのみ（`git status` で M）:
1. **prisma/schema.prisma**（§4.1-4.3）: `Shot.distance` Int→**Int?**／`clientId String? @unique`・`roundId String?`・`holeNumber Int?` 追加／`round Round? @relation(... onDelete: SetNull)`・`@@index([roundId])` 追加。**Round モデル新設**（§4.2・clientId は持たせない）。`User` に `rounds Round[]`。**既存フィールド脱落なし**。diff が211行と大きいのは `prisma format` の空白整列（意味変更なし）。
2. **lib/db/index.ts**（§4.4）: `interface Shot` に `clientId?`/`roundId?`/`holeNumber?`/`dirty?` 追加。`interface Round` 新設。`KigasuruDB` に `rounds!: Table<Round, number>`。`version(6)` 追記（stores に clientId/roundId/holeNumber 追加・rounds 新規。**★dirty は index 文字列に含めない**。upgrade で `clientId=crypto.randomUUID()` backfill・roundId/holeNumber/dirty を既定値補完）。
3. **app/api/admin/analytics/route.ts**: L135 の型 `distance: number` → `number | null`（**1行・互換シム**）。設計書 §6.4 が見落とした唯一のビルド破壊箇所。値変換・ロジック変更なし。消費側（admin/analytics/page.tsx 等）は JSON を自前型で受けるため波及なし。
</known-fact>

<verification>
CC が `prisma format`／`prisma validate`（valid 🚀）／`prisma generate` 成功を報告。**Super が独立再実行**: `npx tsc --noEmit` → **EXIT 0（型エラーゼロ）**／`npx eslint`（変更2 TS ファイル）→ **EXIT 0**。すべて DB 非接続。
</verification>

## dev-tier1 ブランチ（本セッション末にユーザー作成）

<known-fact>
ユーザーが Neon コンソール「Create new branch」で作成（設定）:
- Name: **dev-tier1** / Parent: **main** / データ起点: **「Branch data and schema」**（＝現時点の最新データ＋スキーマのコピー） / Auto-delete: **No auto-delete を推奨**（次セッションまで保持）。
</known-fact>
<unconfirmed>
dev-tier1 の接続先 endpoint は Super 未確認。Auto-delete を「After 1 day」のままにしていた場合、次セッションまでに自動削除されている可能性あり。**次セッション冒頭で存在を確認し、無ければ同設定で再作成**する。
</unconfirmed>

<next-action>
次セッションが最初にやること:
1. このノート ＋ 設計書 §4・§9 を Read。
2. `git status` で working tree に 3 ファイルの変更が残っているか確認（未コミット）。消えていれば本ノート「コード編集の内容」から再実装。
3. Neon コンソールで **dev-tier1 の存在を確認** → 無ければ再作成（main / Branch data and schema / No auto-delete）。Connect ダイアログで dev-tier1 の接続先（host・password マスク）を確認し、prod endpoint `ep-quiet-term-a1p9eu1n` と**別物**であることを突合。
4. dev-tier1 の接続文字列（pooled→DATABASE_URL用・direct→DIRECT_URL用）を**ローカルの `.env.dev.local`（`.gitignore` の `.env*` で除外済）にユーザーが貼り付け**（**Super には送らない**）。`.env`（本番）は触らない。
5. migration 生成（下記 `<migration-plan>`）→ **RLS 行を手動追記** → dev-tier1 に対して test 適用 → §9-2 検証。
6. 本番適用（**Super＋ユーザー・1ステップずつ画面確認**）: バックアップブランチ `pre-tier1-YYYYMMDD` 作成 → 接続先確認 → prod main へ migrate deploy → §9-2 検証。
7. `prisma generate` → **lint/build（`npm run build`。push 前必須・CLAUDE.md）** → schema＋Dexie＋analytics＋migration を**1コミット**→ push（→ Vercel 自動デプロイ。本番DBは先に migrate 済なので整合）。
8. dev-tier1 削除（後片付け）。
</next-action>

<migration-plan>
推奨＝**shadow DB を使わない生成**（Neon の `migrate dev` shadow 問題を回避）:
1. `git show HEAD:prisma/schema.prisma > /tmp/old_schema.prisma`（編集前スキーマ取得）
2. `npx prisma migrate diff --from-schema-datamodel /tmp/old_schema.prisma --to-schema-datamodel prisma/schema.prisma --script > /tmp/tier1.sql`（DB・shadow 不要で canonical DDL 生成）
3. `prisma/migrations/<YYYYMMDDHHMMSS>_tier1_foundation/migration.sql` を作成し /tmp/tier1.sql を格納。**§4.5 と一致確認**（distance DROP NOT NULL／3列 ADD／Round CREATE／`Shot_clientId_key` unique／`Shot_roundId_idx`／`Round_userId_date_idx`／FK 2本）。
4. **末尾に手動追記**: `ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;`（Prisma は生成しない・§4.5(6)。レビュー必須項目）。
5. dev-tier1 へ test 適用: `npx dotenv-cli -e .env.dev.local -- npx prisma migrate deploy`（dev-tier1 を明示。既存 migration は適用済記録あり→ `tier1_foundation` のみ適用）。※ **Prisma CLI は `.env` しか自動で読まない**ため、dev を狙うには `dotenv-cli -e` で明示注入する。`.env` を本番のまま保つことで dev⇄prod の取り違えを防ぐ。
6. 検証（§9-2・dev-tier1 上。Neon SQL Editor で read-only 実行が安全）: `migrate status`=Applied／Round テーブル・index・FK／`Shot`（clientId unique・distance nullable・roundId）／`SELECT relrowsecurity FROM pg_class WHERE relname='Round'`='t'／`SELECT count(*) FROM "Shot" WHERE distance IS NULL`=0（既存値不変）。
- 代替＝`prisma migrate dev --name tier1_foundation`（`shadowDatabaseUrl` に第2ブランチを設定すれば canonical だが setup 増）。
- 本番適用（step6）は **`.env`（本番）を使う plain `npx prisma migrate deploy`**。叩く前に接続先が prod であること・backup ブランチ作成済みであることを画面確認。
</migration-plan>

<risk>
1. [最重要] **本番への適用は backup ブランチ作成後・接続先を画面確認してから**（rodo 教訓）。`.env`(prod) と `.env.dev.local`(dev) を使い分け、各 migrate コマンド前に**どちらを叩いているか確認**。dev に向けたまま prod を、prod に向けたまま dev を叩かない。
2. **RLS 行追記漏れ**: `ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;` は手動。migration.sql レビュー必須。
3. **デプロイ順序**: 本番 migrate deploy → その後に push（Vercel デプロイ）。Vercel ビルドは migrate を自動実行しない（build script は `next build` のみ）。新クライアントを未 migration の本番に当てない（§5.7・§10）。
4. **未コミット**: コード変更3ファイルは working tree のみ。PC 障害で消える。次セッション早期に migration を作って **1 コミット**へ。
5. **可逆性の窓**: 本番適用〜段階3クライアント出荷前のみ完全ロールバック可（§9-4）。逆 DDL／backup ブランチ切替。
6. dev-tier1 の Auto-delete 設定次第で消える可能性（上記 unconfirmed）。
</risk>

<reflection>
本セッション（Super）:
- precheck A〜D を画面確認しながら完遂。接続先の**別org・名前不一致**（kigasuru は個人org・Vercel:Senrigan org には rodo/invoice しか無い）を本番接続前に特定し、誤プロジェクトへの migration を未然回避。
- 設計書 §6.4 の互換分析漏れ（admin/analytics の `number` 固定型）を CC 実装前に Super 自身の grep で発見し、ビルド破壊を予防（修正は1行の型互換シムに限定＝Phase 3 を侵食せず）。
- CC 報告を git diff＋tsc/eslint の独立再実行で実証（CLAUDE.md 検証ルール）。
次セッションへの戒め:
- `.env`/`.env.dev.local` の接続先切替（dev⇄prod）の取り違えに最大注意。各 migrate 前に必ず接続先確認。
- RLS 行の手動追記を忘れない。
- 機密（接続文字列＝パスワード入り）は Super に送らせず、ユーザーがローカル env に直接貼る。
</reflection>
