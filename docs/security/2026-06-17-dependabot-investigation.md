# Dependabot 脆弱性 調査報告書（kigasuru / 読み取り専用診断）

- 作成日: 2026-06-17
- 調査者: 調査CC（researcher / 読み取り専用）
- 対象: miyagaworks/kigasuru（package.json name = `web` v0.1.0）
- 種別: 診断のみ。**コード・依存・package.json・package-lock.json は一切変更していない**

---

<context>
本報告は GitHub Dependabot の open alert 22件（高11 / 中10 / 低1、全て npm）に対し、
安全な修正計画を立てるための一次情報ベースの診断である。
本セッションで実行した読み取り専用コマンドは以下のみ:

- `gh api /repos/miyagaworks/kigasuru/dependabot/alerts?state=open --paginate`（22件取得）
- `npm audit --json`（書き換えなし。`npm audit fix` は未実行）
- `npm ls <pkg> --all`（依存元チェーン確認）
- `npm view <pkg> ...`（レジストリ照会のみ。インストールなし）
- `grep` / `ls` / `find`（next-auth 使用箇所の確認）

プロジェクト前提（package.json で確認）:
- Next.js 15 系（`next@^15.5.7`、実体 15.5.19）/ React 19 / TypeScript 5
- 認証は **next-auth v5 beta**（`next-auth@^5.0.0-beta.29`、実体 5.0.0-beta.29）
- ORM は Prisma 6（`prisma@^6.16.3` / `@prisma/client@^6.16.3`、実体 6.17.1）
- 決済は Stripe（`stripe@^19.1.0`、実体 19.1.0）
- `package.json` に `overrides` キーは存在しない（全文確認済み）
</context>

---

<finding>

## 1. Dependabot open alert 22件 一覧（一次情報）

`gh api` で取得した生データに `npm ls` の実インストール版・依存元を突き合わせた表。
「直/間」= 直接依存(D) / 間接依存(T)。「跨ぎ」= 修正版がメジャー跨ぎか。

