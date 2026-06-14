# 2026-06-14 段階2 完全終了（Phase F 済）＋段階3 着手プラン 引き継ぎノート

<reliability>
ctx 残量: 中。本ノートの `<known-fact>` は本セッションで Super 自身の Bash（git / find / Read）で実測、またはユーザーの Neon コンソール実機操作（スクショで Super が画面確認）で確定したもの。
段階3プランの `<task>` は設計書 `docs/plans/2026-06-13-tier1-foundation-design.md`（§5・§6・§10・§11）に基づく計画であり、実装は未着手＝`<unconfirmed>` 扱い。
直前ノート `2026-06-14-tier1-phase2-E-deploy-complete-handover.md`（Phase F・ノートコミットのみ残）の続き＝本ノートが最新・正。さらに古い `codeedit-handover.md` は冒頭に ⚠️警告ヘッダー付き（誤前提・参照禁止）。
</reliability>

<context>
kigasuru 記録システム改修。設計書 `docs/plans/2026-06-13-tier1-foundation-design.md`（§4 スキーマ差分・§5 同期新フロー・§6 API改修・§9 移行手順・§10 実装順序・§11 テスト観点）。
4段階構成: 段階1=TTL（済 74f8086）／段階2=DB構造＋Dexie v6（本セッションで Phase F まで完全終了）／段階3=API改修＋クライアント（未着手・本ノートでプラン提示）／段階4=重複清掃。
本セッションは「段階2の締め」: ①handover ノート3件コミット ②Phase F（dev-tier1 削除）③段階3 着手判断、の3点を完了。
</context>

<status>
- ✅ **段階2 完全終了**。DB構造＋Dexie v6 を本番デプロイ（85e554b）・動作確認①②③ OK・Phase F（検証ブランチ削除）まで完了。
- ✅ housekeeping: handover ノート3件をコミット（`8c89129`）＋ codeedit ノートに ⚠️警告ヘッダー付与。push 済。
- ✅ Phase F: dev-tier1（検証用ブランチ）削除。残ブランチは main（本番）＋ pre-tier1-20260614（backup）の2つ。
- ⬜ **段階3: 未着手。本ノート `<task>` が着手プラン（A=#3 サーバー先行 → B=#5/#6/#7 クライアント1リリース）。**
- ⬜ 段階4（重複清掃 §9-3）: 未着手。
</status>

## 確定事実

<known-fact>
[事実] housekeeping commit `8c89129`（`docs(handover): 段階2 D3b/E/本番デプロイ完了ノート追加＋codeedit誤前提に警告ヘッダー`）。docs のみ3ファイル333行。`85e554b..8c89129 main -> main` で push 済。コードは不変。
[事実] Phase F 完了: Neon コンソールで **dev-tier1 を削除**。削除前に Super が画面で2段確認 — ①ブランチ詳細で endpoint=`ep-steep-wind-a1ns9o44`／branch ID=`br-cold-paper-a1gpfe7v`／Parent=main／Created 2026-06-14 00:44:12 +09:00 を確認、②削除ダイアログが「permanently delete the branch dev-tier1」と明記（main/backup の文字なし）を確認 → Delete 実行。取り違えゼロ。
[事実] 削除後の残ブランチ: **main（本番・`ep-quiet-term-a1p9eu1n`・Default）＋ pre-tier1-20260614（backup・main の子）の2つ**。backup は段階3クライアント出荷までロールバック点として残す（早期削除禁止）。
[事実] 段階3 関連ファイル実在（find で確認）: `app/api/shots/route.ts`（POST/GET）・`app/api/shots/[id]/route.ts`（個別=PUT）・`lib/sync.ts`（同期）・`components/Layout.tsx`・`components/Providers.tsx`（pull/auto-sync）・`lib/db/index.ts`（Dexie v6 済）。設計書の参照ファイルは今も有効。
[事実] working tree クリーン（全コミット/push 済）。最新 main = `8c89129`。
</known-fact>

<user-confirmed-spec>
段階3 のペース判断: 本セッションは段階2の締めまでとし、**段階3は次セッションで新規に開始**（A=#3 サーバー改修から）。ユーザー「OK」で確定。
</user-confirmed-spec>

## 段階3 着手プラン（設計書 §10 起点・未着手）

