# 2026-06-15 段階3 B（#5＋#6 クライアント同期）完成 引き継ぎノート

<reliability>
本ノートの `<known-fact>` は **すべて当セッションで Super 自身が実機検証**したもの:
git log / ls-remote（リモート直接照合）/ Read（実コード）/ gh api（Vercel デプロイ記録）/ 本番実行の §11 テスト出力 / 宮川さんの手動スモークテスト報告。
推測・伝聞は含めない。次セッションも「報告を信じず実機で再取得」を厳守すること。

⚠️ **前セッション（当セッションの前任）の引き継ぎは大部分が捏造だった**。実在しないコミット SHA（`1a7b3d9` `695e4af` `9c4e1f2`）や実在しないノート（`2026-06-15-...B-5-clientid-handover.md`）を「ある」と記述していた。git cat-file / reflog / stash / fsck で全否定済み。**過去ノートの断定も鵜呑みにしない。**
</reliability>

<context>
kigasuru 記録システム改修。設計書 `docs/plans/2026-06-13-tier1-foundation-design.md`。
4段階構成: 段階1 TTL（済）／段階2 DB構造＋Dexie v6（済）／段階3 API改修＋クライアント／段階4 重複清掃。
当セッションは「git整合の棚卸し」から開始し、段階3 B のクライアント同期（#5 記録時 clientId＋#6 push/pull/SW）を完成させ本番反映・実機確認した。
</context>

<status>
設計書 §10 実装順序の進捗:

| # | ステップ | 状態 |
|---|---|---|
| 0 | TTL | ✅ 済（過去） |
| 2 | Prisma migration | ✅ 済（段階2・本番反映済） |
| 3 | API改修（POST upsert＋distance撤廃／GET） | ✅ 済（段階3A・`682b991`） |
| 4 | Dexie v6（clientId/dirty/rounds） | ✅ 済（段階2） |
| 5 | 記録時 clientId 生成 | ✅ 済（`470028c`）＋ addShot 永続化修正（`a4f7c0d`） |
| 6 | sync 置換（push/pull/SW） | ✅ 済（`bf0ab2b`/`a4f7c0d`/`9b16fee`）本番反映・実機確認済 |
| 7 | 編集 PUT 配線（§8） | ⬜ **未着手** |
| 8 | 重複清掃（§9-3） | ⬜ **未着手**（承認制・本番DB DELETE） |
</status>

