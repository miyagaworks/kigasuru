/**
 * Utility functions for the golf tracking app
 */

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format date as short string (YYYY/MM/DD)
 */
export const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

/**
 * Get temperature range label
 */
export const getTemperatureLabel = (temp) => {
  const labels = {
    summer: '夏季 (25°C以上)',
    'mid-season': '中間期 (15-25°C)',
    winter: '冬季 (15°C以下)',
  };
  return labels[temp] || temp;
};

/**
 * Get club display name
 */
export const getClubDisplayName = (club) => {
  if (!club) return '';

  // Convert to uppercase for display
  return club.toUpperCase();
};

/**
 * Calculate distance difference percentage
 */
export const calculateDistanceVariance = (actual, average) => {
  if (!average || average === 0) return 0;
  return Math.round(((actual - average) / average) * 100);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