<task name="A" priority="first">
**#3 API改修（サーバー側のみ・独立デプロイ可）** — 設計書 §6・§4・§10#3。対象 `app/api/shots/route.ts`。
- POST: clientId による **upsert 冪等化**（同一 clientId は1行に収束）。同時2リクエストの `P2002` を 500 にせず findUnique フォールバックで200（§11）。clientId 無し旧クライアントは create フォールバック（mixed 期間互換）。
- POST: **distance 必須バリデーション撤廃**（null 許容で保存・サイレント欠損解消）。
- GET: 新カラム（clientId/roundId/holeNumber）返却。分析側 distance=null ガード（§6.4）。
- 依存: #2（migration・済）。**サーバー先行でデプロイ**してから B を出す。
</task>

<task name="B" priority="after-A">
**#5/#6/#7 クライアント（まとめて1リリース＝mixed 期間最短化）** — 設計書 §5・§8・§10。
- #5 記録時 clientId 生成（§5.2）。対象は記録画面（`app/.../record/page.tsx` 系）。依存 #3,#4。
- #6 sync 置換（§5.3/5.5/5.6）push/pull 冪等化・bulkDelete 廃止・**壊れた Service Worker 依存の撤廃＝SW作り直し**。対象 `lib/sync.ts`。依存 #3,#4,#5。
- #7 編集 PUT 配線（§8）serverId 回収＋dirty。対象 `app/api/shots/[id]/route.ts`＋クライアント。依存 #3,#4。
</task>

<task name="order-rule">
鉄則（§5.7）: **A（サーバー先行）→ 本番デプロイ＋動作確認（§11 冪等性テスト）→ B（クライアント1リリース）**。逆順（新クライアント×旧サーバー）は clientId/null distance が弾かれて事故る。各 push 前に build/lint（CLAUDE.md）。
</task>

<risk>
1. **デプロイ順序事故**: §10「スキーマ→API→クライアント」厳守。A をサーバー先行デプロイし、新スキーマ＋clientId＋null distance を受けられる状態にしてから B を出す。
2. **backup 早期削除禁止**: `pre-tier1-20260614` は段階3クライアント出荷まで残す（可逆性の窓）。
3. **可逆性の窓**: B（新クライアント）が clientId/null distance を本番に書き始める前のみ完全ロールバック可（§9-4）。B リリース後はロールバック窓が閉じる。
</risk>

<followup type="record-only">
段階3着手時に棚卸し:
- **壊れた Service Worker**: 段階3 B の #6（sync 置換・SW作り直し §5.6）で**ちょうど直す対象**。段階3スコープに織り込む。
- **Dependabot 66件**（high 34 / moderate 28 / low 4）: 段階3とは別軸の依存脆弱性。**切り離して別途**対応（push 毎に GitHub 警告が出る）。放置不可の規模。
- **クラブカードのアイコン取り違え**: `record/page.tsx` 1006-1018、コメント「ゴルフクラブアイコン」だが実パスは地図アイコン。軽微な見た目バグ。
</followup>

<next-action>
次セッションが最初にやること:
1. `cd ~/Projects/kigasuru` → このノートを Read。設計書 §6（API改修）・§5（同期）・§10（順序）・§11（テスト観点）を確認。
2. `git status`（クリーンのはず・全コミット/push 済）。最新 main=`8c89129`。
3. **段階3 A（#3）の計画**: `app/api/shots/route.ts` の現 POST/GET を Read → 実装CC プロンプトを設計（POST=clientId upsert＋P2002 フォールバック＋distance null 許容、GET=新カラム）。これは中規模実装＝Plan 推奨。
4. 実装CC で A を実装 → build/lint(error0) → コミット → 本番デプロイ → §11 冪等性テスト（同一 clientId 2回 POST で1行・応答ロスト模擬で重複増えない・distance null で 400 にならない）で動作確認。
5. A 健全確認後、**B（#5/#6/#7 クライアント1リリース）の計画**。SW作り直しを #6 に織り込む。
</next-action>

<reflection>
- Phase F は段階的画面確認方式で実施: 一覧確認 → ブランチ詳細で endpoint(`ep-steep-wind-a1ns9o44`)突合 → 削除ダイアログのブランチ名(dev-tier1)確認、と不可逆操作の前に2段ゲートを通し、dev⇄prod・兄弟ブランチの取り違えゼロで完了。機密（接続文字列）は Super に送らせず endpoint ID のみで突合。
- housekeeping は docs のみ＝build/lint 不要を明示し、誤前提ノートは AGENTS.md 規律どおり削除せず ⚠️警告ヘッダーで残置。
- 段階3 はサーバー先行（#3）の鉄則を最上位に固定。次セッションが「順序事故」を起こさないよう `<task name="order-rule">` を独立タグで明示。
</reflection>
</content>
</invoke>
