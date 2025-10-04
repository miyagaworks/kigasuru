import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useStore } from '../store';
import { useGyro } from '../hooks/useGyro';
import { useLocation as useGeoLocation } from '../hooks/useLocation';
import { addShot, getSetting, getShot, updateShot, getAllShots, getTodayManualLocationShots, updateLocationForShots } from '../db';
import { getSlopeDisplayName } from '../sensors/gyro';
import { getWeather, getLocationName } from '../utils/weather';

const DEFAULT_CLUBS = ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'];

// 傾斜選択セグメントの計算を事前に行う
const SLOPE_SEGMENTS = [
  { angle: -112.5, slope: 'left-up' },
  { angle: -67.5, slope: 'left-up-toe-up' },
  { angle: -22.5, slope: 'toe-up' },
  { angle: 22.5, slope: 'left-down-toe-up' },
  { angle: 67.5, slope: 'left-down' },
  { angle: 112.5, slope: 'left-down-toe-down' },
  { angle: 157.5, slope: 'toe-down' },
  { angle: 202.5, slope: 'left-up-toe-down' },
].map(({ angle, slope }) => {
  const startAngle = angle;
  const endAngle = angle + 45;
  const largeArcFlag = 0;
  const outerRadius = 145;
  const innerRadius = 45;
  const centerX = 150;
  const centerY = 150;

  const startOuterX = centerX + outerRadius * Math.cos((startAngle * Math.PI) / 180);
  const startOuterY = centerY + outerRadius * Math.sin((startAngle * Math.PI) / 180);
  const endOuterX = centerX + outerRadius * Math.cos((endAngle * Math.PI) / 180);
  const endOuterY = centerY + outerRadius * Math.sin((endAngle * Math.PI) / 180);

  const startInnerX = centerX + innerRadius * Math.cos((endAngle * Math.PI) / 180);
  const startInnerY = centerY + innerRadius * Math.sin((endAngle * Math.PI) / 180);
  const endInnerX = centerX + innerRadius * Math.cos((startAngle * Math.PI) / 180);
  const endInnerY = centerY + innerRadius * Math.sin((startAngle * Math.PI) / 180);

  const pathData = `
    M ${startOuterX} ${startOuterY}
    A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}
    L ${startInnerX} ${startInnerY}
    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInnerX} ${endInnerY}
    Z
  `;

  return { angle, slope, pathData };
});

// 傾斜アイコンの位置を事前計算
const SLOPE_ICONS = [
  { angle: -90, slope: 'left-up', icon: '/assets/icons/slope/slope-left-up.svg' },
  { angle: 0, slope: 'toe-up', icon: '/assets/icons/slope/slope-toe-up.svg' },
  { angle: 90, slope: 'left-down', icon: '/assets/icons/slope/slope-left-down.svg' },
  { angle: 180, slope: 'toe-down', icon: '/assets/icons/slope/slope-toe-down.svg' },
].map(({ angle, slope, icon }) => {
  const iconSize = 100;
  const iconRadius = 94;
  const iconX = 150 + iconRadius * Math.cos((angle * Math.PI) / 180) - iconSize / 2;
  const iconY = 150 + iconRadius * Math.sin((angle * Math.PI) / 180) - iconSize / 2;

  return { angle, slope, icon, iconX, iconY, iconSize };
});

// 傾斜ラベルの位置を事前計算
const SLOPE_LABELS = [
  { angle: -112.5, slope: 'left-up', label: '左足\n上がり', labelAngle: -81, labelRadius: 110 },
  { angle: -67.5, slope: 'left-up-toe-up', label: '左足上がり\n＋\nつま先上がり', labelAngle: -45, labelRadius: 100 },
  { angle: -22.5, slope: 'toe-up', label: 'つま先\n上がり', labelAngle: 0, labelRadius: 74 },
  { angle: 22.5, slope: 'left-down-toe-up', label: '左足下がり\n＋\nつま先上がり', labelAngle: 45, labelRadius: 100 },
  { angle: 67.5, slope: 'left-down', label: '左足\n下がり', labelAngle: 81, labelRadius: 100 },
  { angle: 112.5, slope: 'left-down-toe-down', label: '左足下がり\n＋\nつま先下がり', labelAngle: 135, labelRadius: 100 },
  { angle: 157.5, slope: 'toe-down', label: 'つま先\n下がり', labelAngle: 178, labelRadius: 74 },
  { angle: 202.5, slope: 'left-up-toe-down', label: '左足上がり\n＋\nつま先下がり', labelAngle: -135, labelRadius: 100 },
].map(({ angle, slope, label, labelAngle, labelRadius }) => {
  const centerX = 150;
  const centerY = 150;
  const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
  const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
  const fontSize = angle % 90 === 0 ? '14' : '11';
  const fontWeight = angle % 90 === 0 ? 'bold' : 'normal';

  return { slope, label, labelX, labelY, fontSize, fontWeight };
});

