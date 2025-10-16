import Dexie, { type Table } from 'dexie';

/**
 * IndexedDB database for offline-first golf shot tracking
 * 6次元データ記録: 傾斜 × クラブ × ライ × 強度 × 風向き × 気温
 */

export interface Shot {
  id?: number;
  serverId?: string | null; // Server database ID (cuid)
  date: string;
  slope: string;
  club: string;
  lie: string;
  strength: string;
  wind: string;
  temperature: string;
  result: { x: number; y: number } | null;
  distance: number | null;
  feeling: string | null;
  memo: string;
  golfCourse: string | null;
  actualTemperature: number | null;
  latitude: number | null;
  longitude: number | null;
  missType: string | null;
  manualLocation: boolean;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface Calibration {
  id: string;
  xOffset: number;
  yOffset: number;
  zOffset: number;
  timestamp: number;
}

export class KigasuruDB extends Dexie {
  shots!: Table<Shot, number>;
  settings!: Table<Setting, string>;
  calibration!: Table<Calibration, string>;

  constructor(userId?: string) {
    // ユーザーIDをデータベース名に含めることで、ユーザーごとに独立したDBを作成
    const dbName = userId ? `KigasuruDB_${userId}` : 'KigasuruDB';
    super(dbName);

    this.version(1).stores({
      shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt',
      settings: 'key, value',
      calibration: 'id, xOffset, yOffset, zOffset, timestamp',
    });

    this.version(2).stores({
      shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude',
    }).upgrade(tx => {
      return tx.table('shots').toCollection().modify(shot => {
        if (!shot.golfCourse) shot.golfCourse = null;
        if (!shot.actualTemperature) shot.actualTemperature = null;
        if (!shot.latitude) shot.latitude = null;
        if (!shot.longitude) shot.longitude = null;
      });
    });

    this.version(3).stores({
      shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType',
    }).upgrade(tx => {
      return tx.table('shots').toCollection().modify(shot => {
        if (!shot.missType) shot.missType = null;
      });
    });

    this.version(4).stores({
      shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType, manualLocation',
    }).upgrade(tx => {
      return tx.table('shots').toCollection().modify(shot => {
        if (shot.manualLocation === undefined) shot.manualLocation = false;
      });
    });

    this.version(5).stores({
      shots: '++id, serverId, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType, manualLocation',
    }).upgrade(tx => {
      return tx.table('shots').toCollection().modify(shot => {
        if (shot.serverId === undefined) shot.serverId = null;
      });
    });
  }
}

// グローバルなDB インスタンスを保持
let dbInstance: KigasuruDB | null = null;
let currentUserId: string | null = null;

/**
 * ユーザーIDを設定してDBインスタンスを初期化
 */
export const initDB = (userId: string): KigasuruDB => {
  console.log('[DB] Initializing DB for user:', userId);

  // 既存のインスタンスがあり、同じユーザーの場合はそのまま返す
  if (dbInstance && currentUserId === userId) {
    console.log('[DB] Reusing existing DB instance for user:', userId);
    return dbInstance;
  }

  // 既存のインスタンスがあるが、別のユーザーの場合は閉じる
  if (dbInstance && currentUserId !== userId) {
    console.log('[DB] Closing DB for previous user:', currentUserId);
    dbInstance.close();
  }

  // 新しいインスタンスを作成
  console.log('[DB] Creating new DB instance for user:', userId);
  currentUserId = userId;
  dbInstance = new KigasuruDB(userId);
  return dbInstance;
};

/**
 * 現在のDBインスタンスを取得（初期化されていない場合はエラー）
 */
export const getDB = (): KigasuruDB => {
  if (!dbInstance) {
    console.log('[DB] DB not initialized - using default instance');
    // フォールバックとして非ユーザー固有のDBを使用（後方互換性のため）
    dbInstance = new KigasuruDB();
  }
  return dbInstance;
};

// 後方互換性のため、デフォルトのdbエクスポートを維持
export const db = getDB();

/**
 * Add a shot record
 */
export const addShot = async (shotData: Partial<Shot>): Promise<number> => {
  const shot: Shot = {
    serverId: shotData.serverId || null,
    date: shotData.date || new Date().toISOString(),
    slope: shotData.slope || '',
    club: shotData.club || '',
    lie: shotData.lie || '',
    strength: shotData.strength || '',
    wind: shotData.wind || '',
    temperature: shotData.temperature || '',
    result: shotData.result || null,
    distance: shotData.distance || null,
    feeling: shotData.feeling || null,
    memo: shotData.memo || '',
    golfCourse: shotData.golfCourse || null,
    actualTemperature: shotData.actualTemperature || null,
    latitude: shotData.latitude || null,
    longitude: shotData.longitude || null,
    missType: shotData.missType || null,
    manualLocation: shotData.manualLocation || false,
    createdAt: shotData.createdAt || Date.now(),
  };
  return await getDB().shots.add(shot);
};

/**
 * Get all shots
 */
export const getAllShots = async (): Promise<Shot[]> => {
  return await getDB().shots.orderBy('createdAt').reverse().toArray();
};

/**
 * Get shots with filters
 */
export const getFilteredShots = async (filters: Partial<Shot> = {}): Promise<Shot[]> => {
  let collection = getDB().shots.toCollection();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      collection = collection.filter(shot => shot[key as keyof Shot] === value);
    }
  });

  return await collection.toArray();
};

