# Dependabot 脆弱性アラート 棚卸し報告書

- 対象リポジトリ: `miyagaworks/kigasuru`（実機照合済 / `git remote`・`gh auth status` で確認）
- 調査日: 2026-06-16
- 調査種別: read-only（依存更新・lockfile変更・コード変更・git操作は一切なし。本ファイルのみ新規作成）
- 調査者: researcher CC

<context>
GitHub Dependabot が前セッションで 66 件（high34/moderate28/low4）の既知脆弱性を警告していた。本調査は前セッション値を信用せず、実機（gh API / npm audit / コード grep）から再取得して現状を確定し、深刻度・影響範囲・更新可否・対応順を整理する。修正は行わない（棚卸しのみ）。
事実（実機実測）と推測を区別するためXMLタグを併用する：
`<known-fact>`=実機で実測した事実 / `<finding>`=実測から導いた判断 / `<unconfirmed>`=推測 / `<risk>`=リスク / `<verification>`=検証手順 / `<next-action>`=推奨アクション。
</context>

---

## 1. 深刻度別サマリ（実機再取得値 × 前セッション差分）

<known-fact source="gh api repos/miyagaworks/kigasuru/dependabot/alerts?state=open">
Dependabot **open** アラート再取得値（2026-06-16 実測）:

| 深刻度 | 実機再取得値 | 前セッション値 | 差分 |
|---|---:|---:|---:|
| critical | 0 | 0 | ±0 |
| high | 34 | 34 | ±0 |
| moderate (GitHub表記: medium) | 28 | 28 | ±0 |
| low | 4 | 4 | ±0 |
| **合計** | **66** | **66** | **±0** |

→ 前セッション値（66件: high34/mod28/low4）と**完全一致**。この間の増減なし。
影響パッケージ数: **15**。No fix available（修正版なし）: **0 件**。
</known-fact>

<known-fact source="gh api ...dependabot/alerts (state無指定=全状態)">
Dependabot を**全状態**で取得すると open 66 + **auto_dismissed 10 = 76**。
auto_dismissed 10 件は**全て `development`（devDependency）スコープ**で、内訳は
minimatch×4(high) / picomatch×2(high) / brace-expansion×2(med) / flatted×1(high) / ajv×1(med)。
GitHub の自動トリアージ（開発依存の低到達性アラートを自動抑止）によるもの（`dismissed_reason` は API 上 null）。
</known-fact>

<finding>
前セッションが見た「66件 high34/mod28/low4」は open 限定の数値であり、本調査の再取得と一致。前セッション値は今回に限り結果として正確だったが、本報告の結論は全て実機再取得に基づく。
</finding>

---

## 2. npm audit との突合（両ソースの差）

<known-fact source="npm audit --json (read-only, fix未実行)">
`npm audit` サマリ: total **20** / critical 0 / high **13** / moderate **7** / low 0。
npm audit がカウントする「20」は**脆弱パッケージノード単位**（advisory をパッケージ単位に集約）。
Dependabot の「66」は **GHSA(advisory)単位**。同一パッケージに複数 GHSA があるため件数が膨らむ（例: axios=23 GHSA→Dependabot 23件 / npm audit 1ノード）。

npm audit が列挙した 20 ノードの内訳:
- Dependabot open と一致: axios, next, tar, qs, minimatch, picomatch, defu, effect, flatted, follow-redirects, js-yaml, jws, next-auth, postcss, ws（15）
- npm audit のみ（Dependabot open に無い）: **ajv, brace-expansion, form-data**（3）
- 親チェーン由来のノード（自身の advisory ではなく脆弱な子を持つため計上）: **@prisma/config, prisma**（2）
- 合計 15+3+2 = 20（npm audit total と一致）
</known-fact>

