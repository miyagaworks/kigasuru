import { useEffect, useState, useCallback } from 'react';
import {
  isGyroSupported,
  requestGyroPermission,
  startGyroMonitoring,
  calibrateGyro as calibrateGyroSensor,
} from '../sensors/gyro';
import { getCalibration, saveCalibration, getSetting, saveSetting } from '../db';
import { useStore } from '../store';

/**
 * Custom hook for gyroscope sensor integration
 */
export const useGyro = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [error, setError] = useState(null);

  const { gyro, updateGyro, setGyroEnabled, setGyroCalibrated, updateCurrentShot } = useStore();

  // Check support on mount
  useEffect(() => {
    setIsSupported(isGyroSupported());
  }, []);

  // Load permission state on mount
  useEffect(() => {
    const loadPermission = async () => {
      try {
        const savedPermission = await getSetting('gyroPermission', false);
        setHasPermission(savedPermission);
      } catch (err) {
        console.error('Failed to load permission state:', err);
      }
    };
    loadPermission();
  }, []);

  // Load calibration on mount
  useEffect(() => {
    const loadCalibration = async () => {
      try {
        const calibration = await getCalibration();
        if (calibration) {
          setGyroCalibrated(true);
        }
      } catch (err) {
        console.error('Failed to load calibration:', err);
      }
    };
    loadCalibration();
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

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      const calibration = await getCalibration();

      const stopFn = startGyroMonitoring((data) => {
        updateGyro(data);

        // Auto-update current shot slope if enabled and not manually selected
        // ユーザーが手動で選択した傾斜は上書きしない
        const currentState = useStore.getState();
        if (gyro.enabled && !currentState.currentShot.slope) {
          updateCurrentShot('slope', data.slope);
        }
      }, calibration || { xOffset: 0, yOffset: 0 });

      setGyroEnabled(true);
      return stopFn;
    } catch {
      setError('ジャイロセンサーの起動に失敗しました');
      return null;
    }
  }, [isSupported, hasPermission, gyro.enabled, requestPermission, updateGyro, setGyroEnabled, updateCurrentShot]);

  // Stop monitoring
  const stopMonitoring = useCallback((stopFn) => {
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
