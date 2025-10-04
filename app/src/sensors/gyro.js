/**
 * Gyroscope sensor integration for automatic slope detection
 * Uses DeviceOrientation API to detect 8 types of slopes
 */

// Default threshold - can be overridden
let FLAT_THRESHOLD = 2; // ±2° threshold for flat detection

/**
 * Set the flat threshold
 */
export const setFlatThreshold = (threshold) => {
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
export const requestGyroPermission = async () => {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Gyro permission error:', error);
      return false;
    }
  }
  // For non-iOS or older versions, assume permission granted
  return true;
};

/**
 * Check if gyro is supported
 */
export const isGyroSupported = () => {
  return 'DeviceOrientationEvent' in window;
};

/**
 * Detect slope type from angles
 * @param {number} beta - X-axis rotation (-180 to 180)
 * @param {number} gamma - Y-axis rotation (-90 to 90)
 * @param {Object} calibration - Calibration offsets
 * @returns {string} - Slope type
 */
export const detectSlope = (beta, gamma, calibration = { xOffset: 0, yOffset: 0 }) => {
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
export const getSlopeDisplayName = (slope) => {
  const names = {
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
 * @param {Function} callback - Called with slope data
 * @param {Object} calibration - Calibration offsets
 * @returns {Function} - Stop function
 */
export const startGyroMonitoring = (callback, calibration = { xOffset: 0, yOffset: 0 }) => {
  let isActive = true;

  const handleOrientation = (event) => {
    if (!isActive) return;

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

  window.addEventListener('deviceorientation', handleOrientation, true);

  // Return stop function
  return () => {
    isActive = false;
    window.removeEventListener('deviceorientation', handleOrientation, true);
  };
};

/**
 * Calibrate gyro by getting current angles
 * User should place phone on flat surface during calibration
 * @returns {Promise<Object>} - Calibration offsets
 */
export const calibrateGyro = () => {
  return new Promise((resolve, reject) => {
    let sampleCount = 0;
    let totalBeta = 0;
    let totalGamma = 0;
    const samples = 30; // Take 30 samples over ~1 second

    const handleOrientation = (event) => {
      totalBeta += event.beta || 0;
      totalGamma += event.gamma || 0;
      sampleCount++;

      if (sampleCount >= samples) {
        window.removeEventListener('deviceorientation', handleOrientation, true);

        const calibration = {
          xOffset: totalBeta / samples,
          yOffset: totalGamma / samples,
          zOffset: 0,
          timestamp: Date.now(),
        };

        resolve(calibration);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (sampleCount === 0) {
        reject(new Error('No gyro data received'));
      }
    }, 5000);
  });
};

/**
 * Get angle magnitude (for display)
 */
export const getAngleMagnitude = (angle) => {
  return Math.abs(angle).toFixed(1);
};

/**
 * Format angle for display
 */
export const formatAngle = (angle) => {
  return `${angle >= 0 ? '+' : ''}${angle.toFixed(1)}°`;
};