// 風向きセグメントの計算を事前に行う（レンダリング時の計算を削減）
const WIND_SEGMENTS = [
  { angle: -112.5, direction: 'up' },
  { angle: -67.5, direction: 'up-right' },
  { angle: -22.5, direction: 'right' },
  { angle: 22.5, direction: 'down-right' },
  { angle: 67.5, direction: 'down' },
  { angle: 112.5, direction: 'down-left' },
  { angle: 157.5, direction: 'left' },
  { angle: 202.5, direction: 'up-left' },
].map(({ angle, direction }) => {
  const startAngle = angle;
  const endAngle = angle + 45;
  const largeArcFlag = 0;
  const outerRadius = 145;
  const innerRadius = 60;
  const centerX = 150;
  const centerY = 150;

  const startOuterX = centerX + outerRadius * Math.cos((startAngle * Math.PI) / 180);
  const startOuterY = centerY + outerRadius * Math.sin((startAngle * Math.PI) / 180);
  const endOuterX = centerX + outerRadius * Math.cos((endAngle * Math.PI) / 180);
  const endOuterY = centerY + outerRadius * Math.sin((endAngle * Math.PI) / 180);

  const startInnerX = centerX + innerRadius * Math.cos((endAngle * Math.PI) / 180);
  const startInnerY = centerY + innerRadius * Math.sin((endAngle * Math.PI) / 180);
  const endInnerX = centerX + innerRadius * Math.cos((startAngle * Math.PI) / 180);
  const endInnerY = centerY + innerRadius * Math.sin((startAngle * Math.PI) / 180);

  const pathData = `
    M ${startOuterX} ${startOuterY}
    A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}
    L ${startInnerX} ${startInnerY}
    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInnerX} ${endInnerY}
    Z
  `;

  const arrowRotation = angle + 22.5 + 90;
  const arrowRadius = 102;
  const arrowAngle = angle + 22.5;
  const arrowX = centerX + arrowRadius * Math.cos((arrowAngle * Math.PI) / 180);
  const arrowY = centerY + arrowRadius * Math.sin((arrowAngle * Math.PI) / 180);

  return {
    angle,
    direction,
    pathData,
    arrowX,
    arrowY,
    arrowRotation,
  };
});

// 結果入力ページの位置計算関数（再利用可能）
const calculatePositionFromEvent = (svg, clientX, clientY) => {
  const rect = svg.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  // SVG座標に変換（viewBox: -50 -50 400 400）
  const svgX = (x / rect.width) * 400 - 50;
  const svgY = (y / rect.height) * 400 - 50;

  // 中心からの相対位置を計算（中心は150, 150）
  const centerX = 150;
  const centerY = 150;
  const relX = svgX - centerX;
  const relY = svgY - centerY;

  // ヤード単位に変換（上が飛球方向なのでY軸を反転、70ヤード = 182ピクセル）
  const yardsX = (relX / 182) * 70;
  const yardsY = -(relY / 182) * 70; // 上がプラス（飛球方向）

  // 70yd以内のみ
  const distance = Math.sqrt(yardsX * yardsX + yardsY * yardsY);
  if (distance <= 70) {
    return { x: yardsX, y: yardsY };
  }
  return null;
};

/**
 * Record page - 5-tap shot recording
 * 傾斜 → ライ → クラブ → 強度 → 風向き → 結果 → 保存
 */
