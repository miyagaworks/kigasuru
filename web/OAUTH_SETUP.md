# OAuth認証設定ガイド

PWA環境でGoogle OAuth認証を動作させるために、以下の設定が必要です。

## 1. Google OAuth設定

### Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. **APIとサービス** → **認証情報** に移動
4. **OAuth 2.0 クライアントID** を選択
5. **承認済みのリダイレクトURI** に以下を**すべて**追加：

```
http://localhost:3000/api/auth/callback/google
https://app.kigasuru.com/api/auth/callback/google
https://kigasuru.vercel.app/api/auth/callback/google
```

### 重要な注意点

- **すべてのドメイン**（localhost、本番、Vercel）を追加してください
- PWAでもブラウザでも同じコールバックURLを使用します
- HTTPSが必須（localhostを除く）

### Vercel環境変数

```bash
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<YOUR_GOOGLE_CLIENT_SECRET>
```

---

## 2. Vercel環境変数の設定

Vercelダッシュボード → プロジェクト → **Settings** → **Environment Variables**

### 必須の環境変数

```bash
# NextAuth
NEXTAUTH_URL=https://app.kigasuru.com
AUTH_SECRET=<YOUR_AUTH_SECRET>

# App URL
NEXT_PUBLIC_APP_URL=https://app.kigasuru.com

# Google OAuth
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<YOUR_GOOGLE_CLIENT_SECRET>


# Database
DATABASE_URL=<YOUR_DATABASE_URL>
DIRECT_URL=<YOUR_DIRECT_DATABASE_URL>
```

---

## 3. PWA OAuth認証フロー

### PWAモード（スタンドアロン）

1. ユーザーがPWAアプリでGoogleボタンをタップ
2. **ポップアップウィンドウ**（500x600）が開く
3. ポップアップでOAuth認証を実施
4. 認証完了後、ポップアップが自動で閉じる
5. PWAアプリが**自動的にダッシュボード**へ遷移

### ブラウザモード

1. ユーザーがGoogleボタンをクリック
2. 同じウィンドウでOAuth認証画面に遷移
3. 認証完了後、ダッシュボードに直接遷移

---

## 4. トラブルシューティング

### エラー: "redirect_uri_mismatch"

**原因**: コールバックURLが登録されていない

**解決方法**:
1. Google Cloud ConsoleでコールバックURLを確認
2. `https://app.kigasuru.com/api/auth/callback/google` が登録されているか確認
3. URLが完全一致しているか確認（末尾のスラッシュに注意）

### エラー: "認証エラー"

**原因**: 環境変数が設定されていない、または間違っている

**解決方法**:
1. Vercelの環境変数を確認
2. `NEXTAUTH_URL` が正しいドメインに設定されているか確認
3. `GOOGLE_CLIENT_ID` が正しいか確認
4. 再デプロイ（環境変数変更後は必須）

### PWAでポップアップが開かない

**原因**: ブラウザのポップアップブロッカー

**解決方法**:
1. ブラウザの設定でポップアップを許可
2. Safari: 設定 → Safari → ポップアップブロック → オフ
3. Chrome: 設定 → プライバシーとセキュリティ → サイトの設定 → ポップアップとリダイレクト → 許可

---

## 5. 確認手順

### ステップ1: ローカル環境でテスト

```bash
npm run dev
```

1. http://localhost:3000 にアクセス
2. Googleでログインを試す
3. 正常に動作することを確認

### ステップ2: 本番環境でテスト

1. Vercelにデプロイ
2. https://app.kigasuru.com にアクセス
3. ブラウザでGoogleログインを試す
4. 正常に動作することを確認

### ステップ3: PWAでテスト

1. https://app.kigasuru.com をPWAとしてインストール
2. ホーム画面のアイコンから起動
3. Googleログインを試す
4. ポップアップが開き、認証後に自動的にダッシュボードに遷移することを確認

---

## 6. 注意事項

### セキュリティ

- **AUTH_SECRET**: 本番環境では必ず再生成してください
  ```bash
  openssl rand -base64 32
  ```
- **クライアントシークレット**: 絶対にGitにコミットしないでください
- **本番環境**: テスト用のキーを使わないでください

### ドメイン

- カスタムドメイン設定後は、必ずコールバックURLを更新してください
- Vercel環境変数の`NEXTAUTH_URL`も更新してください

### デバッグ

開発時にデバッグログを有効にする：

```typescript
// auth.config.ts
export default {
  debug: true, // 開発時のみ
  // ...
}
```

本番環境では必ず`debug: false`に設定してください。

---

## まとめ

✅ Google Cloud Consoleで**コールバックURL**を追加
✅ Vercelで**環境変数**を設定
✅ 再デプロイ
✅ ブラウザとPWA両方でテスト

これで、PWAでもシームレスにOAuth認証が動作します！
