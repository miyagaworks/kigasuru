import { db, updateShot } from './db';

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
      await pushUnsyncedShots();
    }
  } else {
    // Background Sync API未対応の場合は即座に同期
    await pushUnsyncedShots();
  }
}

/**
 * 未同期ショットの push（冪等同期 / 設計書 §5.3・§5.1）
 *
 * - push 対象は serverId == null（未同期）のみ。clientId をサーバーへ送り upsert させる。
 * - 成功時は serverId を書くだけ。ローカルは削除しない（IndexedDB が分析の単一ソース）。
 * - 応答ロスト等で再送しても、同一 clientId がサーバー側で 1 行に収束する（冪等）。
 */
export async function pushUnsyncedShots() {
  // serverId == null は IndexedDB の index 対象にできないため filter スキャンで抽出する。
  const unsynced = await db.shots.filter((s) => !s.serverId).toArray();

  if (unsynced.length === 0) {
    return;
  }

  // 直列処理: 1 件が失敗しても全体を止めず、次回 online で再試行する。
  for (const shot of unsynced) {
    try {
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
          clientId: shot.clientId, // 冪等同期キー（サーバーは clientId upsert）
        }),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.shotId) {
        // 成功: serverId を書くだけ・削除しない。
        await updateShot(shot.id!, { serverId: result.shotId });
      } else {
        console.error(
          `Failed to push shot ${shot.id}:`,
          response.status,
          result
        );
        // 次回 online で再試行（全体は止めない）。
      }
    } catch (error) {
      console.error(`Error pushing shot ${shot.id}:`, error);
      // 例外でループ全体を止めない。
    }
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
    // 未同期(serverId==null)のみを数える。#6aで同期後も削除しないため、count() では総数になる（§3 不変条件2）。
    return await db.shots.filter((s) => !s.serverId).count();
  } catch (error) {
    console.error('Failed to get pending shots count:', error);
    return 0;
  }
}
