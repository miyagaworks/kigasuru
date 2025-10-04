import { useState, useCallback } from 'react';

// テスト用のダミーゴルフ場座標
const TEST_GOLF_COURSES = [
  {
    name: '川奈ホテルゴルフコース',
    latitude: 34.9125,
    longitude: 139.1025,
  },
  {
    name: '東京よみうりカントリークラブ',
    latitude: 35.8333,
    longitude: 139.2833,
  },
  {
    name: '鳴尾ゴルフ倶楽部',
    latitude: 34.7167,
    longitude: 135.3583,
  },
];

/**
 * Hook for accessing device location
 */
export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useTestLocation, setUseTestLocation] = useState(false);

  const getLocation = useCallback((testMode = useTestLocation) => {
    return new Promise((resolve, reject) => {
      // テストモードの場合、ダミー座標を返す
      if (testMode) {
        setLoading(true);
        setError(null);

        // ランダムなゴルフ場を選択
        const randomCourse = TEST_GOLF_COURSES[Math.floor(Math.random() * TEST_GOLF_COURSES.length)];

        setTimeout(() => {
          const locationData = {
            latitude: randomCourse.latitude,
            longitude: randomCourse.longitude,
            accuracy: 10,
            timestamp: Date.now(),
            isTest: true,
            testCourseName: randomCourse.name,
          };
          setLocation(locationData);
          setLoading(false);
          resolve(locationData);
        }, 500); // 実際の位置取得をシミュレート

        return;
      }

      if (!navigator.geolocation) {
        const err = new Error('位置情報がサポートされていません');
        setError(err);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setLocation(locationData);
          setLoading(false);
          resolve(locationData);
        },
        (err) => {
          // 日本語エラーメッセージに変換
          let errorMessage = '位置情報の取得に失敗しました';
          if (err.code === 1) {
            errorMessage = '位置情報の使用が許可されていません。設定から許可してください。';
          } else if (err.code === 2) {
            errorMessage = '位置情報を取得できませんでした。';
          } else if (err.code === 3) {
            errorMessage = '位置情報の取得がタイムアウトしました。';
          }
          const error = new Error(errorMessage);
          setError(error);
          setLoading(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, [useTestLocation]);

  return {
    location,
    error,
    loading,
    getLocation,
    useTestLocation,
    setUseTestLocation,
  };
};
