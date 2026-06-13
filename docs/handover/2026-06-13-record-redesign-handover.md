# 2026-06-13 記録システム作り直し 引き継ぎノート

<reliability>
ctx 残量: 中程度。
- `<known-fact>` は Super 直接 Read（コード）＋ 本番DB読み取り専用 SELECT 実測 ＋ 宮川さん明示発言。
- `<unconfirmed>` は Fable 提案書の記述で Super 未検証のもの、または宮川さん発言とコードが食い違う箇所。
- Fable 提案書（`docs/redesign/record-system-proposal.md`）は Super が重大3点をコードで裏取り済みのため信頼度は高い。ただし全項目を検証したわけではない。`<finding type="other-bugs-unverified">` は次セッションで要再確認。
</reliability>

<context>
kigasuru（ゴルフ上達アプリ・本番運用中）の「ラウンド中の記録を簡単にする」抜本改修プロジェクト。
- Fable 5 に検証・設計させ、提案書 `docs/redesign/record-system-proposal.md` が完成。
- 宮川さんは「作り直しに進む（バグ修正込み）」「2タップ方式」を承認。
- 本セッションは方針合意まで。次セッションで 1段目（土台）の詳細設計に入る。
</context>

<user-confirmed-spec>
宮川さんが本セッションで明示確認した事項:
1. 記録システムを根本から作り直してよい（既存データは少なく、大胆な変更 OK）。
2. 新記録画面は「クラブ→着弾点の2タップ」方式で進める。
3. バグ修正（同期・距離・キャッシュ）を作り直しの土台として一体で行う。
4. トライアルは「**3ラウンド**」制限である（※宮川さん談。下記 `<unconfirmed>` 参照）。
5. 108件記録の1ユーザーが誰か（宮川さん本人か実ユーザーか）は後日確認。お知らせ配慮に使う。
</user-confirmed-spec>

<known-fact>
本番DB（Neon。`.env` と `.env.local` は同一接続先）読み取り専用 SELECT 実測（2026-06-13）:
- 総ショット **187件 / 11ユーザー** / 最古 2025-10-12・最新 2026-05-17（直近1ヶ月は記録ゼロ）。
- 重複レコード: **1グループ・余分3行・最大4重複**（同期バグの痕跡。被害は軽微）。
- 利用実態: 11人中 **8人が10件未満**、最大 **108件が1人**、100件超は1人のみ。「あまり使われていない」を定量裏付け。

Super がコードを直接 Read して確認したバグ（すべて事実）:
- `public/sw.js:349` `syncShots()` が空関数。Background Sync が発火しても何もしない。
- `app/api/shots/route.ts:41-46` distance 必須で 400。かつ `create` は重複排除なし（無条件 create）。
- `hooks/useGyro.ts:117-119` コメントで「ジャイロは傾斜ハイライトのみ・自動入力しない」と明記。
- `lib/sync.ts` 全件再送 → 成功分 `bulkDelete`。冪等性なし（重複量産の原因）。
</known-fact>

<finding type="proposal-summary">
Fable 提案書の核心（`docs/redesign/record-system-proposal.md`、特に §3-5）:
- 分析が実際に使うコアデータは **club / result(x,y) / distance / missType の4つだけ**。傾斜・ライ・風・強度・気温は手動フィルタ専用。
- 推奨案「ワンボード2タップ記録」: クラブ→着弾点で即保存（保存ボタン廃止・Undo 方式）。条件は例外時のみチップ付与。コース・気温はラウンド単位。距離はクラブ別実績から自動。平均 2.2タップ/打。
- 提案 Phase 0（止血）: 同期の冪等化（clientId）・編集 PUT 配線・位置/気温キャッシュ TTL・distance nullable 化。
- スキーマ案: `Round` モデル新設、`Shot` に roundId / clientId / holeNumber 追加、distance を nullable へ（すべて追加のみ・破壊的変更なし）。
</finding>

