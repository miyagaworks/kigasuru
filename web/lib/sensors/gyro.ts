/**
 * Gyroscope sensor integration for automatic slope detection
 * Uses DeviceOrientation API to detect 8 types of slopes
 */

// Default threshold - can be overridden
let FLAT_THRESHOLD = 2; // ±2° threshold for flat detection

/**
 * Set the flat threshold
 */
export const setFlatThreshold = (threshold: number) => {
  FLAT_THRESHOLD = threshold;
};

/**
 * Get the current flat threshold
 */
export const getFlatThreshold = () => {
  return FLAT_THRESHOLD;
};

/**
 * Request permission for iOS 13+
 */
export const requestGyroPermission = async (): Promise<boolean> => {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  // For non-iOS or older versions, assume permission granted
  return true;
};

/**
 * Check if gyro is supported
 */
export const isGyroSupported = (): boolean => {
  return 'DeviceOrientationEvent' in window;
};

/**
 * Detect slope type from angles
 */
export const detectSlope = (
  beta: number,
  gamma: number,
  calibration: { xOffset: number; yOffset: number } = { xOffset: 0, yOffset: 0 }
): string => {
  // Apply calibration
  const x = beta - calibration.xOffset;
  const y = gamma - calibration.yOffset;

  // Determine left/right tilt
  let leftRight = 'none';
  if (x > FLAT_THRESHOLD) {
    leftRight = 'left-up'; // Left foot higher (phone tilts right, left side up)
  } else if (x < -FLAT_THRESHOLD) {
    leftRight = 'left-down'; // Left foot lower (phone tilts left, right side up)
  }

  // Determine front/back tilt
  let frontBack = 'none';
  if (y < -FLAT_THRESHOLD) {
    frontBack = 'toe-up'; // Toe higher
  } else if (y > FLAT_THRESHOLD) {
    frontBack = 'toe-down'; // Toe lower (heel higher)
  }

  // Combine slopes
  if (leftRight === 'none' && frontBack === 'none') {
    return 'flat';
  } else if (leftRight === 'none') {
    return frontBack;
  } else if (frontBack === 'none') {
    return leftRight;
  } else {
    // Compound slope
    return `${leftRight}-${frontBack}`;
  }
};

/**
 * Get slope display name in Japanese
 */
export const getSlopeDisplayName = (slope: string): string => {
  const names: Record<string, string> = {
    'flat': '平坦',
    'left-up': '左足上がり',
    'left-down': '左足下がり',
    'toe-up': 'つま先上がり',
    'toe-down': 'つま先下がり',
    'left-up-toe-up': '左足上がり+つま先上がり',
    'left-up-toe-down': '左足上がり+つま先下がり',
    'left-down-toe-up': '左足下がり+つま先上がり',
    'left-down-toe-down': '左足下がり+つま先下がり',
  };
  return names[slope] || slope;
};

/**
 * Start gyro monitoring
 */
export const startGyroMonitoring = (
  callback: (data: {
    slope: string;
    xAngle: number;
    yAngle: number;
    zAngle: number;
    timestamp: number;
  }) => void,
  calibration: { xOffset: number; yOffset: number } = { xOffset: 0, yOffset: 0 },
  onError?: () => void
): (() => void) => {
  let isActive = true;
  let hasReceivedData = false;

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (!isActive) return;

    // Check if we're actually receiving data
    if (event.beta === null && event.gamma === null && event.alpha === null) {
      return; // No data available
    }

    hasReceivedData = true;

    const beta = event.beta || 0;   // X-axis (-180 to 180)
    const gamma = event.gamma || 0;  // Y-axis (-90 to 90)
    const alpha = event.alpha || 0;  // Z-axis (compass)

    const slope = detectSlope(beta, gamma, calibration);

    callback({
      slope,
      xAngle: beta,
      yAngle: gamma,
      zAngle: alpha,
      timestamp: Date.now(),
    });
  };

  window.addEventListener('deviceorientation', handleOrientation);

  // Check if we receive data within 1 second
  const timeoutId = setTimeout(() => {
    if (!hasReceivedData && isActive) {
      // No data received - likely no permission
      isActive = false;
      window.removeEventListener('deviceorientation', handleOrientation);
      if (onError) {
        onError();
      }
    }
  }, 1000);

  // Return stop function
  return () => {
    isActive = false;
    clearTimeout(timeoutId);
    window.removeEventListener('deviceorientation', handleOrientation);
  };
};

/**
 * Calibrate gyro by getting current angles
 * User should place phone on flat surface during calibration
 */
export const calibrateGyro = (): Promise<{
  xOffset: number;
  yOffset: number;
  zOffset: number;
}> => {
  return new Promise((resolve, reject) => {
    let sampleCount = 0;
    let totalBeta = 0;
    let totalGamma = 0;
    const samples = 30; // Take 30 samples over ~1 second

    const handleOrientation = (event: DeviceOrientationEvent) => {
      totalBeta += event.beta || 0;
      totalGamma += event.gamma || 0;
      sampleCount++;

      if (sampleCount >= samples) {
        window.removeEventListener('deviceorientation', handleOrientation);

        const calibration = {
          xOffset: totalBeta / samples,
          yOffset: totalGamma / samples,
          zOffset: 0,
        };

        resolve(calibration);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (sampleCount === 0) {
        reject(new Error('No gyro data received'));
      }
    }, 5000);
  });
};

/**
 * Get angle magnitude (for display)
 */
export const getAngleMagnitude = (angle: number): string => {
  return Math.abs(angle).toFixed(1);
};

/**
 * Format angle for display
 */
export const formatAngle = (angle: number): string => {
  return `${angle >= 0 ? '+' : ''}${angle.toFixed(1)}°`;
};
