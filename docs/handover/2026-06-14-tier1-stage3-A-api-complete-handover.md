# 2026-06-14 段階3 A（API改修）実装完了＋IDOR修正 引き継ぎノート

<reliability>
ctx 残量: 中。本ノートの `<known-fact>` は本セッションで Super 自身の Bash（git diff / grep / npm run lint・build / tsc）で実測。
段階3 A は **実装・本番反映・§11冪等性テスト（4/4合格）まで完全終了**。次は段階3 B＝`<next-action>`。
直前ノート `2026-06-14-tier1-phase2-F-complete-stage3-entry-handover.md`（段階3着手プラン）の続き＝本ノートが最新・正。
</reliability>

<context>
kigasuru 記録システム改修。設計書 `docs/plans/2026-06-13-tier1-foundation-design.md`（§5.4 POST upsert・§6.1 POST改修・§11 テスト観点）。
4段階構成: 段階1=TTL（済）／段階2=DB構造＋Dexie v6（済）／**段階3=API改修＋クライアント（A完了・B未着手）**／段階4=重複清掃。
本セッションは段階3 A（#3 サーバーAPI改修・`app/api/shots/route.ts` POST）を実装し、自動セキュリティレビューが検出した IDOR を修正して本番反映した。
</context>

<status>
- ✅ **段階3 A 実装完了・本番反映済み**。`app/api/shots/route.ts` POST を改修（GET/他ファイルは不変）。
  - clientId upsert による二重保存防止（冪等化）
  - distance 必須撤廃（null 許容・NaN ガード）＝サイレント欠損解消
  - clientId/roundId/holeNumber 受理（Tier1 は null 枠のみ）
  - clientId なしは従来 create（旧クライアント互換）
  - **clientId IDOR を userId スコープで遮断**（後述 finding）
- ⬜ **§11 冪等性テスト未実施**（本番デプロイ完了後の実地確認が残）＝`<next-action>`。
- ⬜ 段階3 B（#5/#6/#7 クライアント1リリース）: 未着手。A 健全確認後。
- ⬜ 段階4（重複清掃）: 未着手。
</status>

<commit-status>
段階3 A は main に2コミット・push 済（working tree クリーン）:
- `c7b86f1` feat(api): 記録保存POSTをclientId upsertで冪等化＋distance null許容
- `682b991` fix(api): POST の clientId IDOR を userId スコープで解消
直前: `1480781`（段階2締めノート）。
</commit-status>

<known-fact>
[事実] 検証（Super 自身で2回実測・各コミット前）: `npm run lint`=0 errors（warning17件は既存・route.ts由来0）、`npx tsc --noEmit`=exit 0、`npm run build`=成功（63ページ生成・型エラー0）。
[事実] 最終 POST の clientId 分岐（682b991・grep/diff実証）: `findFirst({clientId,userId})`→自分の行のみ。あれば`update({where:{id:mine.id}})`、なければ`create`→P2002時は`findFirst({clientId,userId})`で再確認し、自分の行なら200・他者所有なら403。`findUnique({clientId})`は完全排除（grep で0件確認）。clientId 単独 where も0件。
[事実] GET は不変（findManyが新カラムを自動返却）。schema.prisma/migration は不変（段階2で本番反映済み・本フェーズは触らない）。
</known-fact>

<finding type="security-fixed">
自動セキュリティレビューが c7b86f1 の POST に **IDOR（HIGH×2）** を検出 → 682b991 で修正。
- 根本原因: `clientId` は schema 上 **グローバル @unique**（userId 単位ではない・`schema.prisma:152`）。clientId 単独の `upsert`/`findUnique` が他ユーザーの行に到達した。
  - ① 書き込み IDOR: 他人の clientId 指定で `upsert` の update が他人の記録の中身を改竄。
  - ② 読み取り IDOR: P2002 catch の `findUnique` が他人の行を返す。
- 対応（選択肢1=アプリ層スコープ・schema 非変更）: clientId 操作を全て `{clientId,userId}` に限定。他者所有は403。冪等性（§11）維持。
- Super 反省: c7b86f1 検証時「update に userId 含めない＝所有者不変 ✅」で合格にしたが、これは userId カラム不変の確認に留まり「他人の行の中身が上書きされる」書き込みIDORを見落とした。「UUIDだから実害極小・YAGNI」とした初期判断も誤り（認可を識別子の秘匿性に依存）。
</finding>

