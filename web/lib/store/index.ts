import { create } from 'zustand';

export interface CurrentShot {
  date: string;
  slope: string | null;
  club: string | null;
  lie: string | null;
  strength: string | null;
  wind: string | null;
  temperature: string | null;
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
}

export interface GyroState {
  enabled: boolean;
  calibrated: boolean;
  slope: string | null;
  xAngle: number;
  yAngle: number;
  zAngle: number;
}

export interface UIState {
  showGyroOverlay: boolean;
  showPresetModal: boolean;
  showAnalysisFilters: boolean;
}

interface StoreState {
  currentShot: CurrentShot;
  gyro: GyroState;
  ui: UIState;

  updateCurrentShot: (field: keyof CurrentShot, value: unknown) => void;
  setCurrentShot: (shot: Partial<CurrentShot>) => void;
  resetCurrentShot: () => void;
  loadPreset: (preset: Partial<CurrentShot>) => void;

  updateGyro: (data: Partial<GyroState>) => void;
  setGyroEnabled: (enabled: boolean) => void;
  setGyroCalibrated: (calibrated: boolean) => void;

  toggleUI: (key: keyof UIState) => void;
  setUI: (key: keyof UIState, value: boolean) => void;

  getShotCompletionPercentage: () => number;
  isShotReadyToSave: () => boolean;
}

const initialCurrentShot: CurrentShot = {
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
  missType: null,
  manualLocation: false,
};

export const useStore = create<StoreState>((set, get) => ({
  currentShot: initialCurrentShot,

  gyro: {
    enabled: false,
    calibrated: false,
    slope: null,
    xAngle: 0,
    yAngle: 0,
    zAngle: 0,
  },

  ui: {
    showGyroOverlay: false,
    showPresetModal: false,
    showAnalysisFilters: false,
  },

  updateCurrentShot: (field, value) => {
    set((state) => ({
      currentShot: {
        ...state.currentShot,
        [field]: value,
      },
    }));
  },

  setCurrentShot: (shot) => {
    set({
      currentShot: {
        ...initialCurrentShot,
        ...shot,
        date: shot.date || new Date().toISOString(),
      },
    });
  },

  resetCurrentShot: () => {
    set({
      currentShot: {
        ...initialCurrentShot,
        date: new Date().toISOString(),
      },
    });
  },

  loadPreset: (preset) => {
    set((state) => ({
      currentShot: {
        ...state.currentShot,
        slope: preset.slope || state.currentShot.slope,
        club: preset.club || state.currentShot.club,
        lie: preset.lie || state.currentShot.lie,
        strength: preset.strength || state.currentShot.strength,
        wind: preset.wind || state.currentShot.wind,
        temperature: preset.temperature || state.currentShot.temperature,
      },
    }));
  },

  updateGyro: (data) => {
    set((state) => ({
      gyro: {
        ...state.gyro,
        ...data,
      },
    }));
  },

  setGyroEnabled: (enabled) => {
    set((state) => ({
      gyro: {
        ...state.gyro,
        enabled,
      },
    }));
  },

  setGyroCalibrated: (calibrated) => {
    set((state) => ({
      gyro: {
        ...state.gyro,
        calibrated,
      },
    }));
  },

  toggleUI: (key) => {
    set((state) => ({
      ui: {
        ...state.ui,
        [key]: !state.ui[key],
      },
    }));
  },

  setUI: (key, value) => {
    set((state) => ({
      ui: {
        ...state.ui,
        [key]: value,
      },
    }));
  },

  getShotCompletionPercentage: () => {
    const shot = get().currentShot;
    const requiredFields: (keyof CurrentShot)[] = ['slope', 'club', 'lie', 'strength', 'wind'];
    const completedFields = requiredFields.filter(field => shot[field] !== null);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  },

  isShotReadyToSave: () => {
    const shot = get().currentShot;
    const requiredFields: (keyof CurrentShot)[] = ['slope', 'club', 'lie', 'strength', 'wind'];
    const basicFieldsComplete = requiredFields.every(field => shot[field] !== null);
    const resultComplete = shot.result && typeof shot.result === 'object' &&
      shot.result.x !== undefined && shot.result.y !== undefined;
    return basicFieldsComplete && (resultComplete || shot.missType !== null);
  },
}));

export default useStore;
