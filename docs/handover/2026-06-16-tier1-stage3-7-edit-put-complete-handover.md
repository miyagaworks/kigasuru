# 2026-06-16 段階3 #7 編集 PUT 配線 完成 引き継ぎノート

<reliability>
本ノートの `<known-fact>` は **すべて当セッションで Super 自身が実機検証**したもの:
git log / ls-remote（リモート直接照合）/ git diff・Read（実コード）/ npx tsc・eslint・next build（Super 自身が再実行）/ gh api（Vercel デプロイ記録）/ 宮川さんの本番手動確認報告。
推測・伝聞は `<unconfirmed>` に分離。ctx 残量は十分な状態で記述。
次セッションも「報告を信じず実機で再取得」を厳守すること（前々セッションに捏造実績あり）。
</reliability>

<context>
kigasuru 記録システム改修。設計書 `docs/plans/2026-06-13-tier1-foundation-design.md`。
4段階構成: 段階1 TTL（済）／段階2 DB構造＋Dexie v6（済）／段階3 API改修＋クライアント／段階4 重複清掃。
当セッションは段階3 B（#5＋#6）完成後の続きとして、**#7 編集 PUT 配線**（記録の編集をサーバーへ反映）を
実装・本番反映・宮川さん手動確認まで完了した。実装は実装CC が担当、Super は差分・ビルドゲートを再検証した。
</context>

<status>
設計書 §10 実装順序の進捗:

| # | ステップ | 状態 |
|---|---|---|
| 0 | TTL | ✅ 済（過去） |
| 2 | Prisma migration | ✅ 済（段階2・本番反映済） |
| 3 | API改修（POST upsert＋distance撤廃／GET） | ✅ 済（段階3A・`682b991`） |
| 4 | Dexie v6（clientId/dirty/rounds） | ✅ 済（段階2） |
| 5 | 記録時 clientId 生成 | ✅ 済（`470028c`＋`a4f7c0d`） |
| 6 | sync 置換（push/pull/SW） | ✅ 済（`bf0ab2b`/`a4f7c0d`/`9b16fee`）本番反映・実機確認済 |
| 7 | 編集 PUT 配線（§8） | ✅ **済（`53f0953`）本番反映・宮川さん手動確認済** |
| 8 | 重複清掃（§9-3） | ⬜ 未着手（承認制・本番DB DELETE） |

→ **設計書 §10 の Tier1 実装ステップは #8（重複清掃）を残すのみ。** #8 は本番DB操作・承認制で別軸。
</status>

<known-fact>
[事実] origin/main 先端 = `53f0953`（ls-remote で直接照合）。ローカルと完全同期（ahead/behind なし）・working tree クリーン。
[事実] 本番デプロイ = `53f0953` / Production / **state=success**（gh api deployment id=5071989966・status 2026-06-15T22:44:32Z UTC ＝ 2026-06-16 07:44 JST）。
[事実] 当セッションで push した 2 コミット:
- `822125c` docs(handover): 前セッション（段階3B #5+#6）の引き継ぎノート。前セッション末に未push で残っていた分を当セッション冒頭で push。
- `53f0953` feat(sync): #7 編集 PUT 配線（本体）。
[事実] `53f0953` の変更ファイルと要点（git diff で確認）:
- `lib/db/index.ts`: `EditableShotInput` 型 ＋ `toEditableFields()` を新規 export（updateShot 直前）。編集可能17項目のみ返し、id/serverId/clientId/dirty/createdAt を除外。record/page.tsx と sync.ts が共有（定義の二重化なし）。
- `app/record/page.tsx`: `editServerId`/`editLocalId` state を追加。編集ロード(useEffect)で getShot() の shot から確保（currentShot からは取らない＝setCurrentShot が serverId を落とすため）。handleSave 編集分岐を §8.2 に置換: ①ローカル更新 `updateShot(localId, toEditableFields(currentShot))`、②online && editServerId なら PUT 即時・失敗時 dirty=true、③offline(serverId あり) は dirty=true、④serverId 無しは no-op（通常 push が create で拾う）。
- `lib/sync.ts`: `pushDirtyShots()` を新規 export（dirty===true && serverId を PUT→成功で dirty=false・失敗はログのみ）。`triggerPush` で `pushUnsyncedShots()` の後に呼ぶ（online復帰/前面化/起動の3トリガーで発火・isPushing で多重起動抑止）。create push の挙動は不変更。
- `app/api/shots/[id]/route.ts`: PUT の distance/latitude/longitude/actualTemperature に `body.x === null ? null : ...` の null ガード追加（後述 finding）。
[事実] スキーマ変更なし（prisma/schema.prisma・migration は不変更）。#7 はクライアント＋API のみ＝migrate 不要。
[事実] ビルドゲート（Super 自身が再実行）: `npx tsc --noEmit`=0 errors / `npx eslint .`=0 errors（既存 warning 19＝編集外ファイルの no-unused-vars）/ `npm run build`(next build --turbopack)=exit 0・静的63ページ生成。
</known-fact>

<finding type="root-bug-fixed" severity="high">
**PUT API の数値フィールドが null で NaN 破損する地雷を #7 で封鎖した。**
- 旧 PUT（`app/api/shots/[id]/route.ts`）は distance/latitude/longitude/actualTemperature を
  `body.x !== undefined ? parseInt/parseFloat(String(body.x)) : undefined` で処理しており、
  値が **null** のとき `parse("null") = NaN` になり、Prisma 更新で不正値が書き込まれる。
