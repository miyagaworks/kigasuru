'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  isGyroSupported,
  requestGyroPermission,
  startGyroMonitoring,
  calibrateGyro as calibrateGyroSensor,
} from '@/lib/sensors/gyro';
import { getCalibration, saveCalibration, getSetting, saveSetting } from '@/lib/db';
import { useStore } from '@/lib/store';

/**
 * Custom hook for gyroscope sensor integration
 */
export const useGyro = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { gyro, updateGyro, setGyroEnabled, setGyroCalibrated } = useStore();

  // Check support on mount
  useEffect(() => {
    setIsSupported(isGyroSupported());
  }, []);

  // Load permission state on mount
  useEffect(() => {
    const loadPermission = async () => {
      try {
        const savedPermission = await getSetting<boolean>('gyroPermission', false);
        setHasPermission(savedPermission || false);
      } catch (err) {
        console.error('Failed to load permission state:', err);
      }
    };
    loadPermission();
  }, []);

  // Load calibration on mount
  useEffect(() => {
    const loadCalibrationData = async () => {
      try {
        const calibration = await getCalibration();
        if (calibration) {
          setGyroCalibrated(true);
        }
      } catch (err) {
        console.error('Failed to load calibration:', err);
      }
    };
    loadCalibrationData();
  }, [setGyroCalibrated]);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestGyroPermission();
      setHasPermission(granted);

      // Save permission state to IndexedDB
      await saveSetting('gyroPermission', granted);

      if (!granted) {
        setError('ジャイロセンサーの許可が拒否されました');
      }
      return granted;
    } catch {
      setError('ジャイロセンサーの許可リクエストに失敗しました');
      return false;
    }
  }, []);

  // Calibrate gyro
  const calibrate = useCallback(async () => {
    setIsCalibrating(true);
    setError(null);

    try {
      const calibration = await calibrateGyroSensor();
      await saveCalibration(calibration);
      setGyroCalibrated(true);
      setIsCalibrating(false);
      return calibration;
    } catch (err) {
      setError('キャリブレーションに失敗しました');
      setIsCalibrating(false);
      throw err;
    }
  }, [setGyroCalibrated]);

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (!isSupported) {
      setError('このデバイスはジャイロセンサーに対応していません');
      return null;
    }

    // Check if permission was already granted (don't request again automatically)
    if (!hasPermission) {
      setError('ジャイロセンサーの許可が必要です。設定ページで許可してください。');
      setGyroEnabled(false);
      return null;
    }

    try {
      const calibration = await getCalibration();

      const stopFn = startGyroMonitoring(
        (data) => {
          updateGyro(data);
          // Note: currentShot.slope is only set when user taps a slope segment
          // Gyro data is stored in gyro.slope for highlighting only
        },
        calibration ? { xOffset: calibration.xOffset, yOffset: calibration.yOffset } : { xOffset: 0, yOffset: 0 },
        () => {
          // onError callback - no data received within timeout
          setError('ジャイロセンサーのデータが取得できません。ブラウザ設定を確認してください。');
          setGyroEnabled(false);
          setHasPermission(false);
          saveSetting('gyroPermission', false);
        }
      );

      setGyroEnabled(true);
      return stopFn;
    } catch {
      setError('ジャイロセンサーの起動に失敗しました');
      setGyroEnabled(false);
      return null;
    }
  }, [isSupported, hasPermission, updateGyro, setGyroEnabled]);

  // Stop monitoring
  const stopMonitoring = useCallback((stopFn: (() => void) | null) => {
    if (stopFn) {
      stopFn();
      setGyroEnabled(false);
    }
  }, [setGyroEnabled]);

  return {
    isSupported,
    hasPermission,
    isCalibrating,
    error,
    gyro,
    requestPermission,
    calibrate,
    startMonitoring,
    stopMonitoring,
  };
};
