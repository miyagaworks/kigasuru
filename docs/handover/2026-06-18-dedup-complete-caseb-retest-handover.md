# 2026-06-18 ローカル shot 重複バグ 修正・本番反映・掃除・検証 完了 / 次=⑤ケースB再テスト 引き継ぎノート

<reliability>
本ノートの `<known-fact>` は当セッションで以下により実測したもののみ:
- Super 自身の Read / git / `wc -l` / `npm run lint`・`npm run build` 再実行
- ユーザー実機（本番 https://app.kigasuru.com ・アカウント `cmgnocpa30000la04wdumcqy1`）の DevTools コンソール出力を Super が照合
  （dryRun レポート・execute レポート・再 dryRun・`GET /api/shots` のフィルタ結果）
`<unconfirmed>` は未検証。**⑤ ケースB再テストと autoCollect 復帰修正は本セッションで live 未検証**。
次セッションも「報告・ノートを信じず、実機・実コードで再確認」を厳守。
</reliability>

<context>
kigasuru（ゴルフのショット記録）。Next.js 15.5.19 / Vercel トランクベース（main push = 本番自動デプロイ）。
前ノート `2026-06-18-local-shot-dedup-handover.md` の続き。「記録のローカル重複（端末 IndexedDB）」コア機能バグの後半工程。
本セッションで Phase1（同期照合修正＋autoCollect復帰）と Phase2（掃除ツール）を検証 → コミット → 本番反映 → 掃除実行 → 結果検証まで完了した。
</context>

<status>
- ✅ 完了: 重複の再発生停止（同期 serverId 照合）／既存重複の掃除（端末 115→40・消失ゼロ）／取り残し編集の回収（距離155＋メモ「ショット」がサーバー到達）。本番デプロイ済。
- ⬜ 残（次セッションの主タスク）: **⑤ ケースB再テスト**（新規オフライン編集→オンライン復帰で距離＆メモ両方がサーバー到達＋autoCollect エラーが復帰で消える、を live 確認）。
- ⬜ 任意残: `__dedupeShots` の公開範囲を管理者限定 or 撤去（現状は全ログインユーザーのコンソールに露出・IDOR無）。
- 未コミット: **本ノートのみ**（コードは全て commit & push 済）。
</status>

<known-fact>
**コード変更（全て commit & push & 本番デプロイ済）**
- `3c237e9` fix(sync): `syncShotsFromServer` を serverId 最優先照合（→clientId→createdAt）に変更。serverId 一致行に必ず収束し `addShot` で新規追加しない。収束時は不足キーのみ patch 補完・17データ項目は非上書き。`lib/db/index.ts`（+23/-13）。
- `700cde4` fix(record): `app/record/page.tsx` に online 復帰リスナ＋ref。`!editId` かつ error 時のみ `autoCollect` 再実行。
- `a117526` feat(db): `lib/db/dedup.ts`（**639行**・`wc -l` 実測。CC 報告の「663行」は誤差）＋ `components/Layout.tsx`(+4) で `__dedupeShots` をコンソール公開。
- `f11382b` docs: 調査報告書（⚠️主因訂正ヘッダー追記）＋前ノート。
- push: `9568eec..f11382b` → `origin/main`。本番デプロイ `dpl_4R5XRapFLPHtU8NtCqj8f6rGDBmc` 稼働確認。
- push 直前に Super 再実行: lint **0 errors / 19 warnings**（変更4ファイルは無警告）・build **EXIT 0 / 63ページ**。

**掃除（本番・ユーザー実機 DevTools・Super 照合）**
- 実行前 dryRun: 総115 / 未同期(serverId=null)=0 / 40グループ全て重複 / 削除予定75 / memo競合0 / フィールド競合1（#1 distance 155 vs 150）/ 全 server存在。
- execute（`{dryRun:false,confirm:true}`）: 40/40グループ畳み・75行削除・スキップ(404)0・スキップ(失敗)0・「✅ すべて安全に掃除しました」。
- 実行後 再 dryRun: 総**40** / 重複グループ**0** /「✅ 重複は見つかりませんでした」。
- サーバー照合: `GET /api/shots` で memo に「ショット」を含む行は1件のみ＝`{distance:155, memo:"ショット"}`。＝ケースBで取り残していたメモの回収完了。
- 結論: 端末 115→40（**消失ゼロ**）。サーバーへの実書換は #1 の距離155＋メモのみ、他39件は同値PUT＋ローカル削除のみ。

