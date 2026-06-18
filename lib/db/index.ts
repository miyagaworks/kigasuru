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
  clientId?: string;        // UUID（v6 で全既存行に backfill）
  roundId?: string | null;  // Tier1 は null 固定
  holeNumber?: number | null;
  dirty?: boolean;          // true=サーバー未反映の編集あり（オンライン時 PUT）
}

export interface Round {
  id?: number;
  serverId?: string | null;
  clientId?: string;        // Tier2 の Round 冪等同期用に予約（Tier1 未使用）
  date: string;
  golfCourse: string | null;
  // latitude/longitude/temperature/actualTemperature は Tier2 で追加（Tier1 は最小）
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
  rounds!: Table<Round, number>;
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

    // v6: 冪等同期キー（clientId）・ラウンド参照・ホール番号・dirty を追加。rounds ストア新設。
    // ★ dirty(boolean) は IndexedDB の有効な index キーにできないため stores 文字列に含めない（interface 追加のみ）。
    this.version(6).stores({
      shots: '++id, serverId, clientId, roundId, holeNumber, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType, manualLocation',
      rounds: '++id, serverId, clientId, date, golfCourse, createdAt',
    }).upgrade(tx => {
      return tx.table('shots').toCollection().modify(shot => {
        if (!shot.clientId) shot.clientId = crypto.randomUUID();   // 既存ローカル行に冪等キーを後付け
        if (shot.roundId === undefined) shot.roundId = null;
        if (shot.holeNumber === undefined) shot.holeNumber = null;
        if (shot.dirty === undefined) shot.dirty = false;          // item4 用
      });
    });
  }
}

// グローバルなDB インスタンスを保持
let dbInstance: KigasuruDB | null = null;
let currentUserId: string | null = null;

// Simple in-memory cache for getAllShots
let shotsCache: { data: Shot[]; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds cache

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
  invalidateShotsCache(); // DB切替/新規作成時に古い（空の）キャッシュを捨てる
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
    clientId: shotData.clientId, // 冪等同期キー（§3）。指定時のみ保持・未指定は undefined。段階2でclientId追加時の伝播漏れを解消。
  };
  const result = await getDB().shots.add(shot);
  invalidateShotsCache(); // Invalidate cache when adding shots
  return result;
};

/**
 * Get all shots (with caching)
 */
export const getAllShots = async (skipCache = false): Promise<Shot[]> => {
  // Check cache first
  if (!skipCache && shotsCache && Date.now() - shotsCache.timestamp < CACHE_TTL) {
    console.log('[DB] Returning cached shots');
    return shotsCache.data;
  }

  // Fetch from IndexedDB
  const shots = await getDB().shots.orderBy('createdAt').reverse().toArray();

  // Update cache
  shotsCache = { data: shots, timestamp: Date.now() };
  console.log('[DB] Updated shots cache');

  return shots;
};

/**
 * Invalidate shots cache
 */