| # | パッケージ | 直/間 | 実装版 | このalertの修正版 | メジャー跨ぎ | 重大度 | GHSA | CVE | 概要 | 依存元（起点） | scope |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | next-auth | **D** | 5.0.0-beta.29 | 5.0.0-beta.30 | 否（beta増分） | medium | GHSA-5jpx-9hw9-2fx4 | - | NextAuth.js Email 誤送信 | root（package.json:29） | runtime |
| 2 | tar | T | 7.5.1 | 7.5.2 | 否 | medium | GHSA-29xp-372q-xqph | CVE-2025-64118 | 競合による未初期化メモリ露出 | @tailwindcss/postcss→oxide | development |
| 10 | tar | T | 7.5.1 | 7.5.3 | 否 | high | GHSA-8qq5-rm4j-mr97 | CVE-2026-23745 | ファイル上書き/Symlink汚染 | 同上 | development |
| 11 | tar | T | 7.5.1 | 7.5.4 | 否 | high | GHSA-r6q2-hw4h-h46w | CVE-2026-23950 | Unicode合字競合(APFS) | 同上 | development |
| 13 | tar | T | 7.5.1 | 7.5.7 | 否 | high | GHSA-34x7-hfp2-rc4v | CVE-2026-24842 | Hardlinkパストラバーサル | 同上 | development |
| 18 | tar | T | 7.5.1 | 7.5.8 | 否 | high | GHSA-83g3-92jg-28cx | CVE-2026-26960 | Symlink連鎖でHardlink逸脱 | 同上 | development |
| 29 | tar | T | 7.5.1 | 7.5.10 | 否 | high | GHSA-qffp-2rhf-9h96 | CVE-2026-29786 | Drive相対Hardlink traversal | 同上 | development |
| 30 | tar | T | 7.5.1 | 7.5.11 | 否 | high | GHSA-9ppj-qmqm-q256 | CVE-2026-31802 | Drive相対Symlink traversal | 同上 | development |
| 88 | tar | T | 7.5.1 | 7.5.16 | 否 | medium | GHSA-vmf3-w455-68vh | CVE-2026-53655 | PAXサイズ上書きでファイル密輸 | 同上 | development |
| 9 | qs | T | 6.14.0 | 6.14.1 | 否 | medium | GHSA-6rw7-vpxm-498p | CVE-2025-15284 | arrayLimit回避(bracket)DoS | stripe@19.1.0 | runtime |
| 17 | qs | T | 6.14.0 | 6.14.2 | 否 | **low** | GHSA-w7fw-mjwx-w883 | CVE-2026-2391 | arrayLimit回避(comma)DoS | stripe@19.1.0 | runtime |
| 76 | qs | T | 6.14.0 | 6.15.2 | 否 | medium | GHSA-q8mj-m7cp-5q26 | CVE-2026-8723 | stringify TypeErrorクラッシュDoS | stripe@19.1.0 | runtime |
| 28 | minimatch | T | 3.1.2 | 3.1.3（audit:<3.1.4） | 否 | high | GHSA-7r86-cg39-jmmj | CVE-2026-27903 | ReDoS(ワイルドカード/GLOBSTAR) | @eslint/eslintrc 他 | development |
| 26 | minimatch | T | 9.0.5 | 9.0.7 | 否 | high | GHSA-7r86-cg39-jmmj | CVE-2026-27903 | 同上(9.x系) | @typescript-eslint/typescript-estree | development |
| 41 | picomatch | T | 2.3.1 | 2.3.2 | 否 | medium | GHSA-3v7f-55p6-f55p | CVE-2026-33672 | POSIXクラスMethod注入/ReDoS | micromatch(fast-glob) | development |
| 36 | picomatch | T | 4.0.3 | 4.0.4 | 否 | medium | GHSA-3v7f-55p6-f55p | CVE-2026-33672 | 同上(4.x系) | tinyglobby/fdir | development |
| 4 | js-yaml | T | 4.1.0 | 4.1.1 | 否 | medium | GHSA-mh29-5h37-fv8m | CVE-2025-64718 | merge(<<)でprototype汚染 | @eslint/eslintrc | development |
| 87 | js-yaml | T | 4.1.0 | 4.2.0 | 否 | medium | GHSA-h67p-54hq-rp68 | CVE-2026-53550 | mergeキー別名で二次DoS | @eslint/eslintrc | development |
| 33 | flatted | T | 3.3.3 | 3.4.2 | 否 | high | GHSA-rf6f-7fwh-wjgh | CVE-2026-33228 | parse()でprototype汚染/再帰DoS | eslint→file-entry-cache→flat-cache | development |
| 32 | effect | T | 3.16.12 | 3.20.0 | 否 | high | GHSA-38f7-945m-qr2g | CVE-2026-32887 | 並行RPCでALSコンテキスト喪失 | prisma→@prisma/config | runtime |
| 39 | defu | T | 6.1.4 | 6.1.5 | 否 | high | GHSA-737v-mqg7-c878 | CVE-2026-35209 | defaults引数の__proto__汚染 | prisma→@prisma/config→c12 | runtime |
| 58 | postcss | T | 8.5.6 / 8.4.31 | 8.5.10 | 否 | medium | GHSA-qx2v-qp2m-jg93 | CVE-2026-41305 | CSS stringifyの`</style>`未エスケープXSS | @tailwindcss/postcss と next の2系統 | runtime |

### パッケージ別サマリ（22 alert → 10パッケージ）

| パッケージ | alert件数 | 直/間 | 実装版 | 必要到達版（最上位） | メジャー跨ぎ | npm audit fixAvailable |
|---|---|---|---|---|---|---|
| next-auth | 1（#1） | **D** | 5.0.0-beta.29 | 5.0.0-beta.30 | 否 | `true`（非メジャー扱い） |
| tar | 8 | T | 7.5.1 | **7.5.16** | 否 | `true` |
| qs | 3 | T | 6.14.0 | **6.15.2** | 否 | `true` |
| minimatch | 2 | T | 3.1.2 と 9.0.5（2系統） | 3.1.4 / 9.0.7 | 否 | `true` |
| picomatch | 2 | T | 2.3.1 と 4.0.3（2系統） | 2.3.2 / 4.0.4 | 否 | `true` |
| js-yaml | 2 | T | 4.1.0 | **4.2.0** | 否 | `true` |
| flatted | 1 | T | 3.3.3 | 3.4.2 | 否 | `true` |
| effect | 1 | T | 3.16.12 | 3.20.0 | 否 | `true` |
| defu | 1 | T | 6.1.4 | 6.1.5 | 否 | `true` |
| postcss | 1 | T | 8.5.6 / 8.4.31（2系統） | 8.5.10 | 否 | **`false相当`**（`->next@null` メジャー＝自動修正不可） |