<finding>
**両ソースの差は3パターン**:
1. **集約単位の違い**（最大の差の原因）: Dependabot=GHSA単位 / npm audit=パッケージ単位。axios 23→1, next 20→1 等。件数差66 vs 20 はほぼこれで説明できる。
2. **Dependabot auto_dismissed → npm audit には出る**: `ajv`(GHSA-2g4f-4pwh-qvx6, med, range<6.14.0) と `brace-expansion`(GHSA-f886-m6hf-6m8v, med) は Dependabot では auto_dismissed 扱いだが npm audit は moderate として検出。いずれも dev 依存（eslint 配下）。
3. **Dependabot に一切無いが npm audit のみ検出**: `form-data`(GHSA-hmw2-7cc7-3qxx, **high**, CRLF injection, range>=4.0.0 <4.0.6, fix 4.0.6)。Dependabot は全状態でも 0 件。実機 `npm ls` では form-data@4.0.4 が axios 配下に存在し range に該当。**npm audit のみが拾う真の差分**。
</finding>

<unconfirmed>
form-data が Dependabot に存在しない理由は API からは判定不能。推測としては (a) Dependabot 未生成、(b) GitHub 側の到達性評価による抑止、のいずれか。実機 grep では form-data も axios 同様 `@sendgrid/mail` 経由（後述）で、SDK が未 import のため実行パス外と考えられる。
</unconfirmed>

---

## 3. 全 alert 一覧（パッケージ単位集約）

凡例: 種別=Dependabot scope（runtime=本番依存 / dev=開発依存）。直/推=直接依存/推移的依存。
実使用=app コードからの到達性判定。breaking=現行→修正版の semver 跨ぎ（全件メジャー跨ぎ無し＝**LOW**）。

| # | パッケージ | H/M/L | 種別 | 直/推 | 実使用判定 | 現行→修正(最高) | breaking | 対応方針 |
|---|---|---|---|---|---|---|---|---|
| 1 | **next** | 10/8/2 | runtime | **直接** | **実使用**（フレームワーク本体） | 15.5.7→15.5.18 | LOW(patch/範囲内) | 【更新】最優先 |
| 2 | **axios** | 12/10/1 | runtime | 推移 | **実行パス外**（@sendgrid/mail SDK 未import） | 1.12.2→1.16.0 | LOW(minor) | 【置換検討】親除去 |
| 3 | **tar** | 6/1/0 | dev | 推移 | ビルドのみ（@tailwindcss/oxide） | 7.5.1→7.5.11 | LOW(patch) | 【当面保留(dev/build)】 |
| 4 | **qs** | 0/2/1 | runtime | 推移 | 実使用（stripe SDK 内部） | 6.14.0→6.15.2 | LOW(minor) | 【overrides】/stripe更新 |
| 5 | **minimatch** | 2/0/0 | dev | 推移 | ビルド/lintのみ（eslint） | 3.1.2→3.1.3 / 9.0.5→9.0.7 | LOW(patch) | 【当面保留(dev)】 |
| 6 | **picomatch** | 0/2/0 | dev | 推移 | ビルド/lintのみ（eslint） | 2.3.1→2.3.2 / 4.0.3→4.0.4 | LOW(patch) | 【当面保留(dev)】 |
| 7 | **defu** | 1/0/0 | runtime | 推移 | CLI/build時（prisma config） | 6.1.4→6.1.5 | LOW(patch) | 【overrides】/prisma更新 |
| 8 | **effect** | 1/0/0 | runtime | 推移 | CLI/build時（prisma config） | 3.16.12→3.20.0 | LOW(minor) | 【overrides】/prisma更新 |
| 9 | **flatted** | 1/0/0 | dev | 推移 | lintのみ（eslint cache） | 3.3.3→3.4.2 | LOW(minor) | 【当面保留(dev)】 |
| 10 | **follow-redirects** | 0/1/0 | runtime | 推移 | 実行パス外（axios 子） | 1.15.11→1.16.0 | LOW(minor) | 【置換検討】親除去 |
| 11 | **js-yaml** | 0/1/0 | dev | 推移 | lintのみ（@eslint/eslintrc） | 4.1.0→4.1.1 | LOW(patch) | 【当面保留(dev)】 |
| 12 | **jws** | 1/0/0 | runtime | 推移 | **未使用**（jsonwebtoken が未import） | 3.2.2→3.2.3 | LOW(patch) | 【置換検討】親除去 |
| 13 | **next-auth** | 0/1/0 | runtime | **直接** | **実使用**（認証全体） | beta.29→beta.30 | LOW(beta) | 【更新】 |
| 14 | **postcss** | 0/1/0 | runtime | 推移 | build時（next/tailwind CSS処理） | 8.4.31/8.5.6→8.5.10 | LOW(patch) | 【overrides】/next更新 |
| 15 | **ws** | 0/1/0 | runtime | **直接** | **実使用**（Neon DB WebSocket） | 8.19.0→8.20.1 | LOW(minor) | 【更新】 |