<known-fact>
[事実] origin/main 先端 = `9b16fee`（ls-remote で直接照合）。ローカルと完全同期（ahead/behind なし）。
[事実] 本番デプロイ = `9b16fee`（Vercel status=success「Deployment has completed」・2026-06-15 14:32Z・gh api 確認）。
[事実] 当セッションで積んだコミット（すべて push 済・origin/main 上）:
- `8869c65` docs(handover): 段階3A 正規ノート追補
- `470028c` feat(record): #5 記録保存の clientId を分岐前に一元生成し online/offline 全経路で共有
- `6cfba6c` test(verify): §11 冪等性 本番検証スニペット（docs/verify/・アプリ非依存）
- `bf0ab2b` feat(sync): #6a push 冪等化（serverId==null のみ送信・削除しない）
- `a4f7c0d` feat(sync): #6b pull clientId 優先照合 ＋ addShot の clientId 永続化漏れ修正
- `2902b72` fix(sync): getPendingShotsCount を未同期数（serverId==null）に修正
- `9b16fee` feat(sync): #6c SW Background Sync 依存撤廃・クライアント主導同期に一本化
[事実] 変更ファイル: app/record/page.tsx(#5) / lib/sync.ts(#6a,#6c,getPendingShots) / lib/db/index.ts(#6b,addShot) / public/sw.js(#6c) / docs配下。
[事実] schema.prisma / migration / API は当セッションで不変更（段階2・3Aで本番反映済）。
</known-fact>

<finding type="root-bug-fixed" severity="high">
**addShot が段階2以降 clientId を破棄していた**（`lib/db/index.ts` の addShot がフィールド明示列挙で構築する際、段階2で追加された clientId を列挙に入れ忘れ）。
- 影響: #5（`470028c`）で記録画面は clientId を生成・POST 本文に同梱していたが、**ローカル（IndexedDB）には保存されていなかった**。online 記録はサーバーに clientId が届く＋即 serverId 取得で実害なし。**offline 記録は clientId 不在 → 後の push で旧互換 create → 冪等性が効かない**状態だった。
- 修正: `a4f7c0d` で addShot に `clientId: shotData.clientId` を1行追加。record/pull/offline 全経路で永続化。
- なぜ §11 が見逃したか: §11 スニペットは clientId を API へ直接 POST しており addShot/IndexedDB を経由しないため、サーバー冪等性は実証できたがクライアント永続化は経路外だった。**コード精査で発覚**。
</finding>

<verification>
[§11 サーバー冪等性・本番自動テスト] runId `2d53f79c-…`・origin https://app.kigasuru.com・**ALL PASS**:
- TEST1 同一 clientId×2 POST → 両方 200・同一 shotId・GET 件数=1（重複ゼロ）。
- TEST2 distance=null POST → 200 保存・savedDistance=null。
- TEST3 clientId なし POST → 200 作成・clientId=null（旧互換）。
- CLEANUP 作成3行→削除3行→leftover 0（アカウント汚染なし）。
[ビルドゲート] #5push/#6a/#6b/#6c の各時点で lint=0 errors / tsc=0 / build=success を Super 自身が再実行。
[#6 実機スモークテスト] 宮川さんが手動実施: オフライン記録→オンライン復帰→同期・重複なし・ローカル保持を確認 → **OK**（手動観察ベース）。
</verification>

<user-confirmed-spec>
宮川さんが #6 のオフライン→オンライン同期を実機で手動確認し「OK」と明示（2026-06-15）。
</user-confirmed-spec>

<commit-status>
全コミット push 済。origin/main = `9b16fee`。working tree クリーン。未コミット・未push 残なし。
</commit-status>

<next-action>
次セッションが最初にやること:
1. このノートを Read。前任の報告は信じず以下を自分で実行:
   - `git -C ~/Projects/kigasuru log --oneline -8`
   - `git -C ~/Projects/kigasuru ls-remote origin -h refs/heads/main`（先端 `9b16fee` を実機照合）
   - `git -C ~/Projects/kigasuru status --porcelain`（クリーンのはず）
2. 残作業を宮川さんに提示し、どれから着手するか確認:
   - **#7 編集PUT配線（§8）**: 記録編集時に dirty=true → online で PUT /api/shots/[id] 反映。Dexie の dirty フィールドは v6 で存在。push の dirty 分（設計書 §5.3 後半 413-420）は #6a で未実装＝#7 で配線。対象: app/record/page.tsx（編集経路で dirty）・lib/sync.ts（dirty PUT）・[id]/route.ts PUT は既存。
   - **段階4 重複清掃（§9-3）**: 本番DBの重複を計測→必要時のみ DELETE。**承認制・本番DB操作・要注意**（Super 単独で実行しない）。
</next-action>

<risk>
未処理の followup（段階3Aノート §followup 由来・要判断）:
1. **複合キー化（IDOR 根本対策）**: `clientId String? @unique` → `@@unique([userId, clientId])`。schema＋migration を伴う。アプリ層（`682b991`）で IDOR は既に遮断済だが根本形は複合キー。
2. **Dependabot 66件**（high34/mod28/low4）。push 毎に GitHub 警告。段階3と別軸・放置不可の規模。別途対応。
3. holeNumber NaN ガード未対応（送信経路がないため実害なし）。
4. クラブカードのアイコン取り違え（record/page.tsx 1006-1018・軽微）。
</risk>

<reflection>
- 当セッションの起点は「前任の捏造引き継ぎ」。git cat-file/reflog/ls-remote で全否定し、実在する作業（未コミットの #5・未追跡のAノート）だけを復元コミットした。**実機照合の徹底が事故を防いだ**。
- addShot の clientId 破棄は §11（サーバー）テストでは捕まらず、実装CCのコード精査で発覚。**自動テストの経路と実アプリの経路の差**に注意。
- push は毎回それ単独で宮川さんの明示許可を取得。コミットと分離して運用した。
</reflection>
</content>
</invoke>