- これまで顕在化しなかった理由: PUT は #7 まで**アプリから一度も呼ばれていなかった**（record/page.tsx に TODO コメントのみ）。#7 で PUT が実発火するため、**距離なし（パット）・GPSなし（手動位置）の記録を編集した瞬間に破損**するパスが生まれる。
- 修正: 4項目すべて `body.x === null ? null : body.x !== undefined ? parse...(x) : undefined` に統一。
- 整合確認: prisma/schema.prisma の Shot は distance Int? / latitude Float? / longitude Float? / actualTemperature Float? ＝4項目すべて nullable。POST 側も同4項目を null フォールバックで保存しており整合。
</finding>

<user-confirmed-spec>
宮川さんが**本番（app.kigasuru.com）で編集→保存→記録を開き直して変更が残存することを手動確認し「OK」と明示**（2026-06-16）。
- 確認方法の切替経緯: 当初ローカル dev（localhost:3000）で確認しようとしたが、**Google ログインの戻り先が localhost 未許可**でローカルログイン不可。本番 OAuth 設定変更はスコープ外・リスクありのため触らず、**#6 と同じ「本番反映後に手動確認」方式**に切替えた。
</user-confirmed-spec>

<verification>
[静的] tsc=0 / lint=0 errors / build=success（Super 再実行・上記 known-fact）。
[差分レビュー] Super が4ファイルの git diff を全て Read し、設計書 §8.1/§8.2/§5.3/§8.3 準拠・スコープ厳守（4ファイルのみ・schema/migration/Round/新規ファイルなし）を確認。
[本番デプロイ] 53f0953 Production success（gh api 照合）。
[手動] 宮川さんが本番でオンライン編集→保存→再表示の残存を確認「OK」。
</verification>

<unconfirmed>
1. **ケースB（オフライン編集→dirty→オンライン復帰で自動 PUT→dirty=false）は実機未確認**。DevTools のオフライン切替が要るため当セッションでは省略。コードレビュー＋ビルドで検証済みだが、**次セッションで実機スモーク推奨**（§11 編集PUT のケースB）。
2. **クロス端末でのサーバー反映確認は任意で未実施**。基本テスト（同一端末で編集→再表示）は IndexedDB 由来でも残るため、サーバー反映そのものの直接確認は別端末ログインが必要。コード＋本番デプロイ成功で担保。
3. ケースC（未同期 serverId 無しショットの編集→PUT 走らず通常 push で create）も実機未確認。設計通りの no-op 経路で実害は薄い。
</unconfirmed>

<commit-status>
`53f0953` push 済・本番反映済。origin/main = `53f0953`。working tree クリーン。未コミット・未push 残なし。
</commit-status>

<next-action>
次セッションが最初にやること:
1. このノートを Read。報告を信じず以下を自分で実行:
   - `git -C ~/Projects/kigasuru log --oneline -5`
   - `git -C ~/Projects/kigasuru ls-remote origin -h refs/heads/main`（先端 `53f0953` を実機照合）
   - `git -C ~/Projects/kigasuru status --porcelain`（クリーンのはず）
2. 残作業を宮川さんに提示し、どれから着手するか確認（下記 risk 参照）:
   - **#7 ケースB の実機スモーク**（オフライン編集→復帰同期）を先に閉じるか。
   - **段階4 重複清掃（§9-3）**: 本番DBの重複を計測→必要時のみ DELETE。**承認制・本番DB操作・Super 単独実行禁止**。
   - **Dependabot 66件**（high34）の対応に着手するか。
</next-action>

<risk>
未処理の followup（要判断）:
1. **段階4 重複清掃（§9-3・設計書 §10 step8）**: 本番DB の重複を measure→必要時のみ削除。Neon ブランチ＋トランザクション＋件数照合で防御。承認制。Tier1 最後の実装ステップ。clientId 導入で新規重複は止まっているため「Tier2 送り」の選択肢もある（設計書 §13-2）。
2. **複合キー化（IDOR 根本対策）**: `clientId String? @unique` → `@@unique([userId, clientId])`。schema＋migration を伴う。アプリ層（`682b991`）で IDOR は既に遮断済だが根本形は複合キー。
3. **Dependabot 66件**（high34/mod28/low4）。push 毎に GitHub 警告。段階3と別軸・放置不可の規模。別途対応。
4. **#7 ケースB 実機未確認**（上記 unconfirmed-1）。次セッションで閉じるのが望ましい。
5. holeNumber NaN ガード未対応（送信経路がないため実害なし）。
6. クラブカードのアイコン取り違え（record/page.tsx 1006-1018 付近・軽微）。
</risk>

<reflection>
- ローカル dev での動作確認が **Google OAuth の localhost 未対応**で頓挫。OAuth 設定変更（本番影響あり）に手を出さず、#6 実績のある「本番反映後の手動確認」へ即切替えた。環境問題と実装問題を切り分け、空振りを最小化できた。
- push は方針合意とは別に**それ単独で宮川さんの明示許可を取得**（コミットと分離運用）。822125c（前ノート）と 53f0953（#7）の2回とも単独許可で実施。
- 実装CC の完了報告を鵜呑みにせず、git diff 全読み＋ビルドゲート再実行で裏取りした。報告は正確だったが、検証手順自体を省略しなかった。
- PUT の null→NaN 破損は #7 で PUT が初めて実発火することで顕在化する地雷だった。プロンプト設計時に「PUT が実際に動き出す＝null 数値が初めて PUT を通る」と先読みして必須修正に組み込めたのが奏功。
</reflection>
</content>
