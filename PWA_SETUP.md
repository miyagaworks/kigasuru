# PWA設定完了

## 実装内容

### 1. Manifest設定
- ✅ `public/manifest.json` - PWAマニフェスト設定
- ✅ `app/layout.tsx` - メタデータにmanifest linkを追加

### 2. Service Worker
- ✅ `public/sw.js` - Service Worker実装
  - Cache First戦略（静的リソース）
  - Network First戦略（API、ページ遷移）
  - オフラインフォールバック
- ✅ `components/Providers.tsx` - Service Worker登録スクリプト

### 3. アイコン
- ✅ `public/icon-192.png` (192x192)
- ✅ `public/icon-512.png` (512x512)
- ✅ `public/apple-touch-icon.png` (Apple用)

### 4. OGP設定
- ✅ `app/layout.tsx` - OpenGraph/Twitter Cardメタデータ
- ✅ `public/og-image.png` (1200x630推奨サイズ)

## PWAインストール方法

### スマートフォン（iOS）
1. Safariでアプリを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択

### スマートフォン（Android）
1. Chromeでアプリを開く
2. メニューから「ホーム画面に追加」を選択
3. またはアドレスバーの「インストール」アイコンをタップ

### デスクトップ（Chrome/Edge）
1. アドレスバー右側の「インストール」アイコンをクリック
2. 確認ダイアログで「インストール」をクリック

## 確認方法

### 開発環境
```bash
npm run dev
```

ブラウザの開発者ツールで確認：
1. **Application** タブ
2. **Manifest** - manifest.jsonの内容を確認
3. **Service Workers** - Service Workerの登録状態を確認
4. **Cache Storage** - キャッシュされたリソースを確認

### OGP画像の確認
以下のツールでOGP画像が正しく設定されているか確認できます：
- [Open Graph Debugger](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

## 機能

### オフライン対応
- 静的リソース（画像、CSS、JS）をキャッシュ
- ページ遷移時のオフラインフォールバック
- オフライン通知バナー表示

### キャッシュ戦略
- **静的リソース**: Cache First（即座に表示）
- **API**: Network First（最新データ優先、オフライン時はキャッシュ）
- **ページ**: Network First + オフラインページ

### 自動更新
- Service Workerの更新を自動検出
- 新バージョン利用可能時に通知・リロード

## 注意事項

1. **HTTPS必須**: Service WorkerはHTTPS環境でのみ動作（localhostを除く）
2. **キャッシュ削除**: Service Workerを更新した場合、古いキャッシュは自動削除されます
3. **外部リソース**: Google、LINE、Stripe等の外部リソースはキャッシュしません