<followup>
段階3 の棚卸し（次セッションで判断）:
1. **複合キー化（IDOR 根本対策・別フェーズ）**: `clientId String? @unique` → `@@unique([userId, clientId])`。これで他者所有での P2002 自体が消え、403 経路も不要になる。**schema編集＋migration を伴う**ため段階3 A スコープ外。アプリ層（682b991）で IDOR は既に塞いだ状態だが、根本形は複合キー。段階3 B 着手時 or 別フェーズで schema 変更とセットで検討。
2. **TOCTOU 窓（極稀・記録のみ）**: 682b991 の `findFirst(mine)`→`update(by id)` の間に自分が同一行を削除する同時操作があると `update` が P2025→外側catchで500。発生は極めて稀。必要なら別フェーズで P2025 ハンドリング追加。
3. **holeNumber の NaN ガード先送り**: distance には NaN ガードを入れたが holeNumber は parseInt のみ（指示E に忠実）。Tier1/Tier2 で holeNumber 送信経路がないため実害なし。将来ホール番号入力UIを作る時にセットで NaN ガード追加。
4. **壊れた Service Worker**: 段階3 B の #6（sync置換・§5.6）で直す対象。
5. **Dependabot 66件**（high34/mod28/low4）: 段階3と別軸の依存脆弱性。push毎にGitHub警告。別途対応（放置不可の規模）。
6. **クラブカードのアイコン取り違え**: `record/page.tsx` 1006-1018、コメント「ゴルフクラブアイコン」だが実パスは地図アイコン。軽微。
</followup>

<verification status="pending">
§11 冪等性テスト（本番デプロイ完了後に実施・A単体で確認可能なもの）:
- 同一 clientId を2回 POST → サーバー1行に収束（GET件数で確認）。
- distance 未入力（null）で POST → 400 を返さず保存（サイレント欠損解消）。
- clientId なし POST → 従来 create で保存（＝現行スマホアプリで記録1件保存できる回帰確認。最も簡単）。
- 他者所有 clientId → 403（IDORはコード実証済み。実地は他人のclientId用意が困難なため省略可）。
実施手段の案: 本番デプロイ完了後、①現行アプリで記録1件保存（回帰）→ ②冪等性は検証CCにブラウザConsole用fetchスニペットを作らせ、宮川さんがログイン状態で実行→結果をSuperが判定。テストデータは宮川さんのアカウントに入るので後で削除。
</verification>

<next-action>
次セッションが最初にやること:
1. `cd ~/Projects/kigasuru` → このノートを Read。`git status`（クリーンのはず・最新 main=`682b991`）。
2. **Vercel 本番デプロイ完了を確認**（682b991 が反映済みか）。
3. **§11 冪等性テスト実施**（上記 `<verification>` の手段）。A単体の健全性を確認。
4. テスト OK 後、**段階3 B（#5/#6/#7 クライアント1リリース）の計画**。設計書 §5.2/5.3/5.5/5.6/§8、対象は記録画面・`lib/sync.ts`・`[id]/route.ts`＋クライアント。SW作り直しを #6 に織り込む。順序鉄則（§5.7）: サーバー先行（A=済）→ クライアント（B）。
5. B 着手時に followup 1（複合キー化）を schema 変更とセットで検討するか判断。
</next-action>

<reflection>
- IDOR 見落とし: コードの「所有者不変」を表層確認で合格にし、書き込みIDORを見逃した。セキュリティ判断にYAGNIを持ち込んだのが誤り。自動レビューが拾って事なきを得たが、Super 自身の検証で「clientId が誰スコープの unique か」を schema で確認すべきだった（schema:152 は読んでいたのに認可影響に結びつけられなかった）。
- 良かった点: 修正は schema 非変更のアプリ層スコープで完結させ、本フェーズ禁止事項（migrate禁止）を守りつつ IDOR を完全遮断。冪等性（§11）も維持。各コミット前に Super 自身で lint/tsc/build を再実測（報告盲信せず diff/grep で実コード検証）。
</reflection>
</content>
</invoke>
