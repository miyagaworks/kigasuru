import { db } from './db';

/**
 * バックグラウンド同期の登録
 */
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-shots');
    } catch (error) {
      console.error('Background sync registration failed:', error);
      // フォールバック: 即座に同期を試みる
      await syncShots();
    }
  } else {
    // Background Sync API未対応の場合は即座に同期
    await syncShots();
  }
}

/**
 * ショットデータの同期
 */
export async function syncShots() {
  try {
    // IndexedDBから全てのショットを取得
    const shots = await db.shots.toArray();

    if (shots.length === 0) {
      return;
    }

    // 各ショットをAPIに送信
    const syncResults = await Promise.allSettled(
      shots.map(async (shot) => {
        const response = await fetch('/api/shots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: shot.date,
            slope: shot.slope,
            club: shot.club,
            lie: shot.lie,
            strength: shot.strength,
            wind: shot.wind,
            temperature: shot.temperature,
            result: shot.result,
            distance: shot.distance,
            feeling: shot.feeling,
            memo: shot.memo,
            golfCourse: shot.golfCourse,
            actualTemperature: shot.actualTemperature,
            latitude: shot.latitude,
            longitude: shot.longitude,
            missType: shot.missType,
            manualLocation: shot.manualLocation,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to sync shot ${shot.id}: ${response.statusText}`);
        }

        return shot.id;
      })
    );

    // 成功したショットをIndexedDBから削除
    const successfulIds = syncResults
      .filter((result): result is PromiseFulfilledResult<number> =>
        result.status === 'fulfilled' && result.value !== undefined
      )
      .map(result => result.value);

    if (successfulIds.length > 0) {
      await db.shots.bulkDelete(successfulIds);
    }

    // 失敗したショットのエラーをログ
    const failures = syncResults.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some shots failed to sync:', failures);
    }

  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

/**
 * オンライン復帰時の自動同期
 */
export function setupAutoSync() {
  if (typeof window === 'undefined') return;

  const handleOnline = async () => {
    await registerBackgroundSync();
  };

  window.addEventListener('online', handleOnline);

  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * 保留中のショット数を取得
 */
export async function getPendingShotsCount(): Promise<number> {
  try {
    return await db.shots.count();
  } catch (error) {
    console.error('Failed to get pending shots count:', error);
    return 0;
  }
}