**重要事実**: 22件中、直接依存は next-auth のみ。残り9パッケージは全て間接（推移的）依存。
全パッケージで「修正版はメジャー据え置き（同一メジャー内）」であり、**メジャー跨ぎの破壊的更新を要する項目は22件中ゼロ**。

## 2. npm audit と Dependabot の突き合わせ

`npm audit --json` の集計: **total 15（high 8 / moderate 7 / low 0 / critical 0）**。
Dependabot 22件との差は以下で説明できる（件数の数え方の違いであり、矛盾ではない）。

- npm audit はパッケージ単位に集約 → tar 8件→1ノード、qs 3件→1ノード等に圧縮。
- npm audit は脆弱性をツリー上位へ伝播表示 → `next`(moderate)・`prisma`(high)・`@prisma/config`(high)・`next-auth`(via next) は
  実体としては postcss / effect の上位伝播であり、独立した新規脆弱性ではない。
- npm audit は Dependabot open 22件に**無い**実依存も2件検出（下記 §3）。

## 3. npm audit のみが検出（Dependabot open 22件に含まれない）— 参考・スコープ外

| パッケージ | 実装版 | 重大度 | 概要 | 依存元 | fixAvailable |
|---|---|---|---|---|---|
| ajv | 6.12.6 | moderate | `$data`使用時のReDoS（範囲<6.14.0） | @eslint/eslintrc, eslint（dev） | `true` |
| brace-expansion | 1.1.12 / 2.0.2 | moderate | zero-stepシーケンスでプロセスハング/メモリ枯渇 | minimatch経由（dev） | `true` |

いずれも eslint ツールチェーン由来の dev 依存。今回の22件スコープ外だが、`npm audit fix` 実行時に同時解消され得る。
**Dependabot 側でこの2件が open に出ていない理由は本セッションで未確認**（dismissed/未検出/別state の可能性）。

</finding>

---

<known-fact>
（本セッションで一次情報により確認できた事実）

1. Dependabot open alert は 22件、内訳 高11 / 中10 / 低1。全て npm。上表の各値（パッケージ/範囲/修正版/GHSA/CVE/severity/scope）は `gh api` の生データ由来。
2. 22件中の直接依存は **next-auth のみ**（package.json:29 `"next-auth": "^5.0.0-beta.29"`）。残り9パッケージは package.json の dependencies/devDependencies に存在せず、`npm ls` で推移的依存と確認。
3. 全22件で「修正版は同一メジャー内（メジャー据え置き）」。メジャー跨ぎ更新を要する項目は無い。
4. `npm audit --json` の `fixAvailable`:
   - postcss を除く全該当パッケージが `fixAvailable: true`（= `npm audit fix` で非メジャー解消可能とnpmが判定）。
   - postcss のみ `fixAvailable: { name: "next", version: null, isSemVerMajor: true }`（= `npm audit fix` では解消不可。`overrides` 等の手動対応が必要）。
5. next-auth は v5 系に既に到達済み（実体 5.0.0-beta.29）。**v4→v5 のメジャー移行は本件に存在しない。** 修正は beta.29→beta.30 の単一betaインクリメント。
6. next-auth の依存（`npm view`）: beta.29 → `@auth/core@0.40.0`、beta.30 → `@auth/core@0.41.0`、beta.31 も存在。beta.30 への更新は @auth/core を 0.40.0→0.41.0（マイナー）へ巻き込む。
7. 現状 @auth/core は 0.40.0（next-auth経由）と 0.41.0（@auth/prisma-adapter@2.11.0経由）が二重に存在（`npm ls @auth/core`）。beta.30 化で 0.41.0 に一本化される方向。
8. next-auth の組込み箇所（grep/Read で確認）:
   - `auth.ts:2` `import NextAuth from 'next-auth'`、`auth.ts:33` `export const { handlers, auth, signIn, signOut } = NextAuth({...})`
   - `auth.ts:45-80` セッション/CSRF/PKCE 等のCookie名をカスタム定義（`next-auth.session-token` 等）
   - `auth.config.ts:3-4` Credentials（bcrypt照合）＋ Google OAuth プロバイダ、`auth.config.ts:27` Credentials定義
   - `middleware.ts:5` `export default auth((req) => {...})`、`middleware.ts:103` matcher がほぼ全ルートを対象（静的アセット除く全パス）
   - useSession/signIn 等を約17ファイルで消費（dashboard/admin各種/account/subscription/history/settings 等）