<known-fact source="package.json / npm ls / grep">
- 直接依存（package.json `dependencies` 記載）で脆弱性を持つのは **next, next-auth, ws** の3つのみ。残り12パッケージは全て推移的依存。
- 全15パッケージの修正版は**現行と同一メジャー内**（major 跨ぎゼロ）。semver 上の breaking risk は一律 LOW。
- 直接依存3件のキャレット範囲は修正版を既に許容（`next`:^15.5.7⊇15.5.18 / `next-auth`:^5.0.0-beta.29⊇beta.30 / `ws`:^8.19.0⊇8.20.1）。→ package.json 編集不要、`npm update` での lockfile 更新のみで解消可能。
</known-fact>

---

## 4. 影響範囲の詳細（依存経路・実使用 / 実機実測）

<known-fact source="npm ls / grep -rn">
**直接依存（本番・実使用）**
- `next@15.5.7`: フレームワーク本体。実使用確定。10 high（middleware/proxy 認可バイパス CWE-288/863, SSRF CWE-918, Server Components DoS, HTTP request deserialization DoS）含む 20 件。
- `next-auth@5.0.0-beta.29`: `app/**` 多数で import（settings, auth, admin, subscription 等）。実使用確定。Email misdelivery（CWE-200, med）1件。
- `ws@8.19.0`: `lib/db/prisma.ts:10-11` で `import('ws').then(ws => neonConfig.webSocketConstructor = ws.default)`。Neon DB の WebSocket 接続に**本番実使用**。Uninitialized memory disclosure（CWE-908, med）1件。

**推移的依存・本番スコープ**
- `axios@1.12.2`（23件, high12）: 経路 `@sendgrid/mail@8.1.6 > @sendgrid/client > axios`。**ただし `@sendgrid/mail` SDK はリポジトリ全体で一度も import されていない**（`grep -rn '@sendgrid/mail' --exclude-dir=node_modules` 0件）。メール送信は `lib/email/index.ts:18` で `fetch('https://api.sendgrid.com/v3/mail/send')` による REST 直叩き。→ axios の脆弱コードは**実行パス外**。
- `follow-redirects@1.15.11`(med1) / `form-data@4.0.4`(npm audit high): いずれも axios 配下の子。上記同様**実行パス外**。
- `qs@6.14.0`（3件）: 経路 `stripe@19.1.0 > qs`。stripe SDK は `app/**`・API routes で多数実使用。qs は stripe の query 文字列処理で内部使用→**実使用（間接）**。
- `defu@6.1.4`(high1) / `effect@3.16.12`(high1): 経路 `prisma@6.17.1 > @prisma/config > c12/effect`。prisma CLI（generate/migrate）・config ロード時に使用。本番リクエストパスではなく **CLI/ビルド時中心**。
- `postcss`（next 経由 8.4.31 / @tailwindcss/postcss 経由 8.5.6, med1）: CSS のビルド時処理。ランタイム実行パス外（**build時のみ**）。

