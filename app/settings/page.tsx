'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useGyro } from '@/hooks/useGyro';
import { addShot, getSetting, saveSetting, getAllShots, clearAllData } from '@/lib/db';
import { setFlatThreshold } from '@/lib/sensors/gyro';

/**
 * Settings page - App configuration and gyro calibration
 */
const DEFAULT_CLUBS = ['DR', '3W', '5W', '7W', 'U4', 'U5', '5I', '6I', '7I', '8I', '9I', 'PW', '50', '52', '54', '56', '58'];

type InputFieldsConfig = {
  slope: boolean;
  lie: boolean;
  club: boolean;
  strength: boolean;
  wind: boolean;
  temperature: boolean;
  feeling: boolean;
  memo: boolean;
};

interface ClubItemProps {
  club: string;
  index: number;
  totalClubs: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

// Club item component for optimized rendering
const ClubItem = React.memo(({ club, index, totalClubs, onMoveUp, onMoveDown, onRemove }: ClubItemProps) => {
  const isFirst = index === 0;
  const isLast = index === totalClubs - 1;

  const buttonBaseClass = "min-w-[48px] min-h-[48px] flex items-center justify-center text-xl font-bold rounded-lg";
  const disabledClass = "bg-[var(--color-neutral-200)] text-[var(--color-neutral-400)] cursor-not-allowed";
  const enabledClass = "bg-[var(--color-card-bg)] text-[var(--color-primary-green)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)]";

  return (
    <div className="flex items-center justify-between bg-[var(--color-neutral-100)] rounded-lg p-4">
      <span className="font-bold text-lg">{club}</span>
      <div className="flex gap-2">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className={`${buttonBaseClass} ${isFirst ? disabledClass : enabledClass}`}
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className={`${buttonBaseClass} ${isLast ? disabledClass : enabledClass}`}
        >
          ↓
        </button>
        <button
          onClick={onRemove}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center text-sm font-bold text-white bg-[var(--color-secondary-red)] hover:opacity-90 active:opacity-80 rounded-lg"
        >
          削除
        </button>
      </div>
    </div>
  );
});

ClubItem.displayName = 'ClubItem';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { isSupported, hasPermission, isCalibrating, gyro, requestPermission, calibrate } = useGyro();
  const [calibrationStatus, setCalibrationStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [threshold, setThreshold] = useState(2);
  const [clubs, setClubs] = useState(DEFAULT_CLUBS);
  const [showClubDialog, setShowClubDialog] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [inputLevel, setInputLevel] = useState('advanced');
  const [customInputFields, setCustomInputFields] = useState({
    slope: true,
    lie: true,
    club: true,
    strength: true,
    wind: true,
    temperature: true,
    feeling: true,
    memo: true,
  });

  // Debounce timer for threshold changes
  const thresholdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Input level presets - memoized to avoid dependency issues
  const INPUT_LEVEL_PRESETS = useMemo(() => ({
    beginner: {
      label: '初心者',
      description: '最小限の入力（傾斜、クラブ、結果のみ）',
      fields: { slope: true, lie: false, club: true, strength: false, wind: false, temperature: false, feeling: false, memo: false },
    },
    intermediate: {
      label: '中級者',
      description: '基本的な入力（傾斜、クラブ、ライ、強度、結果）',
      fields: { slope: true, lie: true, club: true, strength: true, wind: false, temperature: false, feeling: false, memo: false },
    },
    advanced: {
      label: '上級者',
      description: 'すべての項目を入力',
      fields: { slope: true, lie: true, club: true, strength: true, wind: true, temperature: true, feeling: true, memo: true },
    },
    custom: {
      label: 'カスタム',
      description: '自分で選択',
      fields: customInputFields,
    },
  }), [customInputFields]);

  const loadThreshold = async () => {
    const saved = (await getSetting<number>('flatThreshold', 2)) ?? 2;
    setThreshold(saved);
    setFlatThreshold(saved);
  };

  const loadClubs = async () => {
    const saved = (await getSetting<string[]>('customClubs', DEFAULT_CLUBS)) ?? DEFAULT_CLUBS;
    setClubs(saved);
  };

  const loadInputSettings = async () => {
    console.log('[Settings] Loading input settings... User ID:', session?.user?.id);
    const savedLevel = (await getSetting<string>('inputLevel', 'advanced')) ?? 'advanced';
    const savedFields = (await getSetting<InputFieldsConfig>('customInputFields', INPUT_LEVEL_PRESETS.advanced.fields)) ?? INPUT_LEVEL_PRESETS.advanced.fields;
    console.log('[Settings] Loaded from IndexedDB - inputLevel:', savedLevel, 'customInputFields:', savedFields);
    setInputLevel(savedLevel);
    setCustomInputFields(savedFields);
  };

  // Load threshold, clubs, and input settings on mount (wait for session)
  useEffect(() => {
    if (session?.user?.id) {
      console.log('[Settings] Session ready, loading settings for user:', session.user.id);
      Promise.all([
        loadThreshold().catch(err => console.error('[Settings] Failed to load threshold:', err)),
        loadClubs().catch(err => console.error('[Settings] Failed to load clubs:', err)),
        loadInputSettings().catch(err => console.error('[Settings] Failed to load input settings:', err)),
      ]).then(() => {
        console.log('[Settings] All settings loaded successfully');
      }).catch(err => {
        console.error('[Settings] Error loading settings:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // 設定ページを訪れたことを記録（セッションが利用可能になってから）
  useEffect(() => {
    if (session?.user?.id) {
      console.log('[Settings] Recording settings visit for user:', session.user.id);
      saveSetting('settingsVisited', true);
    }
  }, [session?.user?.id]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (thresholdTimerRef.current) {
        clearTimeout(thresholdTimerRef.current);
      }
    };
  }, []);

  // Scroll to input settings section if hash is present
  useEffect(() => {
    if (window.location.hash === '#input-settings') {
      setTimeout(() => {
        const element = document.getElementById('input-settings');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  const handleInputLevelChange = useCallback(async (level: string) => {
    console.log('[Settings] Changing input level to:', level, 'User ID:', session?.user?.id);
    setInputLevel(level);
    await saveSetting('inputLevel', level);
    console.log('[Settings] Saved inputLevel to IndexedDB');
    if (level !== 'custom') {
      const fields = INPUT_LEVEL_PRESETS[level as keyof typeof INPUT_LEVEL_PRESETS].fields;
      setCustomInputFields(fields);
      await saveSetting('customInputFields', fields);
      await saveSetting('enabledInputFields', fields);
      console.log('[Settings] Saved customInputFields and enabledInputFields to IndexedDB');
    }
  }, [INPUT_LEVEL_PRESETS, session?.user?.id]);

  const handleCustomFieldToggle = useCallback(async (field: keyof InputFieldsConfig) => {
    setCustomInputFields(prev => {
      const newFields = {
        ...prev,
        [field]: !prev[field],
      };
      // Save in background
      saveSetting('customInputFields', newFields);
      saveSetting('enabledInputFields', newFields);
      return newFields;
    });
  }, []);

  const handleThresholdChange = useCallback((value: number) => {
    // Update UI immediately
    setThreshold(value);
    setFlatThreshold(value);

    // Debounce DB save
    if (thresholdTimerRef.current) {
      clearTimeout(thresholdTimerRef.current);
    }
    thresholdTimerRef.current = setTimeout(async () => {
      await saveSetting('flatThreshold', value);
    }, 500);
  }, []);

  const handleCalibrate = async () => {
    setCalibrationStatus('キャリブレーション中...');
    try {
      await calibrate();
      setCalibrationStatus('キャリブレーション完了！');
      setTimeout(() => setCalibrationStatus(''), 3000);
    } catch {
      setCalibrationStatus('キャリブレーション失敗');
      setTimeout(() => setCalibrationStatus(''), 3000);
    }
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('インポート中...');
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setImportStatus('ファイルが空です');
        setTimeout(() => setImportStatus(''), 3000);
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      let importedCount = 0;
      let skippedCount = 0;

      for (const line of dataLines) {
        try {
          // Parse CSV line (handle quoted fields with commas)
          const values: string[] = [];
          let currentValue = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                currentValue += '"';
                i++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue);
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue); // Add last value

          // Parse result field (x:1.5 y:2.0 format)
          const resultStr = values[8] || '';
          let result = { x: 0, y: 0 };
          const xMatch = resultStr.match(/x:([-\d.]+)/);
          const yMatch = resultStr.match(/y:([-\d.]+)/);
          if (xMatch && yMatch) {
            result = {
              x: parseFloat(xMatch[1]),
              y: parseFloat(yMatch[1]),
            };
          }

          const shotData = {
            date: values[1] || new Date().toISOString(),
            slope: values[2] || '',
            club: values[3] || '',
            lie: values[4] || '',
            strength: values[5] || '',
            wind: values[6] || '',
            temperature: values[7] || '',
            result,
            distance: values[9] ? parseInt(values[9]) : undefined,
            feeling: values[10] || '',
            memo: values[11]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          };

          // Only import if club is specified
          if (shotData.club) {
            await addShot(shotData);
            importedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error('Error parsing line:', error);
          skippedCount++;
        }
      }

      setImportStatus(`インポート完了！ (${importedCount}件追加、${skippedCount}件スキップ)`);
      setTimeout(() => setImportStatus(''), 5000);
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('インポート失敗');
      setTimeout(() => setImportStatus(''), 3000);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleResetData = async () => {
    if (!confirm('全てのショット記録とプリセットを削除します。本当によろしいですか？\n\n※設定とセンサーキャリブレーションは保持されます')) {
      return;
    }

    setResetStatus('データ削除中...');
    try {
      await clearAllData();
      setResetStatus('データ削除完了！');
      setTimeout(() => {
        setResetStatus('');
        window.location.reload(); // ページをリロードして表示を更新
      }, 2000);
    } catch (_error) {
      console.error('Reset error:', _error);
      setResetStatus('データ削除失敗');
      setTimeout(() => setResetStatus(''), 3000);
    }
  };

  const handleAddClub = async () => {
    if (!newClubName.trim()) {
      alert('クラブ名を入力してください');
      return;
    }

    const newClubs = [...clubs, newClubName.trim()];
    setClubs(newClubs);
    setNewClubName('');
    setShowClubDialog(false);

    // バックグラウンドで保存
    await saveSetting('customClubs', newClubs);
  };

  const handleRemoveClub = useCallback(async (index: number) => {
    setClubs(prevClubs => {
      const newClubs = prevClubs.filter((club, i) => i !== index);
      // Save in background
      saveSetting('customClubs', newClubs);
      return newClubs;
    });
  }, []);

  const handleMoveClub = useCallback(async (index: number, direction: 'up' | 'down') => {
    setClubs(prevClubs => {
      const newClubs = [...prevClubs];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newClubs.length) return prevClubs;

      [newClubs[index], newClubs[targetIndex]] = [newClubs[targetIndex], newClubs[index]];

      // Save in background
      saveSetting('customClubs', newClubs);

      return newClubs;
    });
  }, []);

  const handleResetClubs = async () => {
    if (confirm('クラブリストをデフォルトに戻しますか？')) {
      setClubs(DEFAULT_CLUBS);
      await saveSetting('customClubs', DEFAULT_CLUBS);
    }
  };

  // Get current input fields display
  const getCurrentInputFieldsDisplay = () => {
    if (inputLevel === 'custom') return null;

    const labels = {
      slope: '傾斜',
      lie: 'ライ',
      club: 'クラブ',
      strength: '強度',
      wind: '風向き',
      temperature: '気温',
      memo: 'メモ'
    };

    return Object.entries(INPUT_LEVEL_PRESETS[inputLevel as keyof typeof INPUT_LEVEL_PRESETS].fields)
      .filter(([, enabled]) => enabled)
      .map(([key]) => labels[key as keyof typeof labels])
      .join('、');
  };

  const handleExportCSV = async () => {
    setExportStatus('エクスポート中...');
    try {
      const shots = await getAllShots();

      if (shots.length === 0) {
        setExportStatus('データがありません');
        setTimeout(() => setExportStatus(''), 3000);
        return;
      }

      // CSVヘッダー
      const headers = [
        'ID',
        '日時',
        '傾斜',
        'クラブ',
        'ライ',
        '強度',
        '風向き',
        '気温',
        '結果',
        '飛距離',
        'メモ',
      ];

      // CSVデータ生成
      const csvRows = [headers.join(',')];

      shots.forEach(shot => {
        const resultStr = shot.result && typeof shot.result === 'object'
          ? `x:${shot.result.x.toFixed(1)} y:${shot.result.y.toFixed(1)}`
          : (shot.result || '');

        const row = [
          shot.id || '',
          shot.date || '',
          shot.slope || '',
          shot.club || '',
          shot.lie || '',
          shot.strength || '',
          shot.wind || '',
          shot.temperature || '',
          resultStr,
          shot.distance || '',
          `"${(shot.memo || '').replace(/"/g, '""')}"`, // メモはエスケープ
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // BOM付きUTF-8でダウンロード（Excelで正しく開けるように）
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // ダウンロード
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `kigasuru_shots_${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setExportStatus('エクスポート完了！');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (_error) {
      console.error('Export error:', _error);
      setExportStatus('エクスポート失敗');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-6 flex items-center gap-2">
          <Icon category="ui" name="settings" size={28} />
          設定
        </h1>

        {/* Gyro sensor settings */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">
            ジャイロセンサー
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">対応状況</span>
              <span className={`font-medium ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                {isSupported ? '対応' : '非対応'}
              </span>
            </div>

            {isSupported && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm">許可状態</span>
                  <span className={`font-medium ${hasPermission ? 'text-green-600' : 'text-orange-600'}`}>
                    {hasPermission ? '許可済み' : '未許可'}
                  </span>
                </div>

                {!hasPermission && (
                  <Button
                    variant="primary"
                    onClick={handleRequestPermission}
                    className="w-full"
                  >
                    センサーの許可をリクエスト
                  </Button>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm">キャリブレーション</span>
                  <span className={`font-medium ${gyro.calibrated ? 'text-green-600' : 'text-orange-600'}`}>
                    {gyro.calibrated ? '完了' : '未実施'}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleCalibrate}
                  disabled={isCalibrating}
                  className="w-full"
                >
                  {isCalibrating ? 'キャリブレーション中...' : 'キャリブレーション実行'}
                </Button>

                {calibrationStatus && (
                  <div className={`text-center text-sm ${
                    calibrationStatus.includes('完了') ? 'text-green-600' :
                    calibrationStatus.includes('失敗') ? 'text-red-600' :
                    'text-[var(--color-neutral-600)]'
                  }`}>
                    {calibrationStatus}
                  </div>
                )}

                <div className="bg-[var(--color-info-bg)] p-4 rounded-lg border border-[var(--color-info-border)] mt-4">
                  <p className="text-sm text-[var(--color-info-text)]">
                    💡 キャリブレーションのヒント
                  </p>
                  <p className="text-xs text-[var(--color-info-text)] mt-2 text-justify">
                    スマホを平らな場所に置いて実行してください。精度が向上します。
                  </p>
                </div>

                {/* Threshold setting */}
                <div className="mt-6 pt-6 border-t border-[var(--color-neutral-200)]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">平坦検出しきい値</span>
                    <span className="text-sm font-bold text-[var(--color-primary-green)]">
                      ±{threshold.toFixed(1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={threshold}
                    onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-neutral-300)] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[var(--color-neutral-600)] mt-1">
                    <span>0.5°</span>
                    <span>5.0°</span>
                  </div>
                  <p className="text-xs text-[var(--color-neutral-600)] mt-3 text-justify">
                    この範囲内の傾きを「平坦」として検出します。値が大きいほど平坦判定が緩くなります。
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Input Settings Section */}
        <div id="input-settings" className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">入力項目設定</h2>
          <p className="text-sm text-[var(--color-neutral-600)] mb-4">
            記録時に入力する項目を選択できます。レベルに合わせた推奨設定、またはカスタム設定が可能です。
          </p>

          {/* Level selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {Object.entries(INPUT_LEVEL_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleInputLevelChange(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inputLevel === key
                    ? 'border-[var(--color-primary-green)] bg-[var(--color-success-bg)]'
                    : 'border-[var(--color-neutral-300)] bg-[var(--color-card-bg)] hover:border-[var(--color-neutral-400)]'
                }`}
              >
                <div className="font-bold text-[var(--color-neutral-900)] mb-1">{preset.label}</div>
                <div className="text-xs text-[var(--color-neutral-600)]">{preset.description}</div>
              </button>
            ))}
          </div>

          {/* Custom field selection */}
          {inputLevel === 'custom' && (
            <div className="border border-[var(--color-neutral-300)] rounded-lg p-4 bg-[var(--color-neutral-100)]">
              <h3 className="text-sm font-bold mb-3">カスタム入力項目</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'slope' as keyof InputFieldsConfig, label: '傾斜' },
                  { key: 'lie' as keyof InputFieldsConfig, label: 'ライ' },
                  { key: 'club' as keyof InputFieldsConfig, label: 'クラブ' },
                  { key: 'strength' as keyof InputFieldsConfig, label: '強度' },
                  { key: 'wind' as keyof InputFieldsConfig, label: '風向き' },
                  { key: 'temperature' as keyof InputFieldsConfig, label: '気温' },
                  { key: 'memo' as keyof InputFieldsConfig, label: 'メモ' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customInputFields[key]}
                      onChange={() => handleCustomFieldToggle(key)}
                      className="w-4 h-4 text-[var(--color-primary-green)] rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Current settings display */}
          {inputLevel !== 'custom' && getCurrentInputFieldsDisplay() && (
            <div className="bg-[var(--color-info-bg)] p-3 rounded-lg border border-[var(--color-info-border)]">
              <p className="text-xs text-[var(--color-info-text)]">
                💡 現在の入力項目: {getCurrentInputFieldsDisplay()}、結果
              </p>
            </div>
          )}
        </div>

        {/* Club management */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">クラブ管理</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetClubs}
              >
                リセット
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowClubDialog(true)}
              >
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {clubs.map((club, index) => (
              <ClubItem
                key={index}
                club={club}
                index={index}
                totalClubs={clubs.length}
                onMoveUp={() => handleMoveClub(index, 'up')}
                onMoveDown={() => handleMoveClub(index, 'down')}
                onRemove={() => handleRemoveClub(index)}
              />
            ))}
          </div>

          <div className="mt-4 bg-[var(--color-info-bg)] p-3 rounded-lg border border-[var(--color-info-border)]">
            <p className="text-xs text-[var(--color-info-text)]">
              💡 クラブ管理のヒント
            </p>
            <ul className="text-xs text-[var(--color-info-text)] mt-2 space-y-1 list-disc list-inside text-justify">
              <li>記録画面に表示されるクラブの順番と種類をカスタマイズできます</li>
              <li>クラブ本数に上限はありません</li>
              <li>例：Mini DR（ミニドライバー）、Chip（チッパー）、60など</li>
            </ul>
          </div>
        </div>

        {/* Club add dialog */}
        {showClubDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-[var(--color-card-bg)] rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">クラブを追加</h2>
              <p className="text-sm text-[var(--color-neutral-600)] mb-4">
                クラブ名を入力してください（例：9w, 3i, 60）
              </p>

              <input
                type="text"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newClubName.trim()) {
                    handleAddClub();
                  }
                }}
                placeholder="例：9w"
                className="w-full px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-lg mb-4"
                autoFocus
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowClubDialog(false);
                    setNewClubName('');
                  }}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddClub}
                  disabled={!newClubName.trim()}
                  className="flex-1"
                >
                  追加
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Data management */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-bold mb-4">データ管理</h2>

          <div className="space-y-3">
            {/* CSV Export */}
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              className="w-full"
            >
              CSVエクスポート
            </Button>
            {exportStatus && (
              <div className={`text-center text-sm ${
                exportStatus.includes('完了') ? 'text-green-600' :
                exportStatus.includes('失敗') || exportStatus.includes('ありません') ? 'text-red-600' :
                'text-[var(--color-neutral-600)]'
              }`}>
                {exportStatus}
              </div>
            )}
            <p className="text-xs text-[var(--color-neutral-600)]">
              全てのショットデータをCSVファイルとしてダウンロードします
            </p>

            <div className="pt-3 border-t border-[var(--color-neutral-300)]">
              {/* CSV Import */}
              <label className="block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                  id="csv-import"
                />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('csv-import')?.click()}
                  className="w-full"
                >
                  CSVインポート
                </Button>
              </label>
              {importStatus && (
                <div className={`text-center text-sm mt-3 ${
                  importStatus.includes('完了') ? 'text-green-600' :
                  importStatus.includes('失敗') || importStatus.includes('ありません') || importStatus.includes('空') ? 'text-red-600' :
                  'text-[var(--color-neutral-600)]'
                }`}>
                  {importStatus}
                </div>
              )}
              <p className="text-xs text-[var(--color-neutral-600)] mt-3">
                エクスポートしたCSVファイルからショットデータをインポートできます
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--color-neutral-300)]">
              {/* Reset all data */}
              <Button
                variant="outline"
                onClick={handleResetData}
                className="w-full text-[var(--color-secondary-red)] border-[var(--color-secondary-red)] hover:opacity-90"
              >
                全データを削除
              </Button>
              {resetStatus && (
                <div className={`text-center text-sm mt-3 ${
                  resetStatus.includes('完了') ? 'text-[var(--color-primary-light)]' :
                  resetStatus.includes('失敗') ? 'text-[var(--color-secondary-red)]' :
                  'text-[var(--color-neutral-600)]'
                }`}>
                  {resetStatus}
                </div>
              )}
              <p className="text-xs text-[var(--color-neutral-600)] mt-3">
                全てのショット記録とプリセットを削除します（設定は保持）
              </p>
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">アプリ情報</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-neutral-600)]">バージョン</span>
              <span className="font-medium">1.0.0 (MVP)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-neutral-600)]">アプリ名</span>
              <span className="font-medium">上手くなる気がするぅぅぅ PRO</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
