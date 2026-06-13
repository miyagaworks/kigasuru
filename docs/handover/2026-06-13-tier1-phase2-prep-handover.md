# 2026-06-13 段階2（DB構造・本番DB操作）段取り 引き継ぎノート

<reliability>
ctx 残量: 中。本セッションは段階1実装の完遂＋段階2の段取り設計まで。**本番DBには一切接続していない**。
- `<known-fact>` は Super が本セッションで直接 Read / Grep / ローカルコマンド（git・ls・command -v）で実測。
- 本番DB の実数・PostgreSQL メジャー版・Neon branch 構成は **未確認**（次セッションで宮川さんと画面確認）。
- 段階1のコード変更は `git diff` で実証済み・push 済み（74f8086）。
</reliability>

<context>
kigasuru 記録システム改修・1段目（土台）。4段階のうち**段階1（TTL）完了**。本ノートは段階2の段取り。
- 宮川さん指示「今セッションは段取りだけ。次セッションで本格的に」→ 段階2の**本番DB操作（migration 適用・Neon branch 作成）は次セッションで実施**。
- 設計書: `docs/plans/2026-06-13-tier1-foundation-design.md`（§4 スキーマ差分・§9 移行手順が段階2の本体）。
- 前ノート: `docs/handover/2026-06-13-tier1-implementation-handover.md`（4段階方針・段階1スコープ）。
</context>

<status>
- ✅ 段階1（TTL）: 実装・lint・build・コミット（74f8086）・push 完了。本番デプロイ済み。
- ✅ 段階2 段取り: 設計書 §4,§9 精読・環境調査・本ノート作成。
- ⬜ 段階2 実装: 未着手（次セッション）。
- ⬜ 段階3・4: 未着手。
</status>

## 段階1 完了記録

<commit-status>
- コミット `74f8086`「fix(record): 位置・気温キャッシュを当日のみ有効化」
- 変更2ファイル: `lib/utils.ts`（`isSameLocalDay` 追加）/ `app/record/page.tsx`（import 1行 + 読み出し条件1行）。
- lint クリーン・build 成功・push（`42521a5..74f8086 main`）。working tree クリーン。
- 効果: 過去ラウンドのコース名・気温が新規記録へ混入する不具合を当日キャッシュ化で止血。
</commit-status>

## 段階2 で今セッションに判明した環境事実（最重要）

<known-fact>
[事実] datasource（`prisma/schema.prisma:6-10`）: provider=postgresql, url=`env("DATABASE_URL")`(pooled), directUrl=`env("DIRECT_URL")`。migration/dump は **DIRECT_URL** を使う（設計書 §9-1）。
[事実] migration 履歴: `20251004053544_init` / `_add_line_friend_promotion` / `_add_email_verification` / `20251005232755_add_pending_registration` / **`enable_rls`（タイムスタンプ無し・手動 migration）** / `migration_lock.toml`。命名規約 `<ts>_<name>`。次は `<ts>_tier1_foundation`。
[事実] `enable_rls/migration.sql` は全テーブルに `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;` のみ（ポリシー無し）。目的=PostgREST 直アクセス遮断、Prisma は DATABASE_URL 接続で RLS バイパス。→ **Round も同じ1行を追記するだけでよい**。
[事実] `.env` と `.env.local` の**両方**に DATABASE_URL / DIRECT_URL が存在（値は未確認・マスク）。Next の env 優先順位で開発時は `.env.local` が優先。→ **どちらが本番DBでどちらが dev DB を指すか未確定**。
[事実] `neonctl` **未インストール**。`psql`/`pg_dump` は 14.17（Homebrew）。
</known-fact>

<phase2-precheck>
**次セッション冒頭で必ず解消（本番DB操作の前提・事故防止）**:

A. **DB接続先の特定（最優先・事故防止の要）**
   - `.env` / `.env.local` の DATABASE_URL・DIRECT_URL が **本番 Neon** か **dev/別 branch** か。
   - `npx prisma migrate dev`（migration 生成）は shadow DB を作る＝**本番に向けて叩くと本番で勝手に DB 操作が走る**。dev DB が無ければ Neon に dev branch を作ってそこへ向ける。
   - 宮川さんと Neon コンソール画面で「現在の接続先 branch」を確認してから動く（rodo の main DB 誤 INSERT 教訓）。

B. **Neon branch バックアップ手段**
   - `neonctl` 未インストール → **Neon Web コンソールで branch 作成**（設計書 §9-1A の `neonctl` コマンドは使えない）。または `npm i -g neonctl`。
   - branch バックアップが主・即時・即ロールバック可（最優先手段）。

C. **pg_dump バージョン整合（補助バックアップ）**
   - ローカル pg_dump=14.17。本番 Neon が PG15/16 なら pg_dump 14 は**拒否される可能性**（server version mismatch）。
   - Neon コンソールで PG メジャー版を確認 → 不一致なら `brew install postgresql@16` 等で版を合わせる、または pg_dump（§9-1B）はスキップし branch バックアップ（B）に一本化。