**推移的依存・dev スコープ（ビルド/lint ツールのみ）**
- `tar@7.5.1`(high6): `@tailwindcss/postcss > @tailwindcss/oxide > tar`。CSS エンジンの**ビルド時のみ**。path traversal 系（CWE-22）。
- `minimatch`(high2: 3.1.2 / 9.0.5) / `picomatch`(med2: 2.3.1 / 4.0.3) / `js-yaml@4.1.0`(med1) / `flatted@3.3.3`(high1): 全て eslint / eslint-config-next / @eslint/eslintrc 配下。**lint/ビルド時のみ**。
- `jws@3.2.2`(high1): 経路 `jsonwebtoken@9.0.2 > jws`。**`jsonwebtoken` はリポジトリ全体で参照ゼロ**（`grep -rn 'jsonwebtoken'` が package-lock/package.json 以外 0件）。→ jws の脆弱コードパスは**未到達（未使用依存）**。
</known-fact>

<finding>
実使用の観点で再分類すると、66件の名目に対し**本番リクエストパスで実際に到達し得る**のは next（20件）/ next-auth（1件）/ ws（1件）/ qs（3件・stripe 経由）＝**計25件**程度。残りは「実行パス外（axios系24件）」「build/CLI時のみ（tar・postcss・defu・effect・dev lint群）」「未使用依存（jws）」に収斂する。深刻度件数の大きさ（high34）の主因は axios 12high＋next 10high＋tar 6high だが、このうち axios・tar は実行パス外/ビルド時で実エクスプロイト可能性は相対的に低い。
</finding>

---

## 5. 推奨対応順（優先度順）

<next-action priority="1-最優先">
**next（20件, direct, runtime, 実使用, 範囲内patch）**
- `npm update next`（^15.5.7 範囲内で 15.5.18+ へ）。package.json 編集不要。
- 理由: 唯一「本番・直接・実使用・high多数（認可バイパス/SSRF/DoS）」が揃う。middleware/proxy バイパス（CWE-288）は認可境界に直結。最優先で潰す価値が最大。
- <verification>`npm update next` 後 `npm run build` と認証/middleware の動作確認。15.5 系内 patch のため breaking risk は低いが、Next の middleware 仕様変更履歴に留意。</verification>
</next-action>

<next-action priority="2-高(即効・低コスト)">
**ws（1件, direct, Neon DB 実使用）/ next-auth（1件, direct, 認証実使用）**
- 両者ともキャレット範囲内（ws→8.20.1, next-auth→beta.30）。`npm update ws next-auth` で lockfile 更新のみ。
- 理由: 直接依存・実使用・範囲内で最も安全に潰せる即効案件。next-auth は beta のため更新後の回帰確認は必須。
</next-action>

<next-action priority="3-中(親更新/overrides)">
**qs（3件, stripe 経由, 実使用）/ postcss（1件, build時）**
- qs: `stripe` の更新で qs が patch されるか確認。無ければ package.json `overrides` で qs を 6.15.2 へ固定。
- postcss: `next`/`@tailwindcss/postcss` 更新、または overrides で 8.5.10 へ。build時のため実害は低いが overrides 1行で解消可能。
- <risk>overrides は親が未検証のバージョンを強制するため、patch 跨ぎでも stripe/next の内部互換に注意。いずれも同一メジャー内のため低リスク。</risk>
</next-action>

<next-action priority="4-高レバレッジ(不要依存の除去で一括消滅)">
**axios系24件（axios23 + follow-redirects1, +npm audit form-data）/ jws1件 を「親の除去」で一掃**
- `@sendgrid/mail`（SDK 未使用、メールは fetch 実装）を package.json から除去 → axios/follow-redirects/form-data が依存ツリーから消滅（**Dependabot 約24件 + npm audit form-data が一括解消**）。
- `jsonwebtoken`（参照ゼロ）と `@types/jsonwebtoken` を除去 → jws が消滅。
- 理由: 更新でなく「未使用依存の削除」で最大件数(high12含む)を最小リスクで除去できる。本タスクは read-only のため未実施。別途実装タスクで対応推奨。
- <verification>除去後 `npm run build` と「メール送信（lib/email/index.ts 経由）」「JWT を使う箇所が無いこと」を確認。grep 上は両 SDK とも未使用だが、動的 require/環境分岐が無いか最終確認。</verification>
</next-action>

