import Dexie from 'dexie';

/**
 * IndexedDB database for offline-first golf shot tracking
 * 6次元データ記録: 傾斜 × クラブ × ライ × 強度 × 風向き × 気温
 */
export const db = new Dexie('KigasuruDB');

db.version(1).stores({
  // ショット記録
  shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt',

  // 設定
  settings: 'key, value',

  // ジャイロセンサーキャリブレーションデータ
  calibration: 'id, xOffset, yOffset, zOffset, timestamp',
});

// Add new fields for version 2
db.version(2).stores({
  shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude',
}).upgrade(tx => {
  // Migration: add new fields to existing records
  return tx.table('shots').toCollection().modify(shot => {
    if (!shot.golfCourse) shot.golfCourse = null;
    if (!shot.actualTemperature) shot.actualTemperature = null;
    if (!shot.latitude) shot.latitude = null;
    if (!shot.longitude) shot.longitude = null;
  });
});

// Add missType field for version 3
db.version(3).stores({
  shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType',
}).upgrade(tx => {
  // Migration: add missType field to existing records
  return tx.table('shots').toCollection().modify(shot => {
    if (!shot.missType) shot.missType = null;
  });
});

// Add manualLocation field for version 4
db.version(4).stores({
  shots: '++id, date, slope, club, lie, strength, wind, temperature, result, distance, feeling, memo, createdAt, golfCourse, actualTemperature, latitude, longitude, missType, manualLocation',
}).upgrade(tx => {
  // Migration: add manualLocation field to existing records
  return tx.table('shots').toCollection().modify(shot => {
    if (shot.manualLocation === undefined) shot.manualLocation = false;
  });
});

/**
 * Shot record model
 */
export class Shot {
  constructor({
    date,
    slope,              // 傾斜: flat, left-up, left-down, toe-up, toe-down, etc.
    club,               // クラブ: driver, 7i, 52°, etc.
    lie,                // ライ: a-grade, good, normal, bad, very-bad, bunker
    strength,           // 強度: full, normal, soft
    wind,               // 風: none, against, follow, left, right, complex
    temperature,        // 気温: summer(25°C以上), mid-season(15-25°C), winter(15°C以下)
    result,             // 結果: target, just, short, big-short, over, big-over
    distance,           // 飛距離(ヤード)
    feeling,            // 感触: great, good, normal, bad, unsure
    memo = '',          // メモ
    golfCourse = null,  // ゴルフ場名
    actualTemperature = null,  // 実際の気温（℃）
    latitude = null,    // 緯度
    longitude = null,   // 経度
    missType = null,    // ミスショットタイプ: top, choro, duff, over, shank, pull
    manualLocation = false,  // 手動入力フラグ
  }) {
    this.date = date || new Date().toISOString();
    this.slope = slope;
    this.club = club;
    this.lie = lie;
    this.strength = strength;
    this.wind = wind;
    this.temperature = temperature;
    this.result = result;
    this.distance = distance;
    this.feeling = feeling;
    this.memo = memo;
    this.golfCourse = golfCourse;
    this.actualTemperature = actualTemperature;
    this.latitude = latitude;
    this.longitude = longitude;
    this.missType = missType;
    this.manualLocation = manualLocation;
    this.createdAt = Date.now();
  }
}

/**
 * Add a shot record
 */
export const addShot = async (shotData) => {
  const shot = new Shot(shotData);
  return await db.shots.add(shot);
};

/**
 * Get all shots
 */
export const getAllShots = async () => {
  return await db.shots.orderBy('createdAt').reverse().toArray();
};

/**
 * Get shots with filters (6-dimension filtering)
 */
export const getFilteredShots = async (filters = {}) => {
  let query = db.shots;

  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null) {
      query = query.where(key).equals(filters[key]);
    }
  });

  return await query.toArray();
};

/**
 * Calculate statistics for specific conditions
 */
export const getStatistics = async (filters = {}) => {
  const shots = await getFilteredShots(filters);

  if (shots.length === 0) {
    return null;
  }

  const distances = shots.map(s => s.distance).filter(d => d > 0);
  const avgDistance = distances.length > 0
    ? distances.reduce((a, b) => a + b, 0) / distances.length
    : 0;

  // 新形式（座標）と旧形式（カテゴリ）の両方に対応
  const resultCounts = shots.reduce((acc, shot) => {
    // 新形式: {x, y} オブジェクトの場合は精度カテゴリに変換
    if (shot.result && typeof shot.result === 'object' && shot.result.x !== undefined) {
      const distance = Math.sqrt(shot.result.x ** 2 + shot.result.y ** 2);
      let category;
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
    // 旧形式: 文字列の場合はそのまま
    else if (shot.result && typeof shot.result === 'string') {
      acc[shot.result] = (acc[shot.result] || 0) + 1;
    }
    return acc;
  }, {});

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
 * Save setting
 */
export const saveSetting = async (key, value) => {
  return await db.settings.put({ key, value });
};

/**
 * Get setting
 */
export const getSetting = async (key, defaultValue = null) => {
  const setting = await db.settings.get(key);
  return setting ? setting.value : defaultValue;
};

/**
 * Save calibration data
 */
export const saveCalibration = async (data) => {
  return await db.calibration.put({
    id: 'current',
    ...data,
    timestamp: Date.now(),
  });
};

/**
 * Get calibration data
 */
export const getCalibration = async () => {
  return await db.calibration.get('current');
};

/**
 * Update a shot record
 */
export const updateShot = async (shotId, updates) => {
  return await db.shots.update(shotId, updates);
};

/**
 * Delete a shot record
 */
export const deleteShot = async (shotId) => {
  return await db.shots.delete(shotId);
};

/**
 * Get a single shot by ID
 */
export const getShot = async (shotId) => {
  return await db.shots.get(shotId);
};

/**
 * Clear all data (for reset)
 */
export const clearAllData = async () => {
  await db.shots.clear();
  // Keep settings and calibration
};

/**
 * Get manual location shots for today
 */
export const getTodayManualLocationShots = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await db.shots
    .where('createdAt')
    .between(today.getTime(), tomorrow.getTime())
    .and(shot => shot.manualLocation === true)
    .toArray();
};

/**
 * Update location data for multiple shots
 */
export const updateLocationForShots = async (shotIds, locationData) => {
  const { golfCourse, actualTemperature, temperature, latitude, longitude } = locationData;

  await Promise.all(
    shotIds.map(id =>
      db.shots.update(id, {
        golfCourse,
        actualTemperature,
        temperature,
        latitude,
        longitude,
        manualLocation: false,
      })
    )
  );
};

export default db;
