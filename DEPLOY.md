# Vercelデプロイガイド

このドキュメントでは、上手くなる気がするぅぅぅアプリケーションをVercelにデプロイする手順を説明します。

## 前提条件

- Vercelアカウント
- Supabase PostgreSQLデータベース
- Google Cloud Console（Google OAuth用）
- LINE Developers（LINE Login用）
- Stripeアカウント
- Resendアカウント（メール送信用）

## 1. 環境変数の設定

Vercelプロジェクトの設定画面から以下の環境変数を設定してください。

### データベース

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### NextAuth

```
NEXTAUTH_SECRET=<openssl rand -base64 32で生成>
NEXTAUTH_URL=https://your-domain.vercel.app
```

### アプリケーション設定

```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**重要**: `NEXT_PUBLIC_APP_URL`は本番環境のURLに設定してください。これはOGP画像やPWAマニフェストで使用されます。

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. OAuth 2.0 クライアントIDを作成
3. **承認済みのリダイレクトURI**に以下を**すべて**追加:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://app.kigasuru.com/api/auth/callback/google`
   - `https://kigasuru.vercel.app/api/auth/callback/google`

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

**重要**: PWA環境でも動作させるため、すべてのドメインを登録してください。

### LINE Login

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. チャネルのLINE Loginタブを選択
3. **コールバックURL**に以下を**すべて**追加:
   - `http://localhost:3000/api/auth/callback/line`
   - `https://app.kigasuru.com/api/auth/callback/line`
   - `https://kigasuru.vercel.app/api/auth/callback/line`

```
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
```

**重要**: PWA環境でも動作させるため、すべてのドメインを登録してください。

詳細な設定手順は `OAUTH_SETUP.md` を参照してください。

### Stripe

1. Stripeダッシュボードで製品と価格を作成
2. Webhookエンドポイントを設定: `https://your-domain.vercel.app/api/stripe/webhook`
3. イベントを選択: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_xxx
STRIPE_PRICE_PERMANENT_PERSONAL=price_xxx
STRIPE_PRICE_PERMANENT_PREMIUM=price_xxx
```

### Resend

1. Resendアカウントを作成
2. APIキーを取得
3. ドメインを認証（オプション）

```
RESEND_API_KEY=re_xxx
```

### 管理者設定

```
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

## 2. デプロイ

### 初回デプロイ

1. GitHubリポジトリをVercelにインポート
2. フレームワークプリセット: `Next.js`
3. ビルドコマンド: `prisma generate && next build`
4. 環境変数を設定
5. デプロイを実行

### データベースマイグレーション

初回デプロイ後、Prismaスキーマをデータベースに反映:

```bash
# ローカル環境で実行
npx prisma db push
```

## 3. デプロイ後の確認

- [ ] アプリケーションが正常に起動するか
- [ ] Google Loginが動作するか
- [ ] LINE Loginが動作するか
- [ ] Stripe決済フローが動作するか
- [ ] Webhookが正常に受信されるか
- [ ] PWAとしてインストール可能か
- [ ] Service Workerが正常に動作するか
- [ ] OGP画像が表示されるか（[Open Graph Debugger](https://www.opengraph.xyz/)で確認）

## 4. トラブルシューティング

### ビルドエラー

- `prisma generate`が実行されているか確認
- 環境変数が正しく設定されているか確認

### データベース接続エラー

- `DATABASE_URL`と`DIRECT_URL`が正しいか確認
- Supabaseの接続プールが有効か確認

### Stripe Webhookエラー

- Webhook署名シークレットが正しいか確認
- エンドポイントURLが正しいか確認

## 5. カスタムドメインの設定

1. Vercelプロジェクト設定 > Domains
2. カスタムドメインを追加
3. DNS設定を更新
4. 環境変数`NEXTAUTH_URL`を更新
5. Google OAuth、LINE LoginのリダイレクトURIを更新

## 6. セキュリティ

- [ ] `NEXTAUTH_SECRET`は本番環境用に再生成
- [ ] Stripeは本番環境のキーを使用
- [ ] 管理者メールアドレスを正しく設定
- [ ] 環境変数は絶対にコミットしない
