import { create } from 'zustand';

/**
 * Global state management for the golf tracking app
 */
export const useStore = create((set, get) => ({
  // Current shot being recorded
  currentShot: {
    date: new Date().toISOString(),
    slope: null,
    club: null,
    lie: null,
    strength: null,
    wind: null,
    temperature: null,
    result: null,
    distance: null,
    feeling: null,
    memo: '',
    golfCourse: null,
    actualTemperature: null,
    latitude: null,
    longitude: null,
  },

  // Update current shot field
  updateCurrentShot: (field, value) => {
    set((state) => ({
      currentShot: {
        ...state.currentShot,
        [field]: value,
      },
    }));
  },

  // Set entire current shot (for editing)
  setCurrentShot: (shot) => {
    set({
      currentShot: {
        ...shot,
        date: shot.date || new Date().toISOString(),
      },
    });
  },

  // Reset current shot
  resetCurrentShot: () => {
    set({
      currentShot: {
        date: new Date().toISOString(),
        slope: null,
        club: null,
        lie: null,
        strength: null,
        wind: null,
        temperature: null,
        result: null,
        distance: null,
        feeling: null,
        memo: '',
        golfCourse: null,
        actualTemperature: null,
        latitude: null,
        longitude: null,
      },
    });
  },

  // Load preset into current shot
  loadPreset: (preset) => {
    set((state) => ({
      currentShot: {
        ...state.currentShot,
        slope: preset.slope,
        club: preset.club,
        lie: preset.lie,
        strength: preset.strength,
        wind: preset.wind,
        temperature: preset.temperature,
      },
    }));
  },

  // Gyro sensor state
  gyro: {
    enabled: false,
    calibrated: false,
    slope: null,
    xAngle: 0,
    yAngle: 0,
    zAngle: 0,
  },

  // Update gyro state
  updateGyro: (data) => {
    set((state) => ({
      gyro: {
        ...state.gyro,
        ...data,
      },
    }));
  },

  // Enable/disable gyro
  setGyroEnabled: (enabled) => {
    set((state) => ({
      gyro: {
        ...state.gyro,
        enabled,
      },
    }));
  },

  // Set gyro calibrated
  setGyroCalibrated: (calibrated) => {
    set((state) => ({
      gyro: {
        ...state.gyro,
        calibrated,
      },
    }));
  },

  // UI state
  ui: {
    showGyroOverlay: false,
    showPresetModal: false,
    showAnalysisFilters: false,
  },

  // Toggle UI elements
  toggleUI: (key) => {
    set((state) => ({
      ui: {
        ...state.ui,
        [key]: !state.ui[key],
      },
    }));
  },

  // Set UI element
  setUI: (key, value) => {
    set((state) => ({
      ui: {
        ...state.ui,
        [key]: value,
      },
    }));
  },

  // Get current shot completion percentage
  getShotCompletionPercentage: () => {
    const shot = get().currentShot;
    const requiredFields = ['slope', 'club', 'lie', 'strength', 'wind'];
    const completedFields = requiredFields.filter(field => shot[field] !== null);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  },

  // Check if shot is ready to save
  isShotReadyToSave: () => {
    const shot = get().currentShot;
    const requiredFields = ['slope', 'club', 'lie', 'strength', 'wind'];
    const basicFieldsComplete = requiredFields.every(field => shot[field] !== null);
    // result は {x, y} オブジェクト形式
    const resultComplete = shot.result && typeof shot.result === 'object' && shot.result.x !== undefined && shot.result.y !== undefined;
    return basicFieldsComplete && resultComplete;
  },
}));

export default useStore;
