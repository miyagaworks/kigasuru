import { db, updateShot, toEditableFields } from './db';

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
 * dirty（オフライン編集済み）ショットの PUT 反映（設計書 §5.3 §8.3）
 *
 * - 対象は dirty===true かつ serverId を持つショットのみ。toEditableFields の
 *   17項目を PUT /api/shots/{serverId} に送る（id/serverId/clientId/dirty/createdAt は送らない）。
 * - 応答 ok なら dirty=false に落とす。失敗はログのみで次回 triggerPush で再試行（全体は止めない）。
 * - create push（serverId==null）とは独立。互いの挙動に影響しない。
 */
export async function pushDirtyShots() {
  // serverId 無しは PUT 対象外（通常の create push が編集後の値ごと拾う / §8.2）。
  const dirtyShots = await db.shots
    .filter((s) => s.dirty === true && !!s.serverId)
    .toArray();

  if (dirtyShots.length === 0) {
    return;
  }

  for (const shot of dirtyShots) {
    try {
      const response = await fetch(`/api/shots/${shot.serverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toEditableFields(shot)),
      });

      if (response.ok) {
        // 成功: dirty を落とす。serverId は触らない。
        await updateShot(shot.id!, { dirty: false });
      } else {
        console.error(
          `Failed to PUT dirty shot ${shot.id} (serverId=${shot.serverId}):`,
          response.status
        );
        // 次回 online で再試行（全体は止めない）。
      }
    } catch (error) {
      console.error(`Error PUTting dirty shot ${shot.id}:`, error);
      // 例外でループ全体を止めない。
    }
  }
}

/**
 * 多重起動の抑止フラグ（モジュールスコープ）。
 * サーバーは clientId 冪等のため必須ではないが、無駄な並走 push を避ける。
 */
let isPushing = false;

/**
 * 自動同期トリガーの共通処理。
 * navigator.onLine が true のときだけ pushUnsyncedShots() を実行し、
 * 失敗はログのみで UI を壊さない。多重起動は isPushing で抑止する。
 */
async function triggerPush() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (isPushing) return;
  isPushing = true;
  try {
    await pushUnsyncedShots(); // 未同期(serverId==null)の create push
    await pushDirtyShots();    // dirty 編集(serverId あり)の PUT 反映（§8.3）
  } catch (error) {
    // 失敗はログのみ。UI を壊さず、次のトリガーで再試行する。
    console.error('Auto-sync push failed:', error);
  } finally {
    isPushing = false;
  }
}

/**
 * クライアント主導の自動同期セットアップ（設計書 §5.6 Option A）
 *
 * SW の Background Sync（'sync-shots'）依存を外し、クライアントから
 * pushUnsyncedShots() を直接呼ぶ。トリガーは次の3つ:
 *   (1) online 復帰（window 'online'）
 *   (2) アプリ前面化（document 'visibilitychange' で visibilityState==='visible'）
 *   (3) セットアップ直後に1回（online なら即 push 試行）
 * いずれも navigator.onLine === true のときだけ実行する（triggerPush 内で判定）。
 */
export function setupAutoSync() {
  if (typeof window === 'undefined') return;

  // (1) online 復帰
  const handleOnline = () => {
    void triggerPush();
  };

  // (2) アプリ前面化
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void triggerPush();
    }
  };

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // (3) セットアップ直後に1回（online なら即 push 試行）
  void triggerPush();

  // クリーンアップ関数: 追加したリスナーを確実に解除する。
  return () => {
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
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