9. `package.json` に `overrides` キーは存在しない（全文確認済み）。
10. tar/minimatch/picomatch/js-yaml/flatted の起点は dev（@tailwindcss/postcss のビルド系、eslint ツールチェーン）。effect/defu の起点は prisma CLI 設定パッケージ `@prisma/config`。
</known-fact>

<unconfirmed>
（推測・本セッションで未検証。実行前に各自確認が必要）

1. `npm audit fix`（非 --force）が **next-auth も同時に beta.30 へ巻き上げるか** は未実行のため未確認。`fixAvailable: true` かつ宣言レンジ `^5.0.0-beta.29`（= `>=5.0.0-beta.29 <5.0.0`）が beta.30/31 を許容するため「巻き込む可能性が高い」と**推測**。→ 実行後 `git diff package.json` で要確認。
2. next-auth beta.30 / @auth/core 0.41.0 が **本アプリのカスタムCookie設定・Credentials/Google・middleware 挙動を壊さないか** は未テスト。beta は増分間で破壊的変更があり得る（semver安定保証外）。
3. postcss を 8.5.10 へ `overrides` で強制した場合に **`next build` が通るか** は未検証（next 15.5.19 は postcss 8.4.31 を内部固定）。
4. ajv / brace-expansion が Dependabot open に出ていない理由（state）は未照会。
5. 各脆弱性の「実運用での悪用可能性」評価（dev/ビルド時 vs runtime）は依存チェーンからの**分析**であり、実証（PoC/監査）ではない。
6. `npm audit fix` の実挙動（どの直接依存をレンジ内で巻き上げるか）は dry-run も含め未実行（タスク制約により `npm audit fix` 系を一切実行していない）。
</unconfirmed>

---

## 4. Tier 分類

<tier-a>
### Tier A（安全・自動）— 8パッケージ / 20 alert

