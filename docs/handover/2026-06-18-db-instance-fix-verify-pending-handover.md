# 2026-06-18 引き継ぎ: DBインスタンス二重化バグ 修正完了・実機push検証ペンディング

<reliability>
ctx 残量: 中程度。`<known-fact>` は Super が直接 git diff / コマンド実行 / find で実証、または宮川さん実機報告に基づく。
`<unconfirmed>` `<risk>` は未検証。盲信せず次セッションで実機確認すること。
本ノートは実証ベースだが、**実機オフラインpush（2-2）だけは未実施**である点に注意。
</reliability>

<context>
一連の「オフライン同期・重複バグ」調査の到達点。根本原因 = **DBインスタンス二重化バグ**。
保存系（`getDB()`）と push系（固定 `db` export）が別の IndexedDB を参照していた。
- 保存先: `KigasuruDB_<userId>`（正）
- push の読み取り先: `KigasuruDB`（userIdなしの空フォールバック・誤）
- 結果: オフライン作成ショットがサーバーへ push されない。
研究CCレポート: `research/2026-06-18_db-instance-divergence.md`（untracked、未コミット）。
</context>

<status>
- ✅ 根本原因確定（研究CC + Super 直接 Read で実証）
- ✅ 修正実施（修正CC、案A＋B）
- ✅ tsc / lint / build 全PASS（修正CC報告 + Super 再実行で実証）
- ✅ コミット c4276ad（main 直）
- ✅ 実機検証 2-1: ログイン・ショット記録・履歴が普段どおり動作（リグレッションなし／宮川さん実機報告）
- ✅ **実機検証 2-2 PASS（2026-06-18 実機）**: オフライン記録→オンライン復帰で serverId 付与・未同期1→0 を実証（詳細は下記 `<verification>`）
- 🔜 push: build/lint green 済。本コミット（ノート・検証スクリプト・研究レポート同梱）を宮川さん OK 後に origin/main へ push（→ Vercel 本番反映）
</status>

<verification type="offline-push-2-2" result="PASS" date="2026-06-18">
## 実機検証 2-2（オフライン記録→オンライン復帰 push）PASS
読み取り専用コンソールスクリプト `docs/verify/2026-06-18-db-instance-offline-push-console.js`
（破壊操作ゼロを Super が grep + Read で実証）を 3 回貼り、同一ショット id=42 を追跡。
環境: localhost:3000（webpack dev。push 前なので修正コードは localhost のみで稼働）／Chrome／実アカウント。

| スナップショット | ユーザーDB総数 | 未同期 | id=42 の serverId | 素のKigasuruDB |
|---|---|---|---|---|
| ① 基準（オンライン） | 41 | 0 | （未作成） | 空0件 |
| ② オフライン記録直後 | 42 | 1 | null（未送信） | 空0件 |
| ③ オンライン復帰後 | 42 | 0 | cmqj7f5nz…（付与） | 空0件 |

- ②→③で同一 id=42（createdAtRaw=1781768660137 一致）が serverId を獲得＝push が正しく
  `KigasuruDB_<userId>` を読んで送信した決定的証拠。未同期 1→0。
- 素の `KigasuruDB` は終始 shots=0（バグ再発の兆候なし）。userId=cmgnocpa30000la04wdumcqy1。
- push 前チェック（Super 実行）: `npm run build` 成功 / `npm run lint` 0 errors・22 warnings
  （修正2ファイル `lib/sync.ts`・`lib/db/index.ts` の警告ゼロ。22件は無関係既存＋検証scriptの catch(_) のみ）。
</verification>

<known-fact>
## 修正内容（Super が `git diff` / `git show c4276ad` で確認）
- `lib/sync.ts`: 固定 `db.shots` → `getDB().shots`（12 / 78 / 183 行）。import を `db` → `getDB` に変更。
- `lib/db/index.ts`: `export const db = getDB()`（旧173行）/ `export default db`（旧685行）/ 陳腐化コメント172 を削除。
- 案C（`getDB()` の未初期化フォールバック生成の抑止）は**見送り＝別タスク**。`getDB()` / `initDB` / `KigasuruDB` クラスは無変更。
- 差分集計: 2 files changed, 4 insertions(+), 9 deletions(-)。固定 `db` の利用者は sync.ts のみだったため案Bは破壊なし（grep でゼロ消費者確認済み）。

## コミット
- `c4276ad` fix(db): DBインスタンス二重化バグを解消（push系をgetDB()に統一）
- main ブランチ直コミット（このプロジェクトは feat/fix も main 直運用）。

## ビルド検証（Super 再実行で実証）
- `npx tsc --noEmit`: exit 0（typecheck スクリプトは未定義のため直接実行）
- `npm run lint`（= eslint）: 0 errors / 19 warnings。警告は全て無関係の既存ファイル（2FA/WebAuthn/auth/refund 等）、**変更2ファイルの警告はゼロ**。
- `npm run build`: exit 0（63ページ生成成功）