**データ消失ゼロの実コード根拠（Super が `dedup.ts` 全639行 Read）**
- serverId==null は不触（grouping/削除せずカウントのみ）。PUT 200 確認後のみ `updateShot`→`deleteShot`。memo は `collectMemos` で全兄弟の非空を連結救出。dryRun/confirm 2モード。既定DB(`KigasuruDB`)拒否・execute はオンライン必須・冪等（再実行で続行）。
</known-fact>

<verification>
[Phase1静的] lint 0 errors / build success(63) を Super 再実行で確認。git diff 全行 Read で「17項目非上書き」を確認。
[掃除] dryRun → execute → 再dryRun → サーバー照合 の4点をユーザー実機出力で Super 照合（上記 known-fact）。
[同期修正の実機効果] 本番読込ログ「Synced 0 new shots」＝再 pull で重複が増えないことを確認（止血の実効）。
[未検証] ⑤ ケースB再テスト（新規オフライン編集の往復）と autoCollect 復帰のエラー解消は live 未確認。
</verification>

<risk>
1. `__dedupeShots` が本番で**全ログインユーザーのコンソールに露出**。API は owner 確認済（`[id]/route.ts` L34/L85・IDOR無＝自分のデータのみ操作可）だが foot-gun。**管理者限定**（Layout に `isAdmin` import 済）or **撤去**を推奨。`NODE_ENV!=='production'` ガードは不可（本番清掃に使うため）。
2. dedup の「空項目はPUTで送らない」という報告主張は**機構が不正確**: `dedup.ts` は17項目を全送信（L288 で全格納・L564 で全PUT）。空保持は PUT 側 Prisma が `undefined` を無視するのに依存し、`""`/`null` は上書きし得る。**今回データは「→空」ゼロで無害**だったが、別データで再実行する場合は dryRun の rescued/競合に「→空」が無いことを必ず確認＋サーバー JSON バックアップ。
3. push = 本番自動デプロイ。次の push も**ユーザー明示 OK 必須**。掃除の再実行が要る場面は dryRun→承認→execute を厳守。
</risk>

<user-confirmed-spec>
ケースB = オフライン編集 → オンライン復帰で自動同期。成功条件: **距離変更もメモ追記も両方サーバーへ届く**こと。
本セッションで取り残しメモは掃除で回収済だが、それは「過去分の救出」。⑤ は「**今後の新規オフライン編集**が往復で正しく届くか」の再現テスト（掃除でローカル重複が消えたので、編集の宛先が混乱しないはず）。
</user-confirmed-spec>

<next-action>
次セッションが最初にやること:
1. このノートを Read。報告・ノートを信じず実機照合: `git -C ~/Projects/kigasuru status` / `log --oneline -6`（コードは push 済・先端は本ノートの docs コミットのはず）。
2. **⑤ ケースB再テストをユーザーに1ステップずつ案内**し、結果を Super が実データで裏取り:
   - 履歴から1記録を編集で開く → DevTools Network を **Offline** → 距離変更＋メモ追記（例: 「再テスト0618」）して保存 → Network を **Online** に戻す → 数秒待つ
   - サーバー照合（読み取り）: `(await (await fetch('/api/shots')).json()).shots.filter(s=>s.memo?.includes('再テスト0618')).map(s=>({distance:s.distance,memo:s.memo}))`
   - 期待: 変更した距離＆メモが**両方**サーバーに出る。＋再 dryRun で総数が40のまま（重複が再生成されない）。
   - autoCollect 復帰: **新規記録ページ**をオフラインで開く →「自動取得に失敗しました」表示 → オンライン復帰で**エラーが消える**ことを確認。
3. ⑤ 合格後: `__dedupeShots` 公開範囲の後始末を Super が**修正CC用プロンプト**で設計（isAdmin 限定 or 撤去）→ commit → ユーザー OK で push。
4. 完了ノート更新。
</next-action>

<reflection>
- 実機 console 出力（dryRun/execute/再dryRun/サーバー照合）で「掃除成功・消失ゼロ・編集回収」を主張でなく**実データで確定**できた。
- CC 報告の「空項目は送らない」を実コードと突き合わせ、機構が不正確（Prisma `undefined` 依存）と判明。今回データでは無害（→空ゼロ）と dryRun で確認してから execute した。
- データ操作の前にサーバー JSON バックアップを取り、取り返せる状態を担保してから実行した。
- Phase1 の同期修正が本番で「0 new shots」を出し、止血の実効を実機確認できた。
</reflection>
</content>