<next-action priority="5-後回し可(dev/build時のみ)">
**tar(6high) / minimatch(2high) / picomatch(2med) / flatted(1high) / js-yaml(1med) / defu(1high) / effect(1high)**
- 全て dev lint ツール or build/CLI 時のみ（eslint, @tailwindcss/oxide, prisma config）。本番リクエストパスに乗らない。
- 対応: `eslint`/`eslint-config-next`/`@tailwindcss/postcss`/`prisma` の更新で多くが追従。残存は overrides。
- 理由: 実エクスプロイト経路が「信頼済み入力を扱うビルド/lint」であり優先度は最後。ただし tar の path traversal（CWE-22）は CI 上の供給網リスクとして中期的に解消推奨。
</next-action>

---

## 6. No fix available（修正版なし）別枠

<known-fact>
**該当 0 件。** open 66 件すべてに first patched version が存在（`select(first_patched_version==null)` の集計が 0）。全件「更新 or overrides で修正版到達可能」。
</known-fact>

---

## 7. 所感

<finding>
- **大半は更新で片付く**。66件中、修正版が無いものは 0、メジャー跨ぎも 0。直接依存3件（next/next-auth/ws）はキャレット範囲内で `npm update` のみ、推移的依存も「親更新 or overrides（patch/minor 固定）」で解消でき、breaking risk は全体的に低い。
- **件数の見かけほど深刻ではない**。high34 の最大塊である axios(12high) と tar(6high) は、それぞれ「未 import の @sendgrid/mail SDK 経由＝実行パス外」「@tailwindcss/oxide のビルド時のみ」で、実リクエストパスでの悪用余地は限定的。実際に本番経路で到達するのは next（認可バイパス含む）中心。
- **最も効くのは更新でなく『未使用依存の除去』**。`@sendgrid/mail`（メールは fetch 実装で SDK 不使用）と `jsonwebtoken`（参照ゼロ）の2つを外すだけで、axios 23 + follow-redirects 1 + form-data + jws 1 ＝ 約26アラート相当が一括消滅する。最小リスク・最大件数の一手。
- **厄介な推移的依存は少数**。qs(stripe 経由) と defu/effect(prisma 経由) は親 SDK にピン留めされ、親が patch を出すまで overrides 頼みになる点が唯一の面倒。ただし全て同一メジャー内 patch/minor のため overrides リスクは小さい。
- **ソース差の注意点**: npm audit のみが拾う `form-data`(high) が存在する。Dependabot UI だけを見ると見落とす。ただし @sendgrid/mail 除去で同時に消える。
</finding>

<risk>
本報告は実行パス到達性を grep ベースで判定している。動的 import / 環境変数による分岐 / SSR 専用コード等で間接到達する可能性は完全には排除できない。除去・更新の実施時は必ず `npm run build` とライト/リント実行で回帰確認すること（CLAUDE.md: push 前ビルド/リント必須）。
</risk>

---

## 付録: 実機コマンド証跡（再現用 / 全て read-only）

<verification>
```
git -C . remote get-url origin              # → github.com/miyagaworks/kigasuru
gh auth status                              # → miyagaworks, scope: repo 他
gh api --paginate "repos/miyagaworks/kigasuru/dependabot/alerts?state=open&per_page=100"   # open 66
gh api --paginate "repos/miyagaworks/kigasuru/dependabot/alerts?per_page=100"              # 全状態 76 (open66+auto_dismissed10)
npm audit --json                            # total20 high13 mod7 (fixは未実行)
npm ls <pkg>                                # 依存経路
grep -rn '@sendgrid/mail' --exclude-dir=node_modules   # 0件 → SDK未使用
grep -rn 'jsonwebtoken' --exclude-dir=node_modules     # 0件 → 未使用
grep -rn "import('ws')" lib                 # lib/db/prisma.ts:10 → ws実使用
```
全コマンドは取得系のみ。`npm install/update/ci/audit fix`・package.json/lock 編集・git 操作は未実施。
</verification>