## プロジェクト同定
- package.json name=`web`、実体は kigasuru（ゴルフショット記録、オフライン同期 PWA）。
- app/ に `render` も `quote` も**存在しない**（find で確認）。後述の `/render/quote/...` は別プロジェクト由来の古いURL。
</known-fact>

<finding type="env-trap">
## 次セッションがハマる環境トラップ（本セッションで実機検証中に3連続発生・いずれもDB修正と無関係）
1. **turbopack フォントバグ**: `npm run dev`（`next dev --turbopack`）だと `geist_mono` フォントが `fonts.gstatic.com` 取得失敗で **HTTP 500**（`⨯ Module not found: @vercel/turbopack-next/internal/font/google/font`）。
   → 回避: **turbopack を外す**（webpack dev）。`npm run build` は turbopack でも成功する（ビルド時フォント解決済み）。
2. **431 Request Header Fields Too Large**: ブラウザの蓄積Cookie + 別アプリの長大な署名付きURLでリクエストヘッダが肥大し dev サーバー（Node 既定16KB）が拒否。curl（Cookieなし）は 200 なのでサーバー自体は正常。
   → 回避: `NODE_OPTIONS=--max-http-header-size=65536`。恒久対処したいなら localhost の Cookie 削除。
3. **古いURL混入**: 宮川さんの Chrome タブに別プロジェクトのURL（`/render/quote/t45g-doc?org=t45g-org&exp=...&sig=...`）が残存し、それを叩いて signin にリダイレクトされていた。
   → 対処: アドレスバーに **`localhost:3000` をクリーン入力**（古いURLを置き換える）。

## dev 起動コマンド（確定・次セッションはこれを使う）
```
NODE_OPTIONS=--max-http-header-size=65536 npx next dev -p 3000
```
（このコマンドで `curl localhost:3000` → HTTP 200、フォントエラーなしを Super 確認済み）
</finding>

<next-action>
【2026-06-18 完了済み】2-2 PASS・build/lint green まで到達。残作業は push（origin/main）→ Vercel 本番反映のみ（宮川さん OK 待ち）。以下は当時の実行計画（履歴として残置）。

次セッションが最初にやること:
1. このノートを Read。
2. `git status` / `git log -1` で c4276ad と working tree（research/ + 本ノートが untracked）を確認。
3. dev サーバー生死確認: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`。
   200 以外なら上記 dev 起動コマンドで再起動（前セッションの background は終了している前提）。
4. **実機検証 2-2**（宮川さんに手順を1ステップずつ案内・一気に出さない）:
   1. `localhost:3000` をクリーン入力 → ログイン（古いURL `/render/quote` 注意）
   2. DevTools(F12) → Network → スロットリングを **Offline**
   3. ショットを1件記録
   4. Network → **No throttling**（オンライン復帰）
   5. 数秒待つ
   ＜合否基準＞
   - ✅ Network に `POST /api/shots` が飛んで 200／その記録に serverId が付与される
   - ✅ Application → IndexedDB に **空の `KigasuruDB` が無く `KigasuruDB_<userId>` のみ**
   - ✅ Console に `"Auto-sync push failed"` / `"DatabaseClosed"` が出ない
   - DevTools 操作が難しければ、コンソール貼付け確認スクリプトを用意（実装CC or 既存 `docs/verify/2026-06-15-stage3-idempotency-console.js` を参照）。
5. 検証OK → **push**。push 前に `npm run build` 確認（Super 共通ルール）。
   push = 本番反映の可能性あり（Vercel連携: DEPLOY.md / vercel.json）。**宮川さんの明示OK必須**。
6. `research/2026-06-18_db-instance-divergence.md` と本ノートのコミット要否を判断（一次資料・申し送りとして**コミット推奨**）。
</next-action>

<user-confirmed-spec>
- 宮川さん実機報告（2-1）: 修正後、ログイン・ショット記録・履歴が**普段どおり使える**＝リグレッションなし。
</user-confirmed-spec>

<risk>
- 実機オフラインpush（2-2）が未検証。修正はコードで決定論的に正しく build 全PASS だが、**実機での push 成功は未確認**。
- 案C残存: initDB 完了前に `getDB()` が呼ばれると空フォールバック `KigasuruDB` を生成し得る経路（研究レポート §3 項目4 ＝ [推測]）。別タスク。
- 431 / フォントは**回避策のみ**で恒久対処せず。いずれも dev 固有で本番には無関係。
</risk>

<commit-status>
- 未push: `c4276ad`（本修正）+ `44a9c32` + `000182b` + `26c7b0f`（docs handover 3件）= 計4件
- untracked: `research/2026-06-18_db-instance-divergence.md`、`docs/handover/2026-06-18-db-instance-fix-verify-pending-handover.md`（本ノート）
</commit-status>