export const RecordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [clubs, setClubs] = useState(DEFAULT_CLUBS);
  const [enabledFields, setEnabledFields] = useState({
    slope: true,
    lie: true,
    club: true,
    strength: true,
    wind: true,
    temperature: true,
    feeling: true,
    memo: true,
  });

  const { currentShot, updateCurrentShot, resetCurrentShot, getShotCompletionPercentage, setCurrentShot } = useStore();
  const { gyro, isSupported, hasPermission, startMonitoring, stopMonitoring, requestPermission } = useGyro();
  const { getLocation } = useGeoLocation();

  const [gyroStopFn, setGyroStopFn] = useState(null);
  const [autoCollectStatus, setAutoCollectStatus] = useState({
    weather: null,
    location: null,
    loading: false,
    error: null,
  });
  const [showManualInput, setShowManualInput] = useState(false);
  const [golfCourseHistory, setGolfCourseHistory] = useState([]);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [manualShotsToUpdate, setManualShotsToUpdate] = useState([]);
  const [manualGolfCourse, setManualGolfCourse] = useState('');
  const [manualTemperature, setManualTemperature] = useState('');
  const [manualActualTemp, setManualActualTemp] = useState('');
  const [isNewCourse, setIsNewCourse] = useState(false);

  // Initialize gyro on mount
  useEffect(() => {
    const initGyro = async () => {
      if (isSupported) {
        await requestPermission();
        const stopFn = await startMonitoring();
        if (stopFn) {
          setGyroStopFn(() => stopFn);
        }
      }
    };
    initGyro();

    return () => {
      if (gyroStopFn) {
        stopMonitoring(gyroStopFn);
      }
    };
  }, [isSupported, requestPermission, startMonitoring, gyroStopFn, stopMonitoring]);

  // Load custom clubs and input settings when navigating to this page
  useEffect(() => {
    const loadSettings = async () => {
      const savedClubs = await getSetting('customClubs', DEFAULT_CLUBS);
      setClubs(savedClubs);

      const savedFields = await getSetting('enabledInputFields', {
        slope: true,
        lie: true,
        club: true,
        strength: true,
        wind: true,
        temperature: true,
        feeling: true,
        memo: true,
      });
      setEnabledFields(savedFields);

      // Load golf course history
      const allShots = await getAllShots();
      const uniqueCourses = [...new Set(
        allShots
          .map(shot => shot.golfCourse)
          .filter(course => course && course !== '不明' && course !== 'Unknown Location')
      )].sort();
      setGolfCourseHistory(uniqueCourses);
    };
    if (location.pathname === '/record') {
      loadSettings();
    }
  }, [location.pathname]);

  // Load existing shot data when editing
  useEffect(() => {
    const loadShotForEdit = async () => {
      if (editId) {
        try {
          const shot = await getShot(parseInt(editId));
          if (shot) {
            setCurrentShot(shot);
            // Start at result step (step 6) for editing
            setStep(6);
          }
        } catch (error) {
          console.error('Failed to load shot for editing:', error);
          alert('データの読み込みに失敗しました');
        }
      }
    };
    loadShotForEdit();
  }, [editId, setCurrentShot]);

  // Auto-collect function
  const autoCollect = async () => {
    setAutoCollectStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get location
      const locationData = await getLocation(false);

      // Get weather
      const weatherData = await getWeather(
        locationData.latitude,
        locationData.longitude
      );

      // Get location name
      const locationInfo = await getLocationName(
        locationData.latitude,
        locationData.longitude
      );

      // Update current shot with auto-collected data
      updateCurrentShot('temperature', weatherData.temperatureCategory);
      updateCurrentShot('golfCourse', locationInfo.locationName);
      updateCurrentShot('actualTemperature', weatherData.temperature);
      updateCurrentShot('latitude', locationData.latitude);
      updateCurrentShot('longitude', locationData.longitude);

      setAutoCollectStatus({
        weather: weatherData,
        location: locationInfo,
        loading: false,
        error: null,
      });

      // Check for manual location shots from today and offer to update
      const manualShots = await getTodayManualLocationShots();
      if (manualShots.length > 0 && !editId) {
        setManualShotsToUpdate(manualShots);
        setShowUpdateConfirm(true);
      }
    } catch (error) {
      console.error('Auto-collect failed:', error);
      setAutoCollectStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      // Show manual input form on error
      setShowManualInput(true);
    }
  };

  // Auto-collect location and weather data on mount
  useEffect(() => {
    if (editId) return; // Skip auto-collect when editing
    autoCollect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Handle manual input save
  const handleManualInput = () => {
    if (!manualGolfCourse || !manualTemperature) {
      alert('ゴルフ場と気温を選択してください');
      return;
    }

    // Update current shot with manual data
    updateCurrentShot('golfCourse', manualGolfCourse);
    updateCurrentShot('temperature', manualTemperature);
    updateCurrentShot('actualTemperature', manualActualTemp ? parseFloat(manualActualTemp) : null);
    updateCurrentShot('latitude', null);
    updateCurrentShot('longitude', null);
    updateCurrentShot('manualLocation', true);

    // Hide manual input form
    setShowManualInput(false);
    setAutoCollectStatus(prev => ({
      ...prev,
      error: null,
      weather: { temperatureCategory: manualTemperature },
      location: { locationName: manualGolfCourse },
    }));
  };

  // Handle batch update of manual shots
  const handleUpdateManualShots = async () => {
    try {
      const shotIds = manualShotsToUpdate.map(shot => shot.id);
      await updateLocationForShots(shotIds, {
        golfCourse: currentShot.golfCourse,
        actualTemperature: currentShot.actualTemperature,
        temperature: currentShot.temperature,
        latitude: currentShot.latitude,
        longitude: currentShot.longitude,
      });
      alert(`${shotIds.length}件のショットの位置情報を更新しました`);
      setShowUpdateConfirm(false);
      setManualShotsToUpdate([]);
    } catch (error) {
      console.error('Failed to update manual shots:', error);
      alert('更新に失敗しました');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editId) {
        // Update existing shot
        await updateShot(parseInt(editId), currentShot);
        alert('ショットを更新しました！');
      } else {
        // Create new shot
        await addShot(currentShot);
        alert('ショットを保存しました！');
      }
      resetCurrentShot();
      setStep(1);
      navigate('/');
    } catch (error) {
      console.error('保存失敗:', error);
      alert(`保存に失敗しました: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Count total enabled steps (memoized)
  const totalSteps = useMemo(() => {
    let count = 2; // slope and result are always enabled
    if (enabledFields.lie) count++;
    if (enabledFields.club) count++;
    if (enabledFields.strength) count++;
    if (enabledFields.wind) count++;
    return count;
  }, [enabledFields]);

  // Get current step number (among enabled steps) (memoized)
  const currentStepNumber = useMemo(() => {
    let count = 1;
    if (step >= 2 && enabledFields.lie) count++;
    if (step >= 3 && enabledFields.club) count++;
    if (step >= 4 && enabledFields.strength) count++;
    if (step >= 5 && enabledFields.wind) count++;
    if (step >= 6) count++;
    return count;
  }, [step, enabledFields]);

  // Get next enabled step
  const getNextStep = (currentStep) => {
    const stepFieldMap = {
      1: 'slope',  // always enabled
      2: 'lie',
      3: 'club',
      4: 'strength',
      5: 'wind',
      6: 'result', // always enabled
    };

    for (let nextStep = currentStep + 1; nextStep <= 6; nextStep++) {
      const field = stepFieldMap[nextStep];
      if (!field || field === 'result' || enabledFields[field]) {
        return nextStep;
      }
    }
    return 6; // Default to result step
  };

  // Get previous enabled step
  const getPreviousStep = (currentStep) => {
    const stepFieldMap = {
      1: 'slope',  // always enabled
      2: 'lie',
      3: 'club',
      4: 'strength',
      5: 'wind',
      6: 'result', // always enabled
    };

    for (let prevStep = currentStep - 1; prevStep >= 1; prevStep--) {
      const field = stepFieldMap[prevStep];
      if (!field || field === 'slope' || enabledFields[field]) {
        return prevStep;
      }
    }
    return 1; // Default to slope step
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">1. 傾斜を選択</h2>
              <p className="text-xs text-black">↑ 画面上が飛球方向</p>
            </div>
            {/* 傾斜選択サークル（セグメント型） */}
            <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: '1/1' }}>
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* 8つのセグメント */}
                {SLOPE_SEGMENTS.map(({ slope, pathData }) => {
                  const isActive = currentShot.slope ? (currentShot.slope === slope) : (gyro.slope === slope);

                  return (
                    <g key={slope}>
                      <path
                        d={pathData}
                        fill={isActive ? 'var(--color-primary-green)' : 'var(--color-card-bg)'}
                        opacity={isActive ? '1' : '0.5'}
                        stroke="var(--color-primary-dark)"
                        strokeWidth="2"
                        className="cursor-pointer transition-all hover:opacity-100"
                        onClick={() => {
                          updateCurrentShot('slope', slope);
                          setStep(getNextStep(1));
                        }}
                      />
                    </g>
                  );
                })}

                {/* 中央の円 */}
                <circle
                  cx="150"
                  cy="150"
                  r="45"
                  fill={(currentShot.slope ? (currentShot.slope === 'flat') : (gyro.slope === 'flat')) ? 'var(--color-primary-green)' : 'var(--color-card-bg)'}
                  opacity={(currentShot.slope ? (currentShot.slope === 'flat') : (gyro.slope === 'flat')) ? '1' : '0.5'}
                  stroke="var(--color-primary-dark)"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onClick={() => {
                    updateCurrentShot('slope', 'flat');
                    setStep(getNextStep(1));
                  }}
                />

                {/* 中央のテキスト */}
                <text
                  x="150"
                  y="150"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={(currentShot.slope ? (currentShot.slope === 'flat') : (gyro.slope === 'flat')) ? 'white' : '#212121'}
                  fontSize="12"
                  fontWeight="normal"
                  className="pointer-events-none select-none"
                >
                  平坦
                </text>

                {/* 4つの人間アイコン */}
                {SLOPE_ICONS.map(({ slope, icon, iconX, iconY, iconSize }) => {
                  const isActive = currentShot.slope ? (currentShot.slope === slope) : (gyro.slope === slope);

                  return (
                    <image
                      key={`icon-${slope}`}
                      href={icon}
                      x={iconX}
                      y={iconY}
                      width={iconSize}
                      height={iconSize}
                      opacity={isActive ? '1' : '0.5'}
                      className="pointer-events-none transition-all"
                    />
                  );
                })}

                {/* テキストラベル（最前面） */}
                {SLOPE_LABELS.map(({ slope, label, labelX, labelY, fontSize, fontWeight }) => {
                  const isActive = currentShot.slope ? (currentShot.slope === slope) : (gyro.slope === slope);

                  return (
                    <text
                      key={`label-${slope}`}
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isActive ? 'white' : '#212121'}
                      fontSize={fontSize}
                      fontWeight={fontWeight}
                      className="pointer-events-none select-none"
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {label.split('\n').map((line, i, arr) => (
                        <tspan key={i} x={labelX} dy={i === 0 ? `-${(arr.length - 1) * 0.5}em` : '1em'}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* ジャイロ設定ボタン（許可されていない場合のみ表示） */}
            {!hasPermission && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full bg-[var(--color-primary-green)] text-white border-[var(--color-primary-green)] hover:bg-[var(--color-primary-dark)] flex items-center justify-center gap-2"
                  onClick={() => navigate('/settings')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ジャイロ設定
                </Button>
              </div>
            )}

            {gyro.slope && (
              <div className="relative mt-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-primary-light)] opacity-80 rounded-2xl"></div>
                <div className="relative backdrop-blur-sm bg-white/10 border-2 border-white/30 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/80 mb-1 tracking-wide">ジャイロ検出中</p>
                      <p className="text-xl font-bold text-white tracking-tight">{getSlopeDisplayName(gyro.slope)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">2. ライを選択</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'a-grade', label: 'A級', svg: 'a-grade' },
                { key: 'good', label: '良', svg: 'b-grade' },
                { key: 'normal', label: '普通', svg: 'c-grade' },
                { key: 'bad', label: '悪い', svg: 'buried' },
                { key: 'very-bad', label: '最悪', svg: 'bad' },
                { key: 'bunker', label: 'バンカー', svg: 'bunker' },
              ].map(({ key, label, svg }) => {
                const isSelected = currentShot.lie === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      updateCurrentShot('lie', key);
                      setStep(getNextStep(2));
                    }}
                    className={`relative overflow-hidden rounded-xl p-4 min-h-[115px] flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'bg-[var(--color-primary-green)] text-white shadow-xl'
                        : 'bg-[var(--color-card-bg)] border-2 border-[var(--color-neutral-300)] text-[var(--color-neutral-900)] hover:border-[var(--color-primary-light)] hover:shadow-md'
                    }`}
                  >
                    {/* SVGアイコン */}
                    {isSelected ? (
                      <div
                        className="transition-transform mb-2"
                        style={{
                          width: '100px',
                          height: '70px',
                          WebkitMaskImage: `url(/assets/icons/lie/lie-${svg}.svg)`,
                          maskImage: `url(/assets/icons/lie/lie-${svg}.svg)`,
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          backgroundColor: 'white'
                        }}
                      />
                    ) : (
                      <img
                        src={`/assets/icons/lie/lie-${svg}.svg`}
                        alt={label}
                        className="transition-transform mb-2"
                        style={{
                          width: '100px',
                          height: '70px',
                          objectFit: 'contain'
                        }}
                      />
                    )}
                    {/* テキストラベル */}
                    <span className={`text-base font-bold z-10 ${isSelected ? 'text-white' : 'text-[var(--color-neutral-900)]'}`}>
                      {label}
                    </span>
                    {/* 選択時のチェックマーク */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                        <svg className="w-4 h-4 text-[var(--color-primary-green)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">3. クラブを選択</h2>
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto pb-2">
              {clubs.map((club) => {
                const isSelected = currentShot.club === club;
                return (
                  <button
                    key={club}
                    onClick={() => {
                      updateCurrentShot('club', club);
                      setStep(getNextStep(3));
                    }}
                    className={`relative overflow-hidden rounded-xl p-4 min-h-[80px] flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[var(--color-primary-green)] to-[var(--color-primary-dark)] text-white shadow-lg'
                        : 'bg-[var(--color-card-bg)] border-2 border-[var(--color-neutral-300)] text-[var(--color-neutral-900)] hover:border-[var(--color-primary-light)] hover:shadow-md'
                    }`}
                  >
                    {/* ゴルフクラブアイコン */}
                    <svg
                      className={`w-8 h-8 mb-2 transition-transform ${isSelected ? 'scale-110' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-[var(--color-primary-green)]'}`}>
                      {club}
                    </span>
                    {/* 選択時のチェックマーク */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                        <svg className="w-4 h-4 text-[var(--color-primary-green)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">4. 強度を選択</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'full', label: 'フル', svg: 'full' },
                { key: 'normal', label: '抑えめ', svg: 'normal' },
                { key: 'soft', label: 'ソフト', svg: 'soft' },
              ].map(({ key, label, svg }) => {
                const isSelected = currentShot.strength === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      updateCurrentShot('strength', key);
                      setStep(getNextStep(4));
                    }}
                    className={`relative overflow-hidden rounded-xl p-4 min-h-[125px] flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'bg-[var(--color-primary-green)] text-white shadow-xl'
                        : 'bg-[var(--color-card-bg)] border-2 border-[var(--color-neutral-300)] text-[var(--color-neutral-900)] hover:border-[var(--color-primary-light)] hover:shadow-md'
                    }`}
                  >
                    {/* SVGアイコン */}
                    {isSelected ? (
                      <div
                        className="transition-transform mb-2"
                        style={{
                          width: '120px',
                          height: '90px',
                          WebkitMaskImage: `url(/assets/icons/strength/strength-${svg}.svg)`,
                          maskImage: `url(/assets/icons/strength/strength-${svg}.svg)`,
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          backgroundColor: 'white'
                        }}
                      />
                    ) : (
                      <img
                        src={`/assets/icons/strength/strength-${svg}.svg`}
                        alt={label}
                        className="transition-transform mb-2"
                        style={{
                          width: '120px',
                          height: '90px',
                          objectFit: 'contain'
                        }}
                      />
                    )}
                    {/* テキストラベル */}
                    <span className={`text-base font-bold z-10 ${isSelected ? 'text-white' : 'text-[var(--color-neutral-900)]'}`}>
                      {label}
                    </span>
                    {/* 選択時のチェックマーク */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                        <svg className="w-4 h-4 text-[var(--color-primary-green)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 5: {
        // 風データを解析（最後が'weak'または'strong'の場合は強さ、それ以外は風向き）
        const windParts = (currentShot.wind || '').split('-');
        const windStrength = windParts[windParts.length - 1] === 'weak' || windParts[windParts.length - 1] === 'strong'
          ? windParts[windParts.length - 1]
          : '';
        const windDirection = windStrength
          ? windParts.slice(0, -1).join('-')
          : windParts.join('-');
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">5. 風向き・強さを選択</h2>
              <p className="text-xs text-black">↑ 画面上が飛球方向</p>
            </div>

            {/* 風向き・強さ選択サークル */}
            <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: '1/1' }}>
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* 8方向の風向きセグメント */}
                {WIND_SEGMENTS.map(({ direction, pathData, arrowX, arrowY, arrowRotation }) => {
                  const isActive = windDirection === direction;

                  return (
                    <g key={direction}>
                      <path
                        d={pathData}
                        fill={isActive ? 'var(--color-primary-green)' : 'var(--color-card-bg)'}
                        opacity={isActive ? '1' : '0.5'}
                        stroke="var(--color-primary-dark)"
                        strokeWidth="2"
                        className="cursor-pointer transition-all hover:opacity-100"
                        onClick={() => {
                          // 風向きのみを設定（強弱は中央のボタンで選択）
                          updateCurrentShot('wind', direction);
                        }}
                      />
                      {/* 矢印アイコン */}
                      <foreignObject
                        x={arrowX - 15}
                        y={arrowY - 28}
                        width="26"
                        height="49"
                        transform={`rotate(${arrowRotation}, ${arrowX}, ${arrowY})`}
                        className="pointer-events-none"
                      >
                        <div
                          style={{
                            width: '26px',
                            height: '49px',
                            WebkitMaskImage: 'url(/assets/icons/wind/wind-arrow.svg)',
                            maskImage: 'url(/assets/icons/wind/wind-arrow.svg)',
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center',
                            backgroundColor: isActive ? 'white' : '#286300'
                          }}
                        />
                      </foreignObject>
                    </g>
                  );
                })}

                {/* 中央の円 */}
                {!windDirection || windDirection === 'none' ? (
                  /* 無風選択 */
                  <>
                    <circle
                      cx="150"
                      cy="150"
                      r="60"
                      fill={currentShot.wind === 'none' ? 'var(--color-primary-green)' : 'var(--color-card-bg)'}
                      opacity={currentShot.wind === 'none' ? '1' : '0.5'}
                      stroke="var(--color-primary-dark)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-100"
                      onClick={() => {
                        updateCurrentShot('wind', 'none');
                        setStep(getNextStep(5));
                      }}
                    />
                    <text
                      x="150"
                      y="158"
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="bold"
                      fill={currentShot.wind === 'none' ? 'white' : '#286300'}
                      className="pointer-events-none"
                    >
                      無風
                    </text>
                  </>
                ) : (
                  /* 風向き選択後：弱・強の選択 */
                  <>
                    {/* 上半分：弱い風 */}
                    <path
                      d="M 90 150 A 60 60 0 0 1 210 150 Z"
                      fill={windStrength === 'weak' ? 'var(--color-primary-green)' : 'var(--color-card-bg)'}
                      opacity={windStrength === 'weak' ? '1' : '0.5'}
                      stroke="var(--color-primary-dark)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-100"
                      onClick={() => {
                        updateCurrentShot('wind', `${windDirection}-weak`);
                        setStep(getNextStep(5));
                      }}
                    />
                    {/* 下半分：強い風 */}
                    <path
                      d="M 210 150 A 60 60 0 0 1 90 150 Z"
                      fill={windStrength === 'strong' ? 'var(--color-primary-green)' : 'var(--color-card-bg)'}
                      opacity={windStrength === 'strong' ? '1' : '0.5'}
                      stroke="var(--color-primary-dark)"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:opacity-100"
                      onClick={() => {
                        updateCurrentShot('wind', `${windDirection}-strong`);
                        setStep(getNextStep(5));
                      }}
                    />
                    {/* 中央の横線 */}
                    <line
                      x1="90"
                      y1="150"
                      x2="210"
                      y2="150"
                      stroke="var(--color-primary-dark)"
                      strokeWidth="1"
                    />

                    {/* 弱い風アイコン（上） */}
                    <foreignObject
                      x="110"
                      y="108"
                      width="80"
                      height="33"
                      className="pointer-events-none"
                    >
                      <div
                        style={{
                          width: '80px',
                          height: '33px',
                          WebkitMaskImage: 'url(/assets/icons/wind/wind-weak.svg)',
                          maskImage: 'url(/assets/icons/wind/wind-weak.svg)',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          backgroundColor: windStrength === 'weak' ? 'white' : '#286300'
                        }}
                      />
                    </foreignObject>
                    {/* 強い風アイコン（下） */}
                    <foreignObject
                      x="110"
                      y="159"
                      width="80"
                      height="33"
                      className="pointer-events-none"
                    >
                      <div
                        style={{
                          width: '80px',
                          height: '33px',
                          WebkitMaskImage: 'url(/assets/icons/wind/wind-strong.svg)',
                          maskImage: 'url(/assets/icons/wind/wind-strong.svg)',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          backgroundColor: windStrength === 'strong' ? 'white' : '#286300'
                        }}
                      />
                    </foreignObject>
                  </>
                )}
              </svg>
            </div>

            {/* 風向き選択後：リセットボタン */}
            {windDirection && windDirection !== 'none' && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCurrentShot('wind', '')}
                >
                  リセット
                </Button>
              </div>
            )}

          </div>
        );
      }

      case 6:
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">結果を入力</h2>
              <p className="text-xs text-black">↑ 画面上が飛球方向</p>
            </div>
            <p className="text-sm mb-4">狙った場所を基準に実際の位置をタップしてください</p>

            {/* 円形ターゲットUI */}
            <div className="relative w-full max-w-sm mx-auto mb-6" style={{ aspectRatio: '1/1' }}>
              <svg
                viewBox="-50 -50 400 400"
                className="w-full h-full"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const svg = e.currentTarget;
                  let lastResult = null;

                  const handleMove = (moveEvent) => {
                    lastResult = calculatePositionFromEvent(svg, moveEvent.clientX, moveEvent.clientY);
                  };

                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);

                    if (lastResult) {
                      updateCurrentShot('result', lastResult);
                      updateCurrentShot('missType', null);
                    }
                  };

                  lastResult = calculatePositionFromEvent(svg, e.clientX, e.clientY);
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const svg = e.currentTarget;
                  let lastResult = null;

                  const handleMove = (moveEvent) => {
                    if (moveEvent.touches[0]) {
                      lastResult = calculatePositionFromEvent(svg, moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
                    }
                  };

                  const handleEnd = () => {
                    document.removeEventListener('touchmove', handleMove);
                    document.removeEventListener('touchend', handleEnd);

                    if (lastResult) {
                      updateCurrentShot('result', lastResult);
                      updateCurrentShot('missType', null);
                    }
                  };

                  const touch = e.touches[0];
                  if (touch) {
                    lastResult = calculatePositionFromEvent(svg, touch.clientX, touch.clientY);
                  }
                  document.addEventListener('touchmove', handleMove, { passive: false });
                  document.addEventListener('touchend', handleEnd);
                }}
              >
                {/* 円形の背景（円の内側のみ） */}
                <circle cx="150" cy="150" r="182" fill="var(--color-card-bg)" />

                {/* 同心円（10ヤード刻みで70ヤードまで） */}
                <circle cx="150" cy="150" r="26" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                <circle cx="150" cy="150" r="52" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                <circle cx="150" cy="150" r="78" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                <circle cx="150" cy="150" r="104" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                <circle cx="150" cy="150" r="130" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                <circle cx="150" cy="150" r="156" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.5" />
                <circle cx="150" cy="150" r="182" fill="none" stroke="var(--color-neutral-400)" strokeWidth="2" />

                {/* 十字線 */}
                <line x1="150" y1="-32" x2="150" y2="332" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.3" />
                <line x1="-32" y1="150" x2="332" y2="150" stroke="var(--color-neutral-300)" strokeWidth="1" opacity="0.3" />

                {/* 中心のターゲット（赤い丸） */}
                <circle cx="150" cy="150" r="8" fill="#b31630" />

                {/* ユーザーが選択した位置（緑の丸） */}
                {currentShot.result && currentShot.result.x !== undefined && (
                  <circle
                    cx={150 + (currentShot.result.x / 70) * 182}
                    cy={150 - (currentShot.result.y / 70) * 182}
                    r="10"
                    fill="var(--color-primary-green)"
                  />
                )}

                {/* 距離ラベル（上が飛球方向） */}
                <text x="150" y="128" textAnchor="middle" fontSize="10" fill="var(--color-neutral-600)">10y</text>
                <text x="150" y="102" textAnchor="middle" fontSize="10" fill="var(--color-neutral-600)">20y</text>
                <text x="150" y="76" textAnchor="middle" fontSize="10" fill="var(--color-neutral-600)">30y</text>
                <text x="150" y="50" textAnchor="middle" fontSize="10" fill="var(--color-neutral-600)">40y</text>
                <text x="150" y="24" textAnchor="middle" fontSize="10" fill="var(--color-neutral-600)">50y</text>
                <text x="150" y="-2" textAnchor="middle" fontSize="10" fill="var(--color-neutral-600)">60y</text>
                <text x="150" y="-28" textAnchor="middle" fontSize="10" fill="var(--color-neutral-600)">70y</text>
              </svg>

              {/* 選択位置の表示と取り消しボタン */}
              {currentShot.result && currentShot.result.x !== undefined && (
                <div className="text-center mt-2">
                  <div className="text-sm text-[var(--color-neutral-700)] mb-2">
                    選択位置:
                    {currentShot.result.x > 0 ? ' 右' : currentShot.result.x < 0 ? ' 左' : ''} {Math.abs(currentShot.result.x).toFixed(1)}y
                    {', '}
                    {currentShot.result.y > 0 ? 'オーバー' : currentShot.result.y < 0 ? 'ショート' : 'ジャスト'} {Math.abs(currentShot.result.y).toFixed(1)}y
                  </div>
                  <button
                    onClick={() => updateCurrentShot('result', null)}
                    className="px-4 py-2 bg-[var(--color-neutral-300)] text-[var(--color-neutral-900)] text-sm rounded-lg hover:bg-[var(--color-neutral-400)] transition-colors"
                  >
                    タップを取り消す
                  </button>
                </div>
              )}
            </div>

            {/* ミスショット選択肢 - resultが未設定の場合のみ表示 */}
            {!currentShot.result && (
            <div className="mt-6">
              <h3 className="text-base font-bold mb-3">ミスショット（70yd以外の場合）</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'top', label: 'トップ' },
                  { key: 'choro', label: 'チョロ' },
                  { key: 'duff', label: 'ダフリ' },
                  { key: 'over', label: '大オーバー' },
                  { key: 'shank', label: 'シャンク' },
                  { key: 'pull', label: 'ひっかけ' },
                ].map(({ key, label }) => {
                  const isSelected = currentShot.missType === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        // ミスショットを選択（トグルではなく常に選択）
                        updateCurrentShot('missType', key);
                        // result（位置）をクリア
                        updateCurrentShot('result', null);
                      }}
                      className={`relative overflow-hidden rounded-lg p-3 min-h-[50px] flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'bg-[var(--color-secondary-red)] text-white shadow-lg'
                          : 'bg-[var(--color-card-bg)] border-2 border-[var(--color-neutral-300)] text-[var(--color-neutral-900)] hover:border-[var(--color-secondary-red)] hover:shadow-md'
                      }`}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[var(--color-neutral-900)]'}`}>
                        {label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                          <svg className="w-3 h-3 text-[var(--color-secondary-red)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* ミスショット選択時の取り消しボタン */}
            {currentShot.missType && (
              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--color-neutral-700)] mb-2">
                  選択中: <span className="font-bold text-[var(--color-secondary-red)]">
                    {
                      {
                        'top': 'トップ',
                        'choro': 'チョロ',
                        'duff': 'ダフリ',
                        'over': '大オーバー',
                        'shank': 'シャンク',
                        'pull': 'ひっかけ',
                      }[currentShot.missType]
                    }
                  </span>
                </p>
                <button
                  onClick={() => updateCurrentShot('missType', null)}
                  className="px-4 py-2 bg-[var(--color-neutral-300)] text-[var(--color-neutral-900)] text-sm rounded-lg hover:bg-[var(--color-neutral-400)] transition-colors"
                >
                  ミスショット選択を取り消す
                </button>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ターゲット距離 (Yd)</label>
                <input
                  type="number"
                  value={currentShot.distance || ''}
                  onChange={(e) => updateCurrentShot('distance', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg bg-[var(--color-card-bg)]"
                  placeholder="150"
                />
              </div>

              {enabledFields.feeling && (
                <div>
                  <label className="block text-sm font-medium mb-2">感触</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { key: 'great', label: '最高', emoji: '😄' },
                      { key: 'good', label: '良い', emoji: '🙂' },
                      { key: 'normal', label: '普通', emoji: '😐' },
                      { key: 'bad', label: '悪い', emoji: '😞' },
                      { key: 'unsure', label: '?', emoji: '🤔' },
                    ].map(({ key, label, emoji }) => (
                      <Button
                        key={key}
                        variant={currentShot.feeling === key ? 'primary' : 'outline'}
                        onClick={() => updateCurrentShot('feeling', key)}
                        size="sm"
                        className="flex flex-col items-center gap-1 p-2"
                      >
                        <span className="text-lg">{emoji}</span>
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {enabledFields.memo && (
                <div>
                  <label className="block text-sm font-medium mb-2">メモ</label>
                  <textarea
                    value={currentShot.memo || ''}
                    onChange={(e) => updateCurrentShot('memo', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg bg-[var(--color-card-bg)] resize-none"
                    placeholder="ショットの詳細やメモを入力..."
                    rows={3}
                  />
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={(!currentShot.result && !currentShot.missType) || isSaving}
                className="w-full"
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Auto-collected info */}
        {autoCollectStatus.loading ? (
          <div className="mb-4 p-3 bg-[var(--color-info-bg)] rounded-lg border border-[var(--color-info-border)] flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--color-info-text)] border-t-transparent"></div>
            <p className="text-sm text-[var(--color-info-text)]">位置情報と天気を取得中...</p>
          </div>
        ) : autoCollectStatus.error ? (
          <>
            <div className="mb-4 p-3 bg-[var(--color-error-bg)] rounded-lg border border-[var(--color-error-border)]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-base font-medium text-[var(--color-error-text)] mb-1">
                    自動収集に失敗しました
                  </p>
                  <p className="text-xs text-[var(--color-error-text)]">
                    {autoCollectStatus.error}
                  </p>
                </div>
                <button
                  onClick={() => autoCollect()}
                  className="ml-3 px-3 py-1 bg-[var(--color-secondary-red)] text-white text-xs rounded hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  再取得
                </button>
              </div>
            </div>

            {/* Manual input form */}
            {showManualInput && (
              <div className="mb-4 p-4 bg-[var(--color-card-bg)] rounded-lg border-2 border-[var(--color-primary-green)]">
                <h3 className="text-lg font-bold mb-4 text-[var(--color-primary-green)]">
                  手動入力
                </h3>

                {/* Golf course selection */}
                <div className="mb-4">
                  <label className="block text-base font-bold mb-2">ゴルフ場</label>
                  {!isNewCourse ? (
                    <>
                      <select
                        value={manualGolfCourse}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '__new__') {
                            setIsNewCourse(true);
                            setManualGolfCourse('');
                          } else {
                            setManualGolfCourse(value);
                          }
                        }}
                        className="w-full px-4 py-3 text-base border-2 border-[var(--color-neutral-300)] rounded-lg bg-white"
                      >
                        <option value="">選択してください</option>
                        {golfCourseHistory.map((course) => (
                          <option key={course} value={course}>
                            {course}
                          </option>
                        ))}
                        <option value="__new__">+ 新しいゴルフ場を入力</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={manualGolfCourse}
                        onChange={(e) => setManualGolfCourse(e.target.value)}
                        placeholder="ゴルフ場名を入力"
                        className="w-full px-4 py-3 text-base border-2 border-[var(--color-neutral-300)] rounded-lg bg-white"
                      />
                      <button
                        onClick={() => {
                          setIsNewCourse(false);
                          setManualGolfCourse('');
                        }}
                        className="mt-2 text-base text-[var(--color-primary-green)] hover:underline font-medium"
                      >
                        ← 履歴から選択
                      </button>
                    </>
                  )}
                </div>

                {/* Temperature category selection */}
                <div className="mb-4">
                  <label className="block text-base font-bold mb-2">気温カテゴリ</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'summer', label: '夏季', desc: '25°C以上' },
                      { key: 'mid-season', label: '中間期', desc: '15-25°C' },
                      { key: 'winter', label: '冬季', desc: '15°C以下' },
                    ].map(({ key, label, desc }) => (
                      <button
                        key={key}
                        onClick={() => setManualTemperature(key)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          manualTemperature === key
                            ? 'bg-[var(--color-primary-green)] text-white border-[var(--color-primary-green)]'
                            : 'bg-white border-[var(--color-neutral-300)] hover:border-[var(--color-primary-light)]'
                        }`}
                      >
                        <div className="text-base font-bold">{label}</div>
                        <div className="text-sm mt-1 opacity-80">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional: actual temperature input */}
                <div className="mb-4">
                  <label className="block text-base font-bold mb-2">実際の気温（オプション）</label>
                  <input
                    type="number"
                    value={manualActualTemp}
                    onChange={(e) => setManualActualTemp(e.target.value)}
                    placeholder="例: 20"
                    className="w-full px-4 py-3 text-base border-2 border-[var(--color-neutral-300)] rounded-lg bg-white"
                  />
                </div>

                {/* Save button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleManualInput}
                    className="flex-1 px-4 py-3 text-base bg-[var(--color-primary-green)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setIsNewCourse(false);
                      setManualGolfCourse('');
                      setManualTemperature('');
                      setManualActualTemp('');
                    }}
                    className="px-4 py-3 text-base bg-[var(--color-neutral-300)] text-[var(--color-neutral-900)] font-bold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </>
        ) : autoCollectStatus.weather && autoCollectStatus.location ? (
          <div className="mb-4 p-3 bg-[var(--color-success-bg)] rounded-lg border border-[var(--color-success-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-[var(--color-success-text)]">ゴルフ場</p>
                  <p className="text-sm font-medium text-[var(--color-success-text)]">
                    {currentShot.golfCourse || "不明"}
                  </p>
                </div>
                <div className="border-l border-[var(--color-success-border)] pl-3">
                  <p className="text-xs text-[var(--color-success-text)]">気温</p>
                  <p className="text-sm font-medium text-[var(--color-success-text)]">
                    {currentShot.actualTemperature
                      ? `${currentShot.actualTemperature}°C`
                      : "-"}
                    {currentShot.temperature && (
                      <span className="text-xs ml-1">
                        (
                        {currentShot.temperature === "summer"
                          ? "夏季"
                          : currentShot.temperature === "mid-season"
                          ? "中間期"
                          : "冬季"}
                        )
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => autoCollect()}
                className="ml-3 px-3 py-1 bg-[var(--color-primary-green)] text-white text-xs rounded hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                再取得
              </button>
            </div>
          </div>
        ) : null}

        {/* Batch update confirmation dialog */}
        {showUpdateConfirm && manualShotsToUpdate.length > 0 && (
          <div className="mb-4 p-4 bg-[var(--color-info-bg)] rounded-lg border-2 border-[var(--color-info-border)]">
            <h3 className="text-lg font-bold mb-3 text-[var(--color-info-text)]">
              位置情報の更新
            </h3>
            <p className="text-base text-[var(--color-info-text)] mb-4 leading-relaxed">
              本日の手動入力ショット（{manualShotsToUpdate.length}件）が見つかりました。
              現在の位置情報で更新しますか？
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateManualShots}
                className="flex-1 px-4 py-3 text-base bg-[var(--color-primary-green)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                更新する
              </button>
              <button
                onClick={() => {
                  setShowUpdateConfirm(false);
                  setManualShotsToUpdate([]);
                }}
                className="px-4 py-3 text-base bg-[var(--color-neutral-300)] text-[var(--color-neutral-900)] font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                スキップ
              </button>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">ステップ {currentStepNumber} / {totalSteps}</span>
            <span className="text-sm text-[var(--color-neutral-600)]">
              {getShotCompletionPercentage()}%
            </span>
          </div>
          <div className="h-2 bg-[#b9d58f] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary-green)] transition-all duration-300"
              style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        {renderStepContent()}

        {/* Navigation buttons */}
        {step > 1 && step < 7 && (
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(getPreviousStep(step))}
              className="flex-1"
            >
              戻る
            </Button>
            {(step === 5
              ? // 風の場合：無風 または 強弱が選択されている場合のみ次へ表示
                currentShot.wind === "none" ||
                (currentShot.wind &&
                  (currentShot.wind.includes("-weak") ||
                    currentShot.wind.includes("-strong")))
              : // その他：該当フィールドが選択されていれば次へ表示
                currentShot[
                  ["slope", "lie", "club", "strength", "wind"][step - 1]
                ]) && (
              <Button
                variant="primary"
                onClick={() => setStep(getNextStep(step))}
                className="flex-1"
              >
                次へ
              </Button>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
};