<unconfirmed priority="high">
トライアル制限の実装が不明確。**次セッション最優先確認事項**。
- 宮川さん談: 「3ラウンド」制限。
- Fable 提案書 §1.6/§6: コード（`app/api/trial/validate/route.ts:63, 89-97`）を読み「ユニーク日付3日分」と分析。
- 食い違いの可能性: ① Fable の誤読 ② 実装が運用意図とズレている ③ 用語差（1ラウンド≒1日付とみなす実装）。
- 対応: `app/api/trial/validate/route.ts` を Read し実装の実態を確定する。課金タイミングに直結。実装と意図がズレていれば、それ自体が修正対象。
</unconfirmed>

<finding type="other-bugs-unverified">
Fable 報告だが Super 未確認（次セッションで要確認）:
- `record/page.tsx:391-437` `lastLocationData` に TTL なし → 過去ラウンドのコース名・気温が今日の記録に付与される。
- `record/page.tsx:566` 「編集をサーバー反映」TODO。PUT API（`app/api/shots/[id]/route.ts:61-126`）は存在するが未配線。
- `lib/store/index.ts` `currentShot` が persist なし → PWA が kill されると入力途中が消える。
- `feeling` 完全な死にデータ（入力UI・分析 UI なし、常に null）。
- `schema.prisma:299` `inputLevel` デフォルト `"standard"` と クライアント `'advanced'` が不一致。
</finding>

<next-action>
次セッションの最初にやること:
1. このノートを Read。
2. `docs/redesign/record-system-proposal.md` を Read（提案書本体、特に §3-5）。
3. `app/api/trial/validate/route.ts` を Read し、トライアル制限の実装実態を確定（上記 `<unconfirmed priority="high">`）。
4. **1段目（土台）の詳細設計を計画CC（planner）に作らせるプロンプトを Super が設計する。**
   設計範囲: 同期の冪等化（clientId）／distance の nullable 化／位置・気温キャッシュ TTL／編集 PUT 配線／`Round` モデル新設／Dexie `version(6)` マイグレーション／本番187件（特に108件ユーザー）の保全・移行手順。
5. 設計の途中で宮川さんに 1問ずつ確認（例: 使われていない `strength`／`feeling` を消すか）。一度にまとめて聞かない。
6. 設計図完成後、Super がレビュー → 宮川さんに要点提示 → 実装CC へ。
</next-action>

<risk>
- 本番DB のスキーマ変更（migration）を伴う。データ少（187件）で低リスクだが、108件ユーザーのデータ保全は必須。事前バックアップ手順を設計に含めること。
- 1段目は見た目が変わらないため、宮川さんに進捗が見えにくい。要点提示で「何が良くなったか」を可視化する。
- 提案書のスキーマ変更を本番に適用する前に、必ず Super が diff をレビューし、CLAUDE.md「git push 前にビルド/リント確認」を遵守する。
</risk>

<reflection>
本セッションの反省（Super）:
- Super が Fable に渡した背景（「傾斜はジャイロで自動判別」「オフライン同期は実装済み」）が誤りだった。`package.json` の description と `record/page.tsx` 冒頭コメントを事実として扱ったミス。CLAUDE.md「コメント・命名規則からの推論は未確認扱い」に抵触しかけた。Fable がコード検証で訂正した（結果オーライだが危うかった）。
- 教訓: 背景情報を CC に渡す際、自分で未検証の伝聞は `[未確認]` と明示し、検証を指示する。
- 当初「本番が壊れ続けている・緊急」と煽ったが、実測では重複3件と軽微だった。実数確認前の煽りは禁物。被害規模は SELECT で測ってから語る。
</reflection>

<commit-status>
本セッションのコード変更: なし。
未コミットの新規ファイル:
- `docs/redesign/record-system-proposal.md`（Fable 作成）
- `docs/handover/2026-06-13-record-redesign-handover.md`（本ノート）
コミット要否は宮川さん判断。ドキュメントのみのため Super 代行コミット可能。
</commit-status>
