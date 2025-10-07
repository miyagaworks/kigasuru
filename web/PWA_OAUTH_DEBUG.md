# PWA OAuth認証デバッグガイド

## エラー発生時の確認手順

### 1. デバッグモードでの情報収集

PWAでOAuth認証エラーが発生した場合、以下の手順でデバッグ情報を収集してください：

```
https://app.kigasuru.com/auth/signin?debug=true
```

ブラウザの開発者ツール（F12）のコンソールタブに詳細なデバッグ情報が表示されます。

### 2. チェックリスト

#### ✅ 環境変数の確認

Vercelダッシュボードで以下の環境変数が正しく設定されているか確認：

```bash
NEXTAUTH_URL=https://app.kigasuru.com
NEXT_PUBLIC_APP_URL=https://app.kigasuru.com
GOOGLE_CLIENT_ID=<正しいClient ID>
GOOGLE_CLIENT_SECRET=<正しいClient Secret>
LINE_CHANNEL_ID=<正しいChannel ID>
LINE_CHANNEL_SECRET=<正しいChannel Secret>
```

#### ✅ コールバックURLの確認

1. **Google Cloud Console**
   - API とサービス → 認証情報 → OAuth 2.0 クライアントID
   - 承認済みのリダイレクトURIに以下が含まれているか確認：
     - `https://app.kigasuru.com/api/auth/callback/google`

2. **LINE Developers Console**
   - LINE Login設定 → コールバックURL
   - 以下が含まれているか確認：
     - `https://app.kigasuru.com/api/auth/callback/line`

#### ✅ PWA設定の確認

1. **ポップアップブロッカーの無効化**
   - iOS: 設定 → Safari → ポップアップブロック → オフ
   - Android Chrome: 設定 → サイトの設定 → ポップアップとリダイレクト → 許可

2. **PWAの再インストール**
   ```
   1. ホーム画面からPWAアプリを削除
   2. ブラウザでhttps://app.kigasuru.comにアクセス
   3. ブラウザのキャッシュをクリア
   4. PWAを再度インストール
   ```

### 3. よくあるエラーと対処法

#### エラー: "redirect_uri_mismatch"

**原因**: OAuth プロバイダーに登録されているコールバックURLと実際のURLが一致しない

**対処法**:
1. エラーメッセージに表示されている実際のコールバックURLをコピー
2. Google/LINE Consoleに正確に同じURLを追加
3. 末尾のスラッシュの有無に注意

#### エラー: "認証エラー"（詳細なエラーなし）

**原因**: 環境変数の設定ミスまたはセッション関連の問題

**対処法**:
1. Vercelで再デプロイ（環境変数変更後は必須）
2. ブラウザのCookieを削除してリトライ
3. シークレット/プライベートモードで試す

#### エラー: ポップアップが開かない

**原因**: ブラウザ/PWAの設定でポップアップがブロックされている

**対処法**:
1. ブラウザのポップアップブロッカーを無効化
2. PWAではなくブラウザで一度ログインしてから、PWAでリトライ

### 4. 詳細なログの取得方法

開発者ツールのコンソールで以下のコマンドを実行：

```javascript
// 環境情報の取得
await debugOAuth.logDebugInfo()

// OAuth設定の検証
await debugOAuth.validateOAuthConfig()

// セッション状態の確認
await debugOAuth.checkSession()
```

### 5. エラー報告時に含める情報

問題が解決しない場合、以下の情報を含めて報告してください：

1. **エラーメッセージ**: 表示されているエラーの正確なテキスト
2. **デバイス情報**: iOS/Android、ブラウザのバージョン
3. **PWA/ブラウザ**: PWAモードかブラウザモードか
4. **デバッグログ**: コンソールのエラーとdebugOAuth.logDebugInfo()の出力
5. **再現手順**: エラーが発生するまでの具体的な手順

### 6. 一時的な回避策

PWAでOAuth認証が機能しない場合の一時的な回避策：

1. **ブラウザでログイン**
   - PWAをアンインストール
   - ブラウザでhttps://app.kigasuru.comにアクセス
   - ログイン後、PWAとして再インストール

2. **メールアドレス認証を使用**
   - OAuth認証の代わりにメールアドレス/パスワードでログイン

### 7. 開発者向けデバッグ

ローカル環境でのテスト：

```bash
# 環境変数をローカルに設定
cp .env.example .env.local
# .env.localに正しい値を設定

# 開発サーバーを起動
npm run dev

# ngrokなどでHTTPS環境を作成してPWAテスト
npx ngrok http 3000
```

---

## サポート

問題が解決しない場合は、上記の情報を含めて開発チームまでお問い合わせください。