export const invalidateShotsCache = (): void => {
  shotsCache = null;
  console.log('[DB] Shots cache invalidated');
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
 * 編集可能フィールドの入力型（Shot / CurrentShot 双方を構造的に受けるための型）。
 * slope/club 等は CurrentShot 側が string | null のため、広い型で受ける。
 */
export type EditableShotInput = {
  date: string;
  club: string | null;
  distance: number | null;
  slope: string | null;
  lie: string | null;
  strength: string | null;
  wind: string | null;
  temperature: string | null;
  result: { x: number; y: number } | null;
  feeling: string | null;
  memo: string;
  golfCourse: string | null;
  latitude: number | null;
  longitude: number | null;
  actualTemperature: number | null;
  missType: string | null;
  manualLocation: boolean;
};

/**
 * 編集可能な17項目だけを抜き出す共有ヘルパー（設計書 §8.2）。
 *
 * id / serverId / clientId / dirty / createdAt は意図的に除外する。
 * これらを含めて updateShot に渡すと Dexie マージで serverId/clientId が
 * 温存されず上書き消失する地雷があるため、PUT 本文・ローカル更新の双方で
 * この17項目に限定する。record/page.tsx（CurrentShot）と lib/sync.ts（Shot）の
 * 両方から import して使い、定義を二重化しない。
 */
export const toEditableFields = (shot: EditableShotInput): EditableShotInput => ({
  date: shot.date,
  club: shot.club,
  distance: shot.distance,
  slope: shot.slope,
  lie: shot.lie,
  strength: shot.strength,
  wind: shot.wind,
  temperature: shot.temperature,
  result: shot.result,
  feeling: shot.feeling,
  memo: shot.memo,
  golfCourse: shot.golfCourse,
  latitude: shot.latitude,
  longitude: shot.longitude,
  actualTemperature: shot.actualTemperature,
  missType: shot.missType,
  manualLocation: shot.manualLocation,
});

/**
 * Update a shot record
 */
export const updateShot = async (shotId: number, updates: Partial<Shot>): Promise<number> => {
  const result = await getDB().shots.update(shotId, updates);
  invalidateShotsCache(); // Invalidate cache when updating shots
  return result;
};

/**
 * Delete a shot record
 */
export const deleteShot = async (shotId: number): Promise<void> => {
  await getDB().shots.delete(shotId);
  invalidateShotsCache(); // Invalidate cache when deleting shots
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

    // IndexedDBの既存データを1回だけ取得し、serverId / clientId / createdAt の索引を構築する。
    // 照合は serverId 最優先 → clientId → createdAt の順（2026-06-18 重複バグ修正 / 設計書 §5.5）。
    const localShots = await getAllShots();
    const localShotsByServerId = new Map<string, Shot>();
    const localShotsByClientId = new Map<string, Shot>();
    const localShotsByCreatedAt = new Map<number, Shot>();
    for (const shot of localShots) {
      if (shot.serverId) localShotsByServerId.set(shot.serverId, shot); // ★ serverId 最優先キー（再 pull 重複の恒久封鎖）
      if (shot.clientId) localShotsByClientId.set(shot.clientId, shot);
      localShotsByCreatedAt.set(shot.createdAt, shot); // 重複 createdAt は後勝ち（従来の Map 構築と同挙動）
    }

    // サーバーからのショットを処理（新規追加 or serverId/clientId 補完）
    let syncedCount = 0;
    let updatedCount = 0;
    for (const serverShot of serverShots) {
      // サーバーのcreatedAtをタイムスタンプに変換
      const serverCreatedAt = new Date(serverShot.createdAt).getTime();

      // 照合: serverId 最優先 → clientId → createdAt fallback（2026-06-18 重複バグ修正 / §5.5）。
      // 実データでは全ローカル行が serverId を持つのに従来は serverId を見ず、clientId/createdAt が
      // 外れて pull のたびに同一サーバー行のローカルコピーが増殖していた。serverId 一致のローカル行が
      // 既にあれば必ずそれに収束させ、絶対に addShot で新規追加しない（再 pull 重複の恒久停止）。
      let local = serverShot.id
        ? localShotsByServerId.get(serverShot.id)
        : undefined;
      if (!local && serverShot.clientId) {
        local = localShotsByClientId.get(serverShot.clientId);
      }
      if (!local) {
        local = localShotsByCreatedAt.get(serverCreatedAt);
      }

      if (!local) {
        // ローカルに存在しない場合は新規追加（clientId も保持して以後の clientId 照合を有効化）
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
          clientId: serverShot.clientId ?? undefined, // ★ §5.5: null は undefined に正規化して保持
        });
        syncedCount++;
      } else if (local.id) {
        // 既存ローカル行に収束（新規追加しない）。不足している同期キーのみ非破壊で補完する。
        // ★ 17項目のデータフィールドは決して上書きしない（未 push の dirty 編集＝取り残したメモ等を保護）。
        const patch: Partial<Shot> = {};
        if (!local.serverId) patch.serverId = serverShot.id;                              // serverId 未設定なら補完
        if (!local.clientId && serverShot.clientId) patch.clientId = serverShot.clientId; // clientId 未設定なら補完
        if (Object.keys(patch).length > 0) {
          await updateShot(local.id, patch);
          updatedCount++;
        }
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