対象: tar(#2,10,11,13,18,29,30,88) / qs(#9,17,76) / minimatch(#26,28) / picomatch(#36,41) / js-yaml(#4,87) / flatted(#33) / effect(#32) / defu(#39)

根拠:
- 全て間接依存・同一メジャー内・`fixAvailable: true`。
- tar / minimatch / picomatch / js-yaml / flatted は dev（ビルド/lint時）依存で、本番リクエスト処理に乗らない。
- qs は stripe 内部のクエリ文字列処理、effect/defu は prisma **CLI設定**（@prisma/config：migrate/generate時）で、@prisma/client の実行時クエリ経路ではない。→ アプリ実行時への影響は限定的。

推奨コマンド（案・未実行）:
```bash
git switch -c fix/dependabot-2026-06
npm audit fix            # ← --force は付けない（メジャー跨ぎを誘発しない）
git diff package.json    # ★next-auth が巻き上がっていないか必ず確認（§unconfirmed-1）
npm run build && npm run lint
npx prisma generate      # effect/defu(prisma系)更新の影響確認
npm audit                # 残件確認
```

間接依存の代替（npm audit fix が一部を残した場合のみ・案）:
```jsonc
// package.json に overrides を追加する案（postcss は §Tier-B 参照）
"overrides": {
  "tar": "^7.5.16",
  "qs": "^6.15.2",
  "js-yaml": "^4.2.0",
  "flatted": "^3.4.2",
  "effect": "^3.20.0",
  "defu": "^6.1.5"
}
```
**注意（overrides の落とし穴）**: minimatch（3.1.2 と 9.0.5）・picomatch（2.3.1 と 4.0.3）は **2つのメジャー系統が同居**している。
`"minimatch": "^9.0.7"` のような単一指定は 3.x 利用側を 9.x へ強制し破壊し得る。これら2つは overrides を使わず
`npm audit fix` のデデュープに任せるのが安全。
</tier-a>

<tier-b>
### Tier B（手動・要検証）— 2パッケージ / 2 alert

#### B-1. next-auth #1（最優先で慎重対応）
- 内容: 5.0.0-beta.29 → 5.0.0-beta.30（+ @auth/core 0.40.0→0.41.0）。**v4→v5 移行ではない**。同一メジャー内のbeta増分。
- なぜ Tier A でなく B か: middleware がほぼ全ルートをラップ（middleware.ts:103）、Cookie名をカスタム定義（auth.ts:45-80）。
  @auth/core のマイナー更新でCookie/セッション復号/middleware挙動が変われば**全ユーザーがログイン不能になり得る**。自動掃き込み禁止。
- 推奨手順（案・未実行）:
```bash
# package.json:29 を "next-auth": "5.0.0-beta.30" に変更（範囲固定推奨）後
npm install
npm run build && npm run lint
# 必須の手動回帰テスト:
#  - Credentials ログイン（bcrypt）/ ログアウト / セッション維持
#  - Google OAuth ログイン
#  - middleware の保護ルート・admin判定・subscriptionStatus 分岐
#  - PWA コールバック（app/auth/pwa-callback）/ サインアップ
#  - WebAuthn/2FA（@simplewebauthn 利用箇所）への波及有無
```
- 単独コミットにして、問題時に即リバートできる状態にすること。

#### B-2. postcss #58
- 内容: 8.5.6 / 8.4.31 → 8.5.10（同一メジャー・マイナー）。`npm audit fix` では解消不可（`->next@null`）。`overrides` 必須。
- 実運用での露出は低い: postcss はビルド時に**自プロジェクトのCSS**（信頼済み）へ適用され、XSSは未エスケープな `</style>` を含む信頼できないCSSを stringify する経路が前提。本アプリのビルド構成では実害可能性は小さい（§unconfirmed-5）。
- 推奨手順（案・未実行）:
```jsonc
"overrides": { "postcss": "^8.5.10" }
```
```bash
npm install
npm run build      # next 15.5.19 が postcss 8.5.10 で通るか検証（§unconfirmed-3）
```
- 緊急度は低い。Tier A 完了後、または next 側が postcss 固定を上げる更新を待つ選択も可。
</tier-b>

<tier-c>
### Tier C（要注意・保留候補）— 22件中 0件

- 22件のうち、ログイン/認証/DB等の中核機能を破壊し得る**メジャー移行（破壊的更新）を要する項目は存在しない**。
- 当初最大の懸念だった **next-auth の v4→v5 移行は本件に該当しない**（既に v5 beta）。
- ただし next-auth（B-1）は「機械的には beta 増分だが、回帰テストで問題が出た場合は即 Tier C（保留）へ格上げ」という条件付き。テストを通過するまで本番反映しないこと。
- postcss を `overrides` 強制して `next build` が失敗する場合（§unconfirmed-3）は、その時点で postcss を保留（Tier C）に回し、next 側更新を待つ。
</tier-c>

---

<risk>
## 5. リスク評価（破壊的更新中心）

### next-auth（最大リスク）
- **影響範囲が広い**: middleware.ts:5 が matcher（middleware.ts:103）でほぼ全ルートに適用。auth.ts:33 が `handlers/auth/signIn/signOut` を一元供給。約17ファイルが session/signIn を消費。回帰が出れば全画面のログイン導線が同時に死ぬ。
- **カスタムCookie依存**: auth.ts:45-80 で session-token/callback-url/csrf-token/pkce/state のCookie名を独自定義。@auth/core 0.40→0.41 のCookie/暗号化/セッション扱いの変更があれば、既存ログインセッションの失効や新規ログイン不能を招き得る（未検証＝§unconfirmed-2）。
- **beta の不安定性**: beta 増分は semver の安定保証外。beta.29→beta.30 でもAPI/挙動変更があり得る。`npm audit fix` による無自覚な巻き上げ（§unconfirmed-1）を避け、単独・テスト付きで実施すべき。
- 緩和策: 単独コミット＋即リバート可能化、ステージングでの全ログイン導線テスト、既存セッションの失効可能性をリリースノートで周知。

### prisma 系（effect / defu）
- effect/defu は `@prisma/config`（prisma CLI のmigrate/generate時設定）配下で、@prisma/client の実行時クエリ経路とは別。リスクは相対的に低いが、`npx prisma generate` / `npm run build` の成否で確認する。

### postcss
- ビルド時・信頼済みCSS処理が主経路で実害可能性は低い。`overrides` 強制で `next build` 失敗のリスクのみ。失敗時は保留可。

### dev依存群（tar / minimatch / picomatch / js-yaml / flatted / ajv / brace-expansion）
- いずれもビルド/lint時のみ稼働し本番リクエストに乗らない。ReDoS/パストラバーサル等の悪用前提（悪意ある入力をビルド時に処理）が本アプリの運用と乖離。優先度は低いが `npm audit fix` で同一メジャー内に無害解消できるため、まとめて対応してよい。

### qs（stripe経由・runtime）
- runtime だが stripe 内部利用。6.14.0→6.15.2 は同一メジャーで、stripe@19.1.0 のレンジ内に収まる想定。DoS 系のため、決済導線の動作確認（Stripe Webhook/チェックアウト）で担保。
</risk>

---

<next-action>
## 6. 推奨着手順（安全な Tier A から）

1. **作業ブランチ作成**: `git switch -c fix/dependabot-2026-06`。
2. **Tier A 一括**: `npm audit fix`（**--force 禁止**）→ `git diff package.json` で
   **next-auth が巻き上がっていないか確認**（§unconfirmed-1）。巻き上がっていれば次の3に統合してテスト、不要なら一旦その差分を戻して3を独立実施。
   → `npm run build` / `npm run lint` / `npx prisma generate` / `npm audit` で緑を確認 → コミット。
3. **next-auth（B-1）を独立対応**: package.json:29 を `5.0.0-beta.30` に固定 → `npm install` →
   ビルド/リント＋**全ログイン導線の手動回帰テスト**（Credentials/Google/middleware保護/PWAコールバック/2FA波及）→ 単独コミット。
4. **postcss（B-2）**: `overrides: { "postcss": "^8.5.10" }` → `npm install` → `next build` 検証。
   失敗すれば保留（Tier C 扱い）し next 側更新を待つ。成功すればコミット。
5. **検証**: `npm audit` 再実行で残件確認。Dependabot 側の alert クローズを GitHub で確認。
6. **プッシュ前**: ビルド/リント成功を再確認（グローバル規約: push 前に必ずビルド/リント）。
7. **スコープ外メモ**: ajv / brace-expansion（npm audit のみ検出）は §3 のとおり。2 で同時解消され得るが、
   残れば dev 依存として別途 `overrides` 検討。Dependabot 側 state は要確認。

### 着手順の根拠
- Tier A（dev中心・同一メジャー・`fixAvailable: true`）は最も安全で、22件中20件を一括解消できる。
- 認証中核の next-auth は影響範囲が最大のため、**自動掃き込みから隔離して単独・テスト付き**で実施する。
- postcss は実害低・`overrides` 必須・ビルド失敗リスクのみのため最後に回し、失敗時は保留できる。
</next-action>

---

## 付録: 確認コマンドログ（本セッションで実行した読み取り専用のみ）

```
gh api /repos/miyagaworks/kigasuru/dependabot/alerts?state=open --paginate   # 22件
npm audit --json                                                             # total 15 (high8/mod7)
npm ls <pkg> --all   # tar/qs/minimatch/picomatch/js-yaml/flatted/effect/defu/postcss/next-auth/next/prisma/@prisma/config/@auth/core/ajv/brace-expansion
npm view next-auth versions / next-auth@5.0.0-beta.30 dependencies           # @auth/core 0.40→0.41
grep/ls/find        # auth.ts / auth.config.ts / middleware.ts と next-auth 消費箇所
```
**注**: `npm install` / `npm update` / `npm audit fix`（dry-run含む）は一切実行していない。
