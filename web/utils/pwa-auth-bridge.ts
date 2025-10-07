// iOS PWAでのOAuth認証を橋渡しするユーティリティ
// Cache APIを使用してSafariとPWA間でセッションを共有

const CACHE_NAME = 'pwa-auth-bridge-v1';
const AUTH_TOKEN_KEY = 'auth-session-token';
const TOKEN_TTL = 5 * 60 * 1000; // 5分

export interface AuthBridgeData {
  token: string;
  timestamp: number;
  provider: string;
  callbackUrl: string;
}

// Service Worker経由でCache APIを使用
export const authBridge = {
  // 認証トークンをキャッシュに保存
  async saveAuthToken(data: Partial<AuthBridgeData>): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

      await cache.put(`/${AUTH_TOKEN_KEY}`, response);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  },

  // キャッシュから認証トークンを取得
  async getAuthToken(): Promise<AuthBridgeData | null> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(`/${AUTH_TOKEN_KEY}`);

      if (!response) return null;

      const data: AuthBridgeData = await response.json();

      // TTLチェック
      if (Date.now() - data.timestamp > TOKEN_TTL) {
        await cache.delete(`/${AUTH_TOKEN_KEY}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  },

  // キャッシュから認証トークンを削除
  async clearAuthToken(): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(`/${AUTH_TOKEN_KEY}`);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  },

  // iOS PWAかどうかを判定
  isIOSPWA(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true ||
                         window.matchMedia('(display-mode: standalone)').matches;
    return isIOS && isStandalone;
  },

  // OAuth認証開始時にランダムなトークンを生成
  generateBridgeToken(): string {
    return `pwa-auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // URLにブリッジトークンを追加
  addBridgeTokenToUrl(url: string, token: string): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set('pwa_bridge_token', token);
    return urlObj.toString();
  },

  // URLからブリッジトークンを取得
  getBridgeTokenFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('pwa_bridge_token');
  }
};