/**
 * Calculate statistics for specific conditions
 */
export const getStatistics = async (filters: Partial<Shot> = {}) => {
  const shots = await getFilteredShots(filters);

  if (shots.length === 0) {
    return null;
  }

  const distances = shots.map(s => s.distance).filter((d): d is number => d !== null && d > 0);
  const avgDistance = distances.length > 0
    ? distances.reduce((a, b) => a + b, 0) / distances.length
    : 0;

  const resultCounts: Record<string, number> = shots.reduce((acc, shot) => {
    if (shot.result && typeof shot.result === 'object' && shot.result.x !== undefined) {
      const distance = Math.sqrt(shot.result.x ** 2 + shot.result.y ** 2);
      let category: string;
      if (distance <= 5) {
        category = 'ジャスト';
      } else if (distance <= 10) {
        category = 'ターゲット';
      } else if (shot.result.y < -10) {
        category = '大ショート';
      } else if (shot.result.y < 0) {
        category = 'ショート';
      } else if (shot.result.y > 10) {
        category = '大オーバー';
      } else {
        category = 'オーバー';
      }
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mostCommonResult = Object.keys(resultCounts).length > 0
    ? Object.keys(resultCounts).reduce((a, b) =>
        resultCounts[a] > resultCounts[b] ? a : b
      )
    : null;

  return {
    count: shots.length,
    avgDistance: Math.round(avgDistance),
    resultCounts,
    mostCommonResult,
  };
};

/**
 * Save setting (saves to both IndexedDB and server)
 */
export const saveSetting = async (key: string, value: unknown): Promise<string> => {
  console.log('[DB] saveSetting called - key:', key, 'value:', value, 'currentUserId:', currentUserId);

  // Save to IndexedDB
  const result = await getDB().settings.put({ key, value });
  console.log('[DB] saveSetting completed - key:', key, 'result:', result);

  // Also save to server (online only)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const payload: Record<string, unknown> = {};

      // Map IndexedDB keys to server API format
      if (key === 'customClubs') {
        payload.clubs = value;
      } else if (key === 'enabledInputFields') {
        payload.enabledFields = value;
      }

      if (Object.keys(payload).length > 0) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.log('[DB] Setting synced to server:', key);
      }
    } catch (error) {
      console.error('[DB] Failed to sync setting to server:', error);
      // Don't throw error - IndexedDB save was successful
    }
  }

  return result;
};

/**
 * Get setting
 */
export const getSetting = async <T = unknown>(key: string, defaultValue: T | null = null): Promise<T | null> => {
  console.log('[DB] getSetting called - key:', key, 'defaultValue:', defaultValue, 'currentUserId:', currentUserId);
  const setting = await getDB().settings.get(key);
  const result = setting ? setting.value as T : defaultValue;
  console.log('[DB] getSetting result - key:', key, 'value:', result);
  return result;
};

/**
 * Save calibration data (saves to both IndexedDB and server)
 */
export const saveCalibration = async (data: Omit<Calibration, 'id' | 'timestamp'>): Promise<string> => {
  const result = await getDB().calibration.put({
    id: 'current',
    ...data,
    timestamp: Date.now(),
  });

  // Also save to server (online only)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gyroCalibration: data,
        }),
      });
      console.log('[DB] Calibration synced to server');
    } catch (error) {
      console.error('[DB] Failed to sync calibration to server:', error);
      // Don't throw error - IndexedDB save was successful
    }
  }

  return result;
};

/**
 * Get calibration data
 */
export const getCalibration = async (): Promise<Calibration | undefined> => {
  return await getDB().calibration.get('current');
};

/**
 * Update a shot record
 */
export const updateShot = async (shotId: number, updates: Partial<Shot>): Promise<number> => {
  return await getDB().shots.update(shotId, updates);
};

/**
 * Delete a shot record
 */
export const deleteShot = async (shotId: number): Promise<void> => {
  return await getDB().shots.delete(shotId);
};

/**
 * Get a single shot by ID
 */
export const getShot = async (shotId: number): Promise<Shot | undefined> => {
  return await getDB().shots.get(shotId);
};

