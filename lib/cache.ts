/**
 * シンプルなメモリキャッシュ実装
 * 管理画面のパフォーマンス向上のため
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * キャッシュから値を取得
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 有効期限切れの場合は削除
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * キャッシュに値を設定
   * @param key キャッシュキー
   * @param data キャッシュするデータ
   * @param ttl 有効期限（秒）デフォルト: 300秒（5分）
   */
  set<T>(key: string, data: T, ttl: number = 300): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }

  /**
   * キャッシュを削除
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * すべてのキャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 有効期限切れのエントリを削除
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// シングルトンインスタンス
export const cache = new MemoryCache();

// 定期的にクリーンアップ（10分ごと）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 10 * 60 * 1000);
}