D. **本番現況の再計測（設計書 §9-0・read-only）**
   - 接続先確認後、`SELECT count(*) FROM "Shot"` 等で件数（提案書 187件・最大108件/1ユーザー）から乖離がないか。乖離あれば原因確認してから進む。
</phase2-precheck>

<phase2-plan>
**段階2 実行順序**（設計書 §4,§9 を実行形に。各本番DB操作は Super が宮川さんと1ステップずつ画面確認）:

［事前・read-only］
0. 本ノート＋設計書 §4・§9 を Read。`<phase2-precheck>` A〜D を解消。

［コード＝実装CCプロンプトを Super 設計（コードを書く作業）］
1. `schema.prisma` を §4 after に編集:
   - Shot: distance を `Int?` へ／`clientId String? @unique`・`roundId String?`・`holeNumber Int?` 追加／`round Round? @relation(... onDelete: SetNull)`・`@@index([roundId])` 追加。
   - Round 新設（§4.2）。User に `rounds Round[]` 追加（§4.3）。
2. `lib/db/index.ts` に Dexie `version(6)` 追記（§4.4）＋ interface Shot/Round 差分。
   - ★IndexedDB 注意（§4.4 known-fact）: `dirty`(boolean) は stores 文字列に**含めない**／未同期抽出は `.filter(s => !s.serverId)`（null は index 不可）。

［migration 生成・レビュー＝dev DB に対して］
3. `npx prisma migrate dev --name tier1_foundation`（**dev DB へ**。接続先 A 解消後のみ）。
4. 生成 `migration.sql` 末尾に手動追記: `ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;`（§4.5(6)）。diff レビューで RLS 行の存在を**必須確認**。

［本番適用＝Super＋宮川さん・画面確認］
5. バックアップ: Neon branch 作成（B）＋（版が合えば）pg_dump（C）。
6. `npx prisma migrate deploy`（**DIRECT_URL＝本番**。branch/接続先を画面確認してから）。
7. `npx prisma generate`（型更新）。
8. 検証（§9-2）: `migrate status`=Applied／`\d "Round"`／`\d "Shot"`（clientId unique・distance nullable）／`relrowsecurity`='t'／`distance IS NULL`=0（既存値不変）。

［締め］
9. lint/build → コミット（schema＋migration＋Dexie）→ push。

**スコープ厳守**: 段階2は「DB構造＋Dexie v6」まで。同期ロジック置換・POST upsert・編集PUT配線・距離必須撤廃の **API/sync 実装は段階3**（触らない）。重複清掃は段階4。
</phase2-plan>

<risk>
1. [最重要] **DB接続先の取り違え**: migrate dev を本番に向ける事故。`<phase2-precheck>` A を解消するまで migrate 系コマンドを叩かない。
2. **RLS 追記漏れ**: 生成 SQL 末尾の `ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;`。Prisma は生成しない。step4 レビュー必須項目。
3. **可逆性の窓**: 段階2適用〜段階3クライアント出荷前のみ完全ロールバック可（§9-4）。段階3の前にロールバック判断を済ませる。
4. **ツール不足**: neonctl 未インストール／pg_dump 版不一致。バックアップを Neon branch（Web コンソール）に一本化すれば回避可。
5. **push 前 lint/build**（CLAUDE.md「git push 前に必ずビルド/リント確認」）。
</risk>

<next-action>
次セッションが最初にやること:
1. 本ノートを Read。
2. 設計書 `docs/plans/2026-06-13-tier1-foundation-design.md` の §4・§9 を Read。
3. `<phase2-precheck>` A（DB接続先の特定）を宮川さんと Neon コンソール画面で確認 ← **最優先。ここが未解消なら migrate を絶対に叩かない**。
4. B〜D を順に解消（branch バックアップ手段・pg_dump 版・本番現況再計測）。
5. 解消後、`<phase2-plan>` step1（schema.prisma 編集）＋ step2（Dexie v6）の実装CCプロンプトを Super が設計。
6. 本番適用（step5-8）は Super が宮川さんと1ステップずつ画面確認しながら実行。
</next-action>

<reflection>
本セッション（Super）:
- 段階1を最小変更（3行）で完遂。`git diff` で実装CC報告を実証（CLAUDE.md 検証ルール遵守）。push 前 lint/build を自分で再実行。コミット代行。
- 段階2の段取りで、設計書に明記の無い**環境の落とし穴4点**（DB接続先の二重定義・neonctl 未導入・pg_dump 版不一致・enable_rls 構造）を本番接続前に発見。
次セッションへの戒め:
- `migrate dev` は接続先を特定するまで絶対に叩かない（本番事故防止）。
- 本番 `migrate deploy` 前に Neon branch/接続先を画面確認（rodo 教訓）。
</reflection>
</content>
</invoke>