/**
 * Clear all data (for reset)
 */
export const clearAllData = async (): Promise<void> => {
  await getDB().shots.clear();
  // Keep settings and calibration
};

/**
 * Get manual location shots for today
 */
export const getTodayManualLocationShots = async (): Promise<Shot[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await getDB().shots
    .where('createdAt')
    .between(today.getTime(), tomorrow.getTime())
    .and(shot => shot.manualLocation === true)
    .toArray();
};

/**
 * Update location data for multiple shots
 */
export const updateLocationForShots = async (
  shotIds: number[],
  locationData: {
    golfCourse: string | null;
    actualTemperature: number | null;
    temperature: string;
    latitude: number | null;
    longitude: number | null;
  }
): Promise<void> => {
  await Promise.all(
    shotIds.map(id =>
      getDB().shots.update(id, {
        golfCourse: locationData.golfCourse,
        actualTemperature: locationData.actualTemperature,
        temperature: locationData.temperature,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        manualLocation: false,
      })
    )
  );
};

/**
 * Sync settings from server to IndexedDB
 * サーバーから設定データを取得してIndexedDBに同期
 */
export const syncSettingsFromServer = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[DB] Syncing settings from server...');

    // サーバーから設定データを取得
    const response = await fetch('/api/settings', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.settings) {
      throw new Error('Invalid response from server');
    }

    const { clubs, enabledFields, gyroCalibration } = data.settings;
    console.log('[DB] Received settings from server:', { clubs, enabledFields, gyroCalibration });

    // IndexedDBに保存（サーバー同期を防ぐため、直接putを使用）
    if (clubs) {
      await getDB().settings.put({ key: 'customClubs', value: clubs });
      console.log('[DB] Synced clubs to IndexedDB');
    }

    if (enabledFields) {
      await getDB().settings.put({ key: 'enabledInputFields', value: enabledFields });
      console.log('[DB] Synced enabled fields to IndexedDB');
    }

    if (gyroCalibration) {
      await getDB().calibration.put({
        id: 'current',
        xOffset: gyroCalibration.xOffset,
        yOffset: gyroCalibration.yOffset,
        zOffset: gyroCalibration.zOffset,
        timestamp: Date.now(),
      });
      console.log('[DB] Synced gyro calibration to IndexedDB');
    }

    console.log('[DB] Successfully synced settings from server');
    return { success: true };
  } catch (error) {
    console.error('[DB] Failed to sync settings from server:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Sync shots from server to IndexedDB
 * サーバーからショットデータを取得してIndexedDBに同期
 */
export const syncShotsFromServer = async (): Promise<{ success: boolean; synced: number; error?: string }> => {
  try {
    console.log('[DB] Syncing shots from server...');

    // サーバーからショットデータを取得
    const response = await fetch('/api/shots', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.shots) {
      throw new Error('Invalid response from server');
    }

    const serverShots = data.shots;
    console.log('[DB] Received', serverShots.length, 'shots from server');

    // IndexedDBの既存データを取得
    const localShots = await getAllShots();
    const localShotsMap = new Map(localShots.map(shot => [shot.createdAt, shot]));

    // サーバーからのショットを処理（新規追加 or serverId更新）
    let syncedCount = 0;
    let updatedCount = 0;
    for (const serverShot of serverShots) {
      // サーバーのcreatedAtをタイムスタンプに変換
      const serverCreatedAt = new Date(serverShot.createdAt).getTime();

      const existingShot = localShotsMap.get(serverCreatedAt);

      if (!existingShot) {
        // ローカルに存在しない場合は新規追加
        await addShot({
          serverId: serverShot.id, // Save server ID
          date: serverShot.date,
          slope: serverShot.slope,
          club: serverShot.club,
          lie: serverShot.lie,
          strength: serverShot.strength,
          wind: serverShot.wind,
          temperature: serverShot.temperature,
          result: serverShot.result,
          distance: serverShot.distance,
          feeling: serverShot.feeling,
          memo: serverShot.memo,
          golfCourse: serverShot.golfCourse,
          actualTemperature: serverShot.actualTemperature,
          latitude: serverShot.latitude,
          longitude: serverShot.longitude,
          missType: serverShot.missType,
          manualLocation: serverShot.manualLocation,
          createdAt: serverCreatedAt,
        });
        syncedCount++;
      } else if (!existingShot.serverId && existingShot.id) {
        // ローカルに存在するがserverIdがない場合は更新
        await updateShot(existingShot.id, { serverId: serverShot.id });
        updatedCount++;
      }
    }

    console.log(`[DB] Synced ${syncedCount} new shots from server, updated ${updatedCount} existing shots with serverId`);
    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('[DB] Failed to sync from server:', error);
    return {
      success: false,
      synced: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export default db;
