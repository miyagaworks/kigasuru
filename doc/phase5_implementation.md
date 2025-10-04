# フェーズ5: 本実装計画書（Implementation）

## 📌 基本情報

**プロジェクト名**: 上手くなる気がするぅぅぅ Pro  
**開発メソッド**: BIALPHAメソッド  
**現在のフェーズ**: フェーズ5（H - Implementation）  
**期間**: 6週間  
**目標**: プロトタイプで検証したコア機能に全機能を追加し、リリース可能な完成版アプリを実装する

---

## 🎯 フェーズ5の目的

### プロトタイプ（フェーズ4）で完了したこと
✅ データベース基盤（SQLite、5テーブル）  
✅ プロファイル管理（作成・編集）  
✅ ラウンド管理（開始・終了）  
✅ ショット記録（6タップ手動入力のみ）  
✅ 6次元計算エンジン（想定飛距離算出）  
✅ 成功判定ロジック  
✅ 基本統計分析（成功率・平均・標準偏差）  
✅ 簡易分析画面（総合成績・ライ別・クラブ別）

### 本実装（フェーズ5）で追加する機能
🎯 **プリセット機能（2タップ入力）** ← 最優先  
🎯 プリセット学習エンジン  
🎯 詳細分析機能（グラフ表示）  
🎯 6次元統合分析  
🎯 パターン検出  
🎯 GPS・気象API連携（オプション）  
🎯 データエクスポート  
🎯 UI/UX完成度向上

---

## 📅 6週間実装スケジュール

### Week 1-2: プリセット機能実装（最優先）

#### Week 1: プリセット学習エンジン + ストレージ

**Day 1-2: プリセット学習エンジン実装**
```typescript
// services/PresetLearningEngine.ts
class PresetLearningEngine {
  // ショット履歴から頻出パターンを抽出
  async extractFrequentPatterns(userId: string): Promise<PresetPattern[]>
  
  // プリセット候補を生成
  async generatePresetCandidates(userId: string): Promise<PresetCandidate[]>
  
  // ユーザーの使用頻度を追跡
  async trackPresetUsage(presetId: string): Promise<void>
  
  // プリセット精度を計算
  async calculatePresetAccuracy(presetId: string): Promise<number>
  
  // プリセットの自動更新
  async autoUpdatePresets(userId: string): Promise<void>
}
```

**機能詳細**:
- **頻度カウント**: 同じ6次元パターン（傾斜・クラブ・ライ・強度・風・季節）の出現回数をカウント
- **閾値判定**: 10回以上出現したパターンをプリセット候補として抽出
- **精度計算**: プリセット使用時の成功率を計算（成功率70%以上を推奨）
- **自動更新**: 週1回、新しいパターンを検出してプリセットを更新

**Day 3-4: プリセットストア実装**
```typescript
// stores/presetStore.ts
interface Preset {
  id: string;
  userId: string;
  name: string; // ユーザーが編集可能
  slope: number;
  club: string;
  lie: string;
  intensity: string;
  wind: string;
  season: string;
  usageCount: number;
  successRate: number;
  lastUsedAt: Date;
  createdAt: Date;
}

const usePresetStore = create<PresetStore>((set, get) => ({
  presets: [],
  activePreset: null,
  
  // プリセット一覧取得
  loadPresets: async (userId: string) => {},
  
  // プリセット作成
  createPreset: async (preset: Omit<Preset, 'id'>) => {},
  
  // プリセット更新
  updatePreset: async (id: string, updates: Partial<Preset>) => {},
  
  // プリセット削除
  deletePreset: async (id: string) => {},
  
  // プリセット使用
  usePreset: async (id: string) => {},
  
  // おすすめプリセット取得（使用頻度・成功率でソート）
  getRecommendedPresets: (limit: number) => {},
}));
```

**Day 5: プリセットDBテーブル実装**
```sql
-- presetsテーブル拡張
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slope REAL NOT NULL,
  club TEXT NOT NULL,
  lie TEXT NOT NULL,
  intensity TEXT NOT NULL,
  wind TEXT NOT NULL,
  season TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE INDEX idx_presets_user_id ON presets(user_id);
CREATE INDEX idx_presets_usage ON presets(user_id, usage_count DESC);
CREATE INDEX idx_presets_success ON presets(user_id, success_rate DESC);
```

#### Week 2: プリセット選択UI + 2タップ入力フロー

**Day 1-2: プリセット選択画面実装**
```typescript
// screens/PresetSelectionScreen.tsx
const PresetSelectionScreen = () => {
  // おすすめプリセット表示（使用頻度順）
  // カスタムプリセット一覧表示
  // プリセット作成ボタン
  // プリセット編集・削除機能
  
  return (
    <View>
      <Text>おすすめプリセット</Text>
      <FlatList
        data={recommendedPresets}
        renderItem={({ item }) => (
          <PresetCard
            preset={item}
            onPress={() => selectPreset(item)}
            onEdit={() => editPreset(item)}
            onDelete={() => deletePreset(item)}
          />
        )}
      />
      
      <Text>マイプリセット</Text>
      <FlatList
        data={userPresets}
        renderItem={({ item }) => (
          <PresetCard preset={item} />
        )}
      />
      
      <Button title="新規プリセット作成" onPress={createNewPreset} />
    </View>
  );
};
```

**UIコンポーネント**:
- `PresetCard`: プリセット情報表示（名前・使用回数・成功率）
- `PresetEditModal`: プリセット編集モーダル
- `PresetCreateModal`: プリセット作成モーダル

**Day 3-4: 2タップ入力フロー実装**
```typescript
// screens/ShotRecordScreen.tsx（改良版）
const ShotRecordScreen = () => {
  const [inputMode, setInputMode] = useState<'preset' | 'manual'>('preset');
  
  // 2タップ入力フロー
  if (inputMode === 'preset') {
    return (
      <View>
        {/* タップ1: プリセット選択 */}
        <PresetSelector
          onSelect={(preset) => {
            // プリセットから6次元データを自動設定
            setSlope(preset.slope);
            setClub(preset.club);
            setLie(preset.lie);
            setIntensity(preset.intensity);
            setWind(preset.wind);
            setSeason(preset.season);
            
            // タップ2へ進む
            goToResultInput();
          }}
        />
        
        <Button
          title="手動入力に切り替え"
          onPress={() => setInputMode('manual')}
        />
      </View>
    );
  }
  
  // タップ2: 実際の飛距離入力
  return (
    <View>
      <Text>想定飛距離: {expectedDistance}y</Text>
      <Text>実際の飛距離を入力してください</Text>
      
      <TextInput
        placeholder="実際の飛距離"
        value={actualDistance}
        onChangeText={setActualDistance}
        keyboardType="numeric"
      />
      
      <Button
        title="記録"
        onPress={async () => {
          // ショット記録保存
          await saveShot();
          
          // プリセット使用回数・成功率を更新
          await updatePresetStats();
          
          // 完了画面へ
          navigation.navigate('ShotResult');
        }}
      />
    </View>
  );
};
```

**Day 5: 入力フロー統合テスト**
- プリセット選択 → 自動設定 → 結果入力 → 保存のフロー確認
- 手動入力への切り替え確認
- プリセット統計更新の確認
- エラーハンドリング確認

---

### Week 3-4: 詳細分析機能実装

#### Week 3: 詳細統計エンジン + グラフ表示

**Day 1-2: 詳細統計エンジン実装**
```typescript
// services/DetailedAnalysisEngine.ts
class DetailedAnalysisEngine {
  // 6次元別の詳細統計
  async analyze6DimensionalStats(userId: string): Promise<SixDimensionalStats>
  
  // 時系列分析（週・月・年）
  async analyzeTimeSeries(userId: string, period: 'week' | 'month' | 'year'): Promise<TimeSeriesData>
  
  // クラブ別詳細分析
  async analyzeClubPerformance(userId: string): Promise<ClubPerformance[]>
  
  // ライ別詳細分析
  async analyzeLiePerformance(userId: string): Promise<LiePerformance[]>
  
  // 傾斜別詳細分析
  async analyzeSlopePerformance(userId: string): Promise<SlopePerformance[]>
  
  // 季節・風・強度別分析
  async analyzeEnvironmentalFactors(userId: string): Promise<EnvironmentalAnalysis>
}

interface SixDimensionalStats {
  slope: { avg: number; stdDev: number; successRate: number; };
  club: { [club: string]: ClubStats };
  lie: { [lie: string]: LieStats };
  intensity: { [intensity: string]: IntensityStats };
  wind: { [wind: string]: WindStats };
  season: { [season: string]: SeasonStats };
}
```

**Day 3-4: グラフ表示コンポーネント実装**

使用ライブラリ: `react-native-chart-kit`（オフライン対応）

```typescript
// components/charts/SuccessRateChart.tsx
const SuccessRateChart = ({ data }: { data: ChartData }) => {
  return (
    <LineChart
      data={{
        labels: data.labels,
        datasets: [{ data: data.values }]
      }}
      width={Dimensions.get('window').width - 40}
      height={220}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      }}
    />
  );
};

// components/charts/ClubPerformanceChart.tsx
const ClubPerformanceChart = ({ data }: { data: ClubData[] }) => {
  return (
    <BarChart
      data={{
        labels: data.map(d => d.club),
        datasets: [{ data: data.map(d => d.successRate) }]
      }}
      width={Dimensions.get('window').width - 40}
      height={220}
      chartConfig={chartConfig}
    />
  );
};

// components/charts/TimeSeriesChart.tsx
const TimeSeriesChart = ({ data }: { data: TimeSeriesData }) => {
  return (
    <LineChart
      data={{
        labels: data.dates,
        datasets: [
          { data: data.successRates, color: () => 'blue' },
          { data: data.averageDistances, color: () => 'green' }
        ]
      }}
      width={Dimensions.get('window').width - 40}
      height={220}
      chartConfig={chartConfig}
    />
  );
};
```

**Day 5: 詳細分析画面実装**
```typescript
// screens/DetailedAnalysisScreen.tsx
const DetailedAnalysisScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'club' | 'lie' | 'slope' | 'environment'>('overview');
  
  return (
    <ScrollView>
      <TabSelector value={selectedTab} onChange={setSelectedTab} />
      
      {selectedTab === 'overview' && (
        <OverviewTab>
          <TimeSeriesChart data={timeSeriesData} />
          <SuccessRateChart data={successRateData} />
          <StatsSummary stats={overallStats} />
        </OverviewTab>
      )}
      
      {selectedTab === 'club' && (
        <ClubTab>
          <ClubPerformanceChart data={clubData} />
          <ClubDetailsList data={clubData} />
        </ClubTab>
      )}
      
      {selectedTab === 'lie' && (
        <LieTab>
          <LiePerformanceChart data={lieData} />
          <LieDetailsList data={lieData} />
        </LieTab>
      )}
      
      {selectedTab === 'slope' && (
        <SlopeTab>
          <SlopePerformanceChart data={slopeData} />
          <SlopeDetailsList data={slopeData} />
        </SlopeTab>
      )}
      
      {selectedTab === 'environment' && (
        <EnvironmentTab>
          <WindAnalysisChart data={windData} />
          <SeasonAnalysisChart data={seasonData} />
          <IntensityAnalysisChart data={intensityData} />
        </EnvironmentTab>
      )}
    </ScrollView>
  );
};
```

#### Week 4: 6次元統合分析 + パターン検出

**Day 1-3: 6次元統合分析実装**
```typescript
// services/SixDimensionalIntegratedAnalysis.ts
class SixDimensionalIntegratedAnalysis {
  /**
   * 6次元の相関分析
   * どの次元の組み合わせが成功率に最も影響するかを分析
   */
  async analyzeCorrelations(userId: string): Promise<CorrelationMatrix> {
    // 相関係数を計算
    // 例: 「傾斜+ライ」の組み合わせが成功率に与える影響
  }
  
  /**
   * 弱点検出
   * 成功率が低い6次元パターンを検出
   */
  async detectWeaknesses(userId: string): Promise<WeaknessPattern[]> {
    // 成功率50%以下のパターンを抽出
    // 頻度が多い順にソート
  }
  
  /**
   * 強み検出
   * 成功率が高い6次元パターンを検出
   */
  async detectStrengths(userId: string): Promise<StrengthPattern[]> {
    // 成功率80%以上のパターンを抽出
    // 頻度が多い順にソート
  }
  
  /**
   * 改善提案生成
   * 弱点パターンに対する改善アドバイスを生成
   */
  async generateImprovementSuggestions(userId: string): Promise<ImprovementSuggestion[]> {
    const weaknesses = await this.detectWeaknesses(userId);
    
    return weaknesses.map(weakness => ({
      pattern: weakness,
      suggestion: this.generateSuggestionText(weakness),
      priority: this.calculatePriority(weakness)
    }));
  }
  
  private generateSuggestionText(weakness: WeaknessPattern): string {
    // ルールベースで改善提案を生成
    // 例: 「上り傾斜+フェアウェイ+ドライバー」の成功率が低い場合
    //     → "上り傾斜では飛距離が落ちるため、1番手上げることを検討しましょう"
  }
}

interface CorrelationMatrix {
  slope_club: number;
  slope_lie: number;
  club_lie: number;
  // ... 他の組み合わせ
}

interface WeaknessPattern {
  slope: number;
  club: string;
  lie: string;
  intensity: string;
  wind: string;
  season: string;
  successRate: number;
  frequency: number;
}
```

**Day 4-5: パターン検出実装**
```typescript
// services/PatternDetectionEngine.ts
class PatternDetectionEngine {
  /**
   * 時系列パターン検出
   * 成績の上昇・下降トレンドを検出
   */
  async detectTrends(userId: string): Promise<TrendPattern[]> {
    // 直近4週間のデータで線形回帰
    // 傾き > 0.1 → 上昇トレンド
    // 傾き < -0.1 → 下降トレンド
  }
  
  /**
   * 異常値検出
   * 通常とは異なるショット結果を検出
   */
  async detectAnomalies(userId: string): Promise<AnomalyShot[]> {
    // 平均 ± 2σ を超えるショットを異常値として検出
  }
  
  /**
   * クラスタリング
   * 似た特徴を持つショットをグループ化
   */
  async clusterShots(userId: string): Promise<ShotCluster[]> {
    // k-means法で6次元データをクラスタリング
    // k=5（5つのグループに分類）
  }
  
  /**
   * 習熟度判定
   * クラブ・ライ別の習熟度を判定
   */
  async assessProficiency(userId: string): Promise<ProficiencyAssessment> {
    // 成功率・標準偏差から習熟度を5段階評価
    // 初心者・初級・中級・上級・エキスパート
  }
}
```

---

### Week 5: GPS・気象API連携（オプション）

**⚠️ オプション機能**: オフライン前提のため、連携はオプション扱い

**Day 1-2: 位置情報サービス実装**
```typescript
// services/LocationService.ts
import * as Location from 'expo-location';

class LocationService {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }
  
  async getCurrentLocation(): Promise<LocationData> {
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
    };
  }
  
  async getLocationName(lat: number, lon: number): Promise<string> {
    // オフライン: ローカルDBから地名取得
    // オンライン: Geocoding APIで地名取得
  }
}
```

**Day 3-4: 気象APIサービス実装**
```typescript
// services/WeatherService.ts
class WeatherService {
  /**
   * 気象データ取得（オンライン時のみ）
   */
  async fetchWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      // OpenWeatherMap API（無料）
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      
      const data = await response.json();
      
      return {
        temperature: data.main.temp,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        humidity: data.main.humidity,
        weather: data.weather[0].main,
      };
    } catch (error) {
      // オフライン時はnullを返す
      return null;
    }
  }
  
  /**
   * 風の強さを3段階に変換
   */
  convertWindToIntensity(windSpeed: number): 'なし' | '弱い' | '強い' {
    if (windSpeed < 3) return 'なし';
    if (windSpeed < 8) return '弱い';
    return '強い';
  }
  
  /**
   * 気象データから6次元パラメータを自動設定
   */
  async autoSetParameters(location: LocationData): Promise<AutoSetParams | null> {
    const weather = await this.fetchWeatherData(location.latitude, location.longitude);
    
    if (!weather) return null;
    
    return {
      wind: this.convertWindToIntensity(weather.windSpeed),
      season: this.getCurrentSeason(),
      // 傾斜・ライは手動入力が必要
    };
  }
  
  private getCurrentSeason(): '春' | '夏' | '秋' | '冬' {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }
}
```

**Day 5: 自動設定機能実装**
```typescript
// screens/ShotRecordScreen.tsx（GPS連携版）
const ShotRecordScreen = () => {
  const [autoSetEnabled, setAutoSetEnabled] = useState(true);
  
  useEffect(() => {
    if (autoSetEnabled) {
      autoSetFromGPS();
    }
  }, []);
  
  const autoSetFromGPS = async () => {
    // 位置情報取得
    const location = await locationService.getCurrentLocation();
    
    // 気象データ取得（オンライン時のみ）
    const params = await weatherService.autoSetParameters(location);
    
    if (params) {
      setWind(params.wind);
      setSeason(params.season);
      
      showToast('風と季節を自動設定しました');
    }
  };
  
  return (
    <View>
      <Switch
        value={autoSetEnabled}
        onValueChange={setAutoSetEnabled}
        label="GPS・気象情報から自動設定"
      />
      {/* ... 他のUI */}
    </View>
  );
};
```

---

### Week 6: 仕上げ・最適化・テスト

**Day 1-2: UI/UX完成度向上**

**改善項目**:
- アニメーション追加（画面遷移、ボタン押下）
- ローディング状態の表示改善
- エラーメッセージの改善（ユーザーフレンドリーに）
- 入力バリデーション強化
- アクセシビリティ対応（フォントサイズ調整、コントラスト）
- ダークモード対応（オプション）

**実装例**:
```typescript
// components/AnimatedButton.tsx
import { Animated } from 'react-native';

const AnimatedButton = ({ onPress, title }: ButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={handlePress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

**Day 3: エラーハンドリング強化**
```typescript
// utils/ErrorHandler.ts
class ErrorHandler {
  static handle(error: Error, context: string): void {
    console.error(`Error in ${context}:`, error);
    
    // エラーログをローカルに保存
    this.logError(error, context);
    
    // ユーザーフレンドリーなエラーメッセージ表示
    const message = this.getUserFriendlyMessage(error);
    Alert.alert('エラー', message);
  }
  
  private static getUserFriendlyMessage(error: Error): string {
    if (error.message.includes('network')) {
      return 'ネットワーク接続を確認してください';
    }
    if (error.message.includes('database')) {
      return 'データの保存に失敗しました。もう一度お試しください';
    }
    return '予期しないエラーが発生しました';
  }
}
```

**Day 4: パフォーマンス最適化**

**最適化項目**:
- React.memoでコンポーネントの不要な再レンダリング防止
- useCallbackでコールバック関数のメモ化
- FlatListの最適化（windowSize, removeClippedSubviews）
- 画像の遅延読み込み
- データベースクエリの最適化（インデックス追加）

```typescript
// Example: FlatList最適化
<FlatList
  data={shots}
  renderItem={renderShot}
  keyExtractor={(item) => item.id}
  windowSize={10}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
/>
```

**Day 5: テストカバレッジ向上**

**テスト実装**:
```typescript
// __tests__/PresetLearningEngine.test.ts
describe('PresetLearningEngine', () => {
  it('should extract frequent patterns', async () => {
    const patterns = await presetEngine.extractFrequentPatterns('user1');
    expect(patterns.length).toBeGreaterThan(0);
  });
  
  it('should calculate preset accuracy', async () => {
    const accuracy = await presetEngine.calculatePresetAccuracy('preset1');
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(100);
  });
});

// __tests__/DetailedAnalysisEngine.test.ts
describe('DetailedAnalysisEngine', () => {
  it('should analyze 6-dimensional stats', async () => {
    const stats = await analysisEngine.analyze6DimensionalStats('user1');
    expect(stats).toHaveProperty('slope');
    expect(stats).toHaveProperty('club');
    expect(stats).toHaveProperty('lie');
  });
});

// __tests__/integration/PresetFlow.test.ts
describe('Preset Flow Integration', () => {
  it('should complete 2-tap input flow', async () => {
    // 1. プリセット選択
    const preset = await selectPreset('preset1');
    
    // 2. 実際の飛距離入力
    await inputActualDistance(150);
    
    // 3. ショット保存
    await saveShot();
    
    // 4. プリセット統計更新確認
    const updatedPreset = await getPreset('preset1');
    expect(updatedPreset.usageCount).toBe(preset.usageCount + 1);
  });
});
```

**テスト目標**:
- 単体テストカバレッジ: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: 重要フロー100%

---

## 📦 成果物リスト

### 1. 実装コード
- [ ] プリセット学習エンジン
- [ ] プリセットストア・DB
- [ ] プリセット選択UI
- [ ] 2タップ入力フロー
- [ ] 詳細統計エンジン
- [ ] グラフ表示コンポーネント
- [ ] 詳細分析画面
- [ ] 6次元統合分析エンジン
- [ ] パターン検出エンジン
- [ ] GPS・気象API連携（オプション）
- [ ] データエクスポート機能
- [ ] UI/UXアニメーション
- [ ] エラーハンドリング

### 2. テストコード
- [ ] 単体テスト（80%カバレッジ）
- [ ] 統合テスト（主要フロー100%）
- [ ] E2Eテスト（重要フロー100%）
- [ ] パフォーマンステスト

### 3. ドキュメント
- [ ] README.md
- [ ] ユーザーマニュアル
- [ ] API仕様書
- [ ] テスト仕様書
- [ ] リリースノート

### 4. リリース準備
- [ ] ビルド設定（iOS/Android）
- [ ] アプリアイコン・スプラッシュ画面
- [ ] ストア申請用スクリーンショット
- [ ] プライバシーポリシー
- [ ] 利用規約

---

## 🛠️ 技術スタック（再確認）

### フロントエンド
- **フレームワーク**: React Native + TypeScript
- **状態管理**: Zustand
- **ナビゲーション**: React Navigation
- **グラフ**: react-native-chart-kit（オフライン対応）
- **UI**: React Native Paper（オプション）

### バックエンド（ローカル）
- **データベース**: SQLite（expo-sqlite）
- **ストレージ**: AsyncStorage（設定保存用）

### 外部連携（オプション）
- **位置情報**: expo-location
- **気象API**: OpenWeatherMap（無料プラン）

### 開発ツール
- **テスト**: Jest + React Native Testing Library
- **E2Eテスト**: Detox
- **リンター**: ESLint + Prettier
- **型チェック**: TypeScript

---

## 🚫 技術制約（絶対遵守）

### ❌ 使用禁止
- **AI機能**: 一切使用しない（GPT、機械学習モデル等）
- **クラウドDB**: 外部DBへのデータ送信禁止
- **ユーザー追跡**: 個人情報の外部送信禁止

### ✅ 使用可能
- **ルールベース計算**: 6次元補正係数による計算
- **統計分析**: 平均・標準偏差・相関係数
- **頻度カウント**: パターン出現回数のカウント
- **オフライン機能**: すべての機能がオフラインで動作

---

## 📊 データ構造（5テーブル）

### 1. profiles（プロファイル）
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handicap INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. rounds（ラウンド）
```sql
CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  course_name TEXT,
  date DATE NOT NULL,
  score INTEGER,
  started_at DATETIME,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);
```

### 3. shots（ショット記録）
```sql
CREATE TABLE shots (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  hole_number INTEGER NOT NULL,
  shot_number INTEGER NOT NULL,
  club TEXT NOT NULL,
  lie TEXT NOT NULL,
  slope REAL NOT NULL,
  intensity TEXT NOT NULL,
  wind TEXT NOT NULL,
  season TEXT NOT NULL,
  expected_distance REAL NOT NULL,
  actual_distance REAL NOT NULL,
  success BOOLEAN NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id)
);
```

### 4. presets（プリセット）
```sql
CREATE TABLE presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slope REAL NOT NULL,
  club TEXT NOT NULL,
  lie TEXT NOT NULL,
  intensity TEXT NOT NULL,
  wind TEXT NOT NULL,
  season TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE INDEX idx_presets_user_id ON presets(user_id);
CREATE INDEX idx_presets_usage ON presets(user_id, usage_count DESC);
CREATE INDEX idx_presets_success ON presets(user_id, success_rate DESC);
```

### 5. statistics（統計データ）
```sql
CREATE TABLE statistics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  period TEXT NOT NULL, -- 'week', 'month', 'year', 'all'
  total_shots INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  avg_distance REAL DEFAULT 0,
  std_dev REAL DEFAULT 0,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE INDEX idx_statistics_user_period ON statistics(user_id, period);
```

---

## 🎯 6次元計算エンジン（再確認）

### 補正係数定義
```typescript
// services/DistanceCalculationEngine.ts
const CORRECTION_FACTORS = {
  // 1. 傾斜補正
  slope: {
    uphill: (degrees: number) => 1 + (degrees * 0.02),    // 上り: 1度あたり+2%
    downhill: (degrees: number) => 1 - (degrees * 0.015), // 下り: 1度あたり-1.5%
  },
  
  // 2. クラブ補正
  club: {
    'ドライバー': 1.0,
    '3W': 0.85,
    '5W': 0.75,
    'UT': 0.70,
    '4I': 0.65,
    '5I': 0.60,
    '6I': 0.55,
    '7I': 0.50,
    '8I': 0.45,
    '9I': 0.40,
    'PW': 0.35,
    'AW': 0.30,
    'SW': 0.25,
  },
  
  // 3. ライ補正
  lie: {
    'フェアウェイ': 1.0,
    'ラフ': 0.85,
    'ベアグラウンド': 0.90,
    'バンカー': 0.70,
  },
  
  // 4. 強度補正
  intensity: {
    'フルショット': 1.0,
    'コントロールショット': 0.80,
    'ハーフショット': 0.50,
  },
  
  // 5. 風補正
  wind: {
    'なし': 1.0,
    '追い風弱い': 1.05,
    '追い風強い': 1.15,
    '向かい風弱い': 0.95,
    '向かい風強い': 0.85,
    '横風': 0.98,
  },
  
  // 6. 季節補正
  season: {
    '春': 1.0,
    '夏': 1.05,  // 暑いと飛ぶ
    '秋': 1.0,
    '冬': 0.90,  // 寒いと飛ばない
  },
};

// 想定飛距離計算
function calculateExpectedDistance(params: ShotParams): number {
  const baseDistance = 200; // ドライバーの基準飛距離
  
  const slopeCorrection = params.slope > 0
    ? CORRECTION_FACTORS.slope.uphill(params.slope)
    : CORRECTION_FACTORS.slope.downhill(Math.abs(params.slope));
  
  const clubCorrection = CORRECTION_FACTORS.club[params.club];
  const lieCorrection = CORRECTION_FACTORS.lie[params.lie];
  const intensityCorrection = CORRECTION_FACTORS.intensity[params.intensity];
  const windCorrection = CORRECTION_FACTORS.wind[params.wind];
  const seasonCorrection = CORRECTION_FACTORS.season[params.season];
  
  const expectedDistance = baseDistance
    * slopeCorrection
    * clubCorrection
    * lieCorrection
    * intensityCorrection
    * windCorrection
    * seasonCorrection;
  
  return Math.round(expectedDistance);
}

// 成功判定（±10%以内）
function isSuccess(expected: number, actual: number): boolean {
  const tolerance = 0.10; // 10%
  const lowerBound = expected * (1 - tolerance);
  const upperBound = expected * (1 + tolerance);
  
  return actual >= lowerBound && actual <= upperBound;
}
```

---

## 🔄 プリセット学習アルゴリズム詳細

### 学習フロー
```typescript
class PresetLearningEngine {
  /**
   * ステップ1: パターン抽出
   * ショット履歴から同じ6次元パターンをグループ化
   */
  async extractFrequentPatterns(userId: string): Promise<PresetPattern[]> {
    const shots = await db.getAllShots(userId);
    
    // 6次元でグループ化
    const patterns = new Map<string, ShotGroup>();
    
    shots.forEach(shot => {
      const key = this.createPatternKey(shot);
      
      if (!patterns.has(key)) {
        patterns.set(key, {
          shots: [],
          count: 0,
          successCount: 0,
        });
      }
      
      const group = patterns.get(key)!;
      group.shots.push(shot);
      group.count++;
      if (shot.success) group.successCount++;
    });
    
    // 頻度でフィルタリング（10回以上出現）
    const frequentPatterns = Array.from(patterns.entries())
      .filter(([_, group]) => group.count >= 10)
      .map(([key, group]) => ({
        pattern: this.parsePatternKey(key),
        frequency: group.count,
        successRate: (group.successCount / group.count) * 100,
      }))
      .sort((a, b) => b.frequency - a.frequency);
    
    return frequentPatterns;
  }
  
  /**
   * ステップ2: プリセット候補生成
   * 頻出パターンからプリセット候補を生成
   */
  async generatePresetCandidates(userId: string): Promise<PresetCandidate[]> {
    const patterns = await this.extractFrequentPatterns(userId);
    
    return patterns.map(pattern => ({
      name: this.generatePresetName(pattern.pattern),
      ...pattern.pattern,
      frequency: pattern.frequency,
      successRate: pattern.successRate,
      recommended: pattern.frequency >= 20 && pattern.successRate >= 70,
    }));
  }
  
  /**
   * ステップ3: プリセット自動作成
   * 推奨条件を満たすパターンを自動的にプリセット化
   */
  async autoCreatePresets(userId: string): Promise<void> {
    const candidates = await this.generatePresetCandidates(userId);
    
    const recommended = candidates.filter(c => c.recommended);
    
    for (const candidate of recommended) {
      await presetStore.createPreset({
        userId,
        name: candidate.name,
        slope: candidate.slope,
        club: candidate.club,
        lie: candidate.lie,
        intensity: candidate.intensity,
        wind: candidate.wind,
        season: candidate.season,
      });
    }
  }
  
  /**
   * パターンキー生成
   */
  private createPatternKey(shot: Shot): string {
    return `${shot.slope}_${shot.club}_${shot.lie}_${shot.intensity}_${shot.wind}_${shot.season}`;
  }
  
  /**
   * プリセット名生成
   */
  private generatePresetName(pattern: ShotPattern): string {
    // 例: "フェアウェイ・7I・フル"
    return `${pattern.lie}・${pattern.club}・${pattern.intensity.replace('ショット', '')}`;
  }
}
```

### 学習頻度
- **自動学習**: 100ショットごとに実行
- **定期学習**: 週1回（日曜深夜）
- **手動学習**: ユーザーが「プリセット更新」ボタンを押したとき

---

## 📈 統計分析アルゴリズム詳細

### 1. 基本統計
```typescript
class StatisticsEngine {
  /**
   * 平均計算
   */
  calculateAverage(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  /**
   * 標準偏差計算
   */
  calculateStdDev(values: number[]): number {
    const avg = this.calculateAverage(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = this.calculateAverage(squaredDiffs);
    return Math.sqrt(variance);
  }
  
  /**
   * 成功率計算
   */
  calculateSuccessRate(shots: Shot[]): number {
    const successCount = shots.filter(s => s.success).length;
    return (successCount / shots.length) * 100;
  }
}
```

### 2. 相関分析
```typescript
class CorrelationAnalysis {
  /**
   * ピアソン相関係数
   */
  calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return numerator / denominator;
  }
  
  /**
   * 6次元間の相関行列計算
   */
  async calculateCorrelationMatrix(userId: string): Promise<CorrelationMatrix> {
    const shots = await db.getAllShots(userId);
    
    // 数値化
    const slopeValues = shots.map(s => s.slope);
    const clubValues = shots.map(s => this.clubToNumber(s.club));
    const lieValues = shots.map(s => this.lieToNumber(s.lie));
    const successValues = shots.map(s => s.success ? 1 : 0);
    
    return {
      slope_success: this.calculateCorrelation(slopeValues, successValues),
      club_success: this.calculateCorrelation(clubValues, successValues),
      lie_success: this.calculateCorrelation(lieValues, successValues),
      slope_club: this.calculateCorrelation(slopeValues, clubValues),
      // ... 他の組み合わせ
    };
  }
}
```

### 3. トレンド分析
```typescript
class TrendAnalysis {
  /**
   * 線形回帰（最小二乗法）
   */
  calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }
  
  /**
   * トレンド判定
   */
  async detectTrend(userId: string, period: number = 30): Promise<TrendResult> {
    const shots = await db.getRecentShots(userId, period);
    
    // 時系列データ作成
    const x = shots.map((_, i) => i);
    const y = shots.map(s => s.success ? 1 : 0);
    
    const { slope, intercept } = this.calculateLinearRegression(x, y);
    
    let trend: 'up' | 'down' | 'stable';
    if (slope > 0.01) trend = 'up';
    else if (slope < -0.01) trend = 'down';
    else trend = 'stable';
    
    return { trend, slope, intercept };
  }
}
```

---

## 🧪 テスト戦略

### 1. 単体テスト
```typescript
// プリセット学習エンジンのテスト
describe('PresetLearningEngine', () => {
  it('10回以上出現したパターンを抽出する', async () => {
    // テストデータ準備
    const shots = createTestShots(100);
    await db.insertShots(shots);
    
    // テスト実行
    const patterns = await presetEngine.extractFrequentPatterns('test-user');
    
    // 検証
    expect(patterns.length).toBeGreaterThan(0);
    patterns.forEach(pattern => {
      expect(pattern.frequency).toBeGreaterThanOrEqual(10);
    });
  });
});

// 統計エンジンのテスト
describe('StatisticsEngine', () => {
  it('正しく平均を計算する', () => {
    const values = [10, 20, 30, 40, 50];
    const avg = statsEngine.calculateAverage(values);
    expect(avg).toBe(30);
  });
  
  it('正しく標準偏差を計算する', () => {
    const values = [10, 20, 30, 40, 50];
    const stdDev = statsEngine.calculateStdDev(values);
    expect(stdDev).toBeCloseTo(14.14, 2);
  });
});
```

### 2. 統合テスト
```typescript
describe('Preset Flow Integration', () => {
  it('プリセット選択から記録保存までのフロー', async () => {
    // 1. プリセット選択
    const preset = await presetStore.getPresets('test-user')[0];
    await presetStore.usePreset(preset.id);
    
    // 2. ショット記録
    const shot = {
      ...preset,
      actualDistance: 150,
      expectedDistance: 145,
    };
    await shotStore.createShot(shot);
    
    // 3. プリセット統計更新確認
    const updatedPreset = await presetStore.getPreset(preset.id);
    expect(updatedPreset.usageCount).toBe(preset.usageCount + 1);
    expect(updatedPreset.successCount).toBe(preset.successCount + 1);
  });
});
```

### 3. E2Eテスト
```typescript
describe('E2E: ショット記録フロー', () => {
  it('プリセットを使って2タップでショット記録できる', async () => {
    // アプリ起動
    await device.launchApp();
    
    // ラウンド開始
    await element(by.id('start-round-button')).tap();
    
    // プリセット選択画面へ
    await element(by.id('preset-mode-button')).tap();
    
    // プリセット選択（タップ1）
    await element(by.id('preset-card-0')).tap();
    
    // 実際の飛距離入力（タップ2）
    await element(by.id('actual-distance-input')).typeText('150');
    await element(by.id('save-shot-button')).tap();
    
    // 成功メッセージ確認
    await expect(element(by.text('ショットを記録しました'))).toBeVisible();
  });
});
```

---

## 📱 データエクスポート機能

### エクスポート形式
- **CSV**: Excel・スプレッドシートで分析可能
- **JSON**: 他アプリとのデータ連携用

### 実装
```typescript
// services/ExportService.ts
class ExportService {
  /**
   * CSV形式でエクスポート
   */
  async exportToCSV(userId: string): Promise<string> {
    const shots = await db.getAllShots(userId);
    
    const header = 'ID,日時,クラブ,ライ,傾斜,強度,風,季節,想定飛距離,実際の飛距離,成功\n';
    const rows = shots.map(shot => 
      `${shot.id},${shot.createdAt},${shot.club},${shot.lie},${shot.slope},${shot.intensity},${shot.wind},${shot.season},${shot.expectedDistance},${shot.actualDistance},${shot.success}`
    ).join('\n');
    
    return header + rows;
  }
  
  /**
   * JSON形式でエクスポート
   */
  async exportToJSON(userId: string): Promise<string> {
    const shots = await db.getAllShots(userId);
    const presets = await db.getAllPresets(userId);
    const statistics = await db.getAllStatistics(userId);
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      userId,
      shots,
      presets,
      statistics,
    }, null, 2);
  }
  
  /**
   * ファイルとして保存
   */
  async saveToFile(format: 'csv' | 'json', userId: string): Promise<string> {
    const data = format === 'csv' 
      ? await this.exportToCSV(userId)
      : await this.exportToJSON(userId);
    
    const filename = `golf_data_${userId}_${Date.now()}.${format}`;
    const path = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(path, data);
    
    return path;
  }
  
  /**
   * 共有
   */
  async share(format: 'csv' | 'json', userId: string): Promise<void> {
    const path = await this.saveToFile(format, userId);
    
    await Sharing.shareAsync(path, {
      mimeType: format === 'csv' ? 'text/csv' : 'application/json',
      dialogTitle: 'ゴルフデータをエクスポート',
    });
  }
}
```

---

## 🎨 UI/UX改善項目

### アニメーション
- 画面遷移: スライド・フェード
- ボタン押下: スケール・リップル
- データ更新: フェードイン
- グラフ描画: プログレッシブ表示

### フィードバック
- 成功時: グリーンのチェックマーク + バイブレーション
- エラー時: レッドのアラート + バイブレーション
- 読み込み中: スケルトンスクリーン

### アクセシビリティ
- フォントサイズ調整機能
- ハイコントラストモード
- スクリーンリーダー対応
- キーボードナビゲーション

---

## 🚀 リリース準備

### アプリストア申請用素材

**1. アプリアイコン**
- iOS: 1024x1024px (透過なし)
- Android: 512x512px

**2. スクリーンショット**
- iPhone: 6.5インチ (1284x2778px) x 5枚
- iPad: 12.9インチ (2048x2732px) x 5枚
- Android: 1080x1920px x 8枚

**スクリーンショット内容例**:
1. ショット記録画面（プリセット選択）
2. 詳細分析画面（グラフ表示）
3. プリセット一覧画面
4. ラウンド管理画面
5. 成績サマリー画面

**3. アプリ説明文**
```
【タイトル】
上手くなる気がするぅぅぅ Pro - ゴルフショット分析アプリ

【短い説明】（80文字以内）
6次元分析でゴルフが上達！オフラインで使える本格ショット記録・分析アプリ

【詳細説明】
「上手くなる気がするぅぅぅ Pro」は、ゴルフのショットを6次元（傾斜・クラブ・ライ・強度・風・季節）で記録・分析する本格的なゴルフアプリです。

【主な機能】
・2タップで簡単ショット記録（プリセット機能）
・6次元分析による詳細なスイング分析
・グラフで見やすい成績推移
・弱点・強みの自動検出
・完全オフライン対応

【こんな方におすすめ】
・スコアアップを目指すゴルファー
・データに基づいた練習をしたい方
・自分の弱点を知りたい方

【プライバシー】
すべてのデータは端末内に保存され、外部に送信されることはありません。
```

**4. プライバシーポリシー**
```markdown
# プライバシーポリシー

## データの取り扱い
本アプリは、ユーザーのゴルフショットデータを端末内のローカルデータベース（SQLite）に保存します。

## 外部送信の禁止
本アプリは、ユーザーのデータを外部サーバーに送信することは一切ありません。

## 位置情報の利用（オプション）
GPS機能を有効にした場合、現在地の取得に位置情報を利用しますが、これも端末内でのみ使用され、外部には送信されません。

## お問い合わせ
support@example.com
```

---

## ✅ 完了チェックリスト

### Week 1-2
- [ ] プリセット学習エンジン実装
- [ ] プリセットストア実装
- [ ] プリセットDBテーブル実装
- [ ] プリセット選択UI実装
- [ ] 2タップ入力フロー実装
- [ ] 単体テスト実装

### Week 3-4
- [ ] 詳細統計エンジン実装
- [ ] グラフ表示コンポーネント実装
- [ ] 詳細分析画面実装
- [ ] 6次元統合分析実装
- [ ] パターン検出実装
- [ ] 統合テスト実装

### Week 5
- [ ] 位置情報サービス実装（オプション）
- [ ] 気象APIサービス実装（オプション）
- [ ] 自動設定機能実装（オプション）
- [ ] データエクスポート実装

### Week 6
- [ ] UI/UXアニメーション実装
- [ ] エラーハンドリング強化
- [ ] パフォーマンス最適化
- [ ] E2Eテスト実装
- [ ] ドキュメント作成
- [ ] リリース準備

---

## 🎯 次のステップ

**フェーズ5完了後**:
1. **フェーズ6: テスト・品質保証**
   - ベータテスト実施
   - バグ修正
   - パフォーマンス最適化

2. **フェーズ7: リリース・運用**
   - アプリストア申請
   - リリース
   - ユーザーフィードバック収集
   - 継続的改善

---

## 📞 サポート・トラブルシューティング

### よくある問題と解決策

**1. プリセット学習が動作しない**
- **原因**: ショットデータが10回未満
- **解決策**: 最低10回以上の同じパターンのショットを記録する必要があります

**2. グラフが表示されない**
- **原因**: データ不足、またはライブラリの読み込みエラー
- **解決策**: 最低5ショット以上のデータが必要。アプリを再起動してみてください

**3. GPS機能が使えない**
- **原因**: 位置情報の権限が許可されていない
- **解決策**: 設定 > アプリ > 位置情報 で権限を許可してください

**4. データが消えた**
- **原因**: アプリの再インストール、またはデータベースエラー
- **解決策**: 定期的にデータエクスポート機能でバックアップを取ってください

---

## 🔧 開発環境セットアップ

### 必要なツール
```bash
# Node.js (v18以上)
node --version

# npm or yarn
npm --version

# Expo CLI
npm install -g expo-cli

# React Native CLI
npm install -g react-native-cli
```

### プロジェクト初期化
```bash
# プロジェクトクローン
git clone <repository-url>
cd golf-app-pro

# 依存関係インストール
npm install

# iOS依存関係インストール（Macのみ）
cd ios && pod install && cd ..

# 開発サーバー起動
npm start
```

### 依存ライブラリ
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "expo": "^49.0.0",
    "expo-sqlite": "^11.3.0",
    "expo-location": "^16.1.0",
    "expo-file-system": "^15.4.0",
    "expo-sharing": "^11.5.0",
    "zustand": "^4.4.0",
    "react-navigation": "^6.1.0",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "^13.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "typescript": "^5.1.0",
    "jest": "^29.6.0",
    "@testing-library/react-native": "^12.2.0",
    "detox": "^20.10.0",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 📚 ドキュメント構成

### 1. README.md
```markdown
# 上手くなる気がするぅぅぅ Pro

6次元分析でゴルフが上達！オフラインで使える本格ショット記録・分析アプリ

## 特徴
- 2タップで簡単ショット記録
- 6次元分析による詳細なスイング分析
- 完全オフライン対応
- プライバシー保護（データは端末内のみ）

## インストール
[App Store / Google Play のリンク]

## 使い方
1. プロファイル作成
2. ラウンド開始
3. ショット記録（プリセットまたは手動）
4. 詳細分析で成績確認

## サポート
support@example.com
```

### 2. ユーザーマニュアル
```markdown
# ユーザーマニュアル

## 1. 初期設定
### プロファイル作成
1. アプリを起動
2. 「プロファイル作成」をタップ
3. 名前とハンディキャップを入力
4. 「保存」をタップ

## 2. ショット記録（2タップモード）
### プリセットを使った記録
1. ラウンド開始
2. 「プリセットモード」を選択
3. 状況に合ったプリセットをタップ（タップ1）
4. 実際の飛距離を入力（タップ2）
5. 自動保存

### 手動入力モード
1. 「手動モード」を選択
2. 6次元パラメータを入力
   - 傾斜（-10〜+10度）
   - クラブ選択
   - ライ選択
   - 強度選択
   - 風選択
   - 季節選択
3. 想定飛距離が自動計算
4. 実際の飛距離を入力
5. 保存

## 3. 詳細分析の見方
### 総合成績
- 成功率: 想定飛距離±10%に収まった割合
- 平均飛距離: 全ショットの平均値
- 標準偏差: ばらつきの指標（小さいほど安定）

### クラブ別分析
- 各クラブの成功率
- 各クラブの平均飛距離
- 推奨使用場面

### ライ別分析
- フェアウェイ、ラフ、バンカーごとの成績
- 弱点ライの検出

## 4. プリセット管理
### プリセットの作成
1. 「プリセット」画面へ
2. 「新規作成」をタップ
3. 6次元パラメータを設定
4. 名前を入力
5. 保存

### プリセットの編集・削除
1. プリセットを長押し
2. 「編集」または「削除」を選択

### 自動学習
- 10回以上同じパターンが出現すると自動的にプリセット候補として提案
- 「おすすめプリセット」に表示

## 5. データのバックアップ
### エクスポート
1. 設定画面へ
2. 「データエクスポート」をタップ
3. CSV または JSON を選択
4. 共有メニューから保存先を選択

### インポート
1. 設定画面へ
2. 「データインポート」をタップ
3. ファイルを選択
4. 確認して「インポート」
```

### 3. API仕様書
```markdown
# API仕様書

## データベースAPI

### ProfileRepository
```typescript
interface ProfileRepository {
  create(profile: ProfileInput): Promise<Profile>;
  findById(id: string): Promise<Profile | null>;
  update(id: string, updates: Partial<Profile>): Promise<Profile>;
  delete(id: string): Promise<void>;
}
```

### ShotRepository
```typescript
interface ShotRepository {
  create(shot: ShotInput): Promise<Shot>;
  findById(id: string): Promise<Shot | null>;
  findByRoundId(roundId: string): Promise<Shot[]>;
  findByUserId(userId: string): Promise<Shot[]>;
  update(id: string, updates: Partial<Shot>): Promise<Shot>;
  delete(id: string): Promise<void>;
}
```

### PresetRepository
```typescript
interface PresetRepository {
  create(preset: PresetInput): Promise<Preset>;
  findById(id: string): Promise<Preset | null>;
  findByUserId(userId: string): Promise<Preset[]>;
  findRecommended(userId: string, limit: number): Promise<Preset[]>;
  update(id: string, updates: Partial<Preset>): Promise<Preset>;
  delete(id: string): Promise<void>;
  incrementUsage(id: string): Promise<void>;
}
```

## サービスAPI

### DistanceCalculationEngine
```typescript
interface DistanceCalculationEngine {
  calculateExpectedDistance(params: ShotParams): number;
  isSuccess(expected: number, actual: number): boolean;
}
```

### PresetLearningEngine
```typescript
interface PresetLearningEngine {
  extractFrequentPatterns(userId: string): Promise<PresetPattern[]>;
  generatePresetCandidates(userId: string): Promise<PresetCandidate[]>;
  autoCreatePresets(userId: string): Promise<void>;
}
```

### DetailedAnalysisEngine
```typescript
interface DetailedAnalysisEngine {
  analyze6DimensionalStats(userId: string): Promise<SixDimensionalStats>;
  analyzeTimeSeries(userId: string, period: TimePeriod): Promise<TimeSeriesData>;
  analyzeClubPerformance(userId: string): Promise<ClubPerformance[]>;
}
```
```

### 4. テスト仕様書
```markdown
# テスト仕様書

## 単体テスト

### PresetLearningEngine
| テストケース | 入力 | 期待値 |
|------------|------|--------|
| 頻出パターン抽出 | 100ショット（10回以上同じパターン） | パターン抽出成功 |
| 頻度不足 | 100ショット（5回以下のパターンのみ） | 空の配列 |
| プリセット精度計算 | 成功率70%のプリセット | 精度70% |

### DistanceCalculationEngine
| テストケース | 入力 | 期待値 |
|------------|------|--------|
| 基本計算 | 平坦・ドライバー・フェアウェイ | 200y |
| 上り傾斜 | +5度・ドライバー・フェアウェイ | 220y |
| 下り傾斜 | -5度・ドライバー・フェアウェイ | 185y |
| ラフ補正 | 平坦・ドライバー・ラフ | 170y |

## 統合テスト

### プリセットフロー
1. プリセット選択
2. 実際の飛距離入力
3. ショット保存
4. プリセット統計更新確認

### 分析フロー
1. 100ショット記録
2. 詳細分析実行
3. グラフ表示確認
4. 統計値確認

## E2Eテスト

### シナリオ1: 初回ユーザー
1. アプリ起動
2. プロファイル作成
3. ラウンド開始
4. ショット記録（手動）
5. ラウンド終了
6. 簡易分析確認

### シナリオ2: リピートユーザー
1. アプリ起動
2. ラウンド開始
3. ショット記録（プリセット）
4. 詳細分析確認
5. プリセット編集

### シナリオ3: データエクスポート
1. 設定画面へ
2. エクスポート実行
3. ファイル保存確認
4. ファイル内容確認
```

---

## 🎬 実装開始の準備

### 開始前の最終確認

✅ **全ドキュメント確認済み**
- [ ] 企画書（golf-app-plan.md）
- [ ] フェーズ1: コンセプト設計
- [ ] フェーズ2: システム設計
- [ ] フェーズ3: 詳細設計
- [ ] フェーズ4: プロトタイプ開発計画
- [ ] フェーズ5: 本実装計画（このドキュメント）

✅ **技術スタック準備済み**
- [ ] React Native環境構築
- [ ] TypeScript設定
- [ ] SQLite設定
- [ ] Zustand設定
- [ ] テスト環境構築

✅ **制約条件理解済み**
- [ ] AI機能は一切使用しない
- [ ] 完全オフライン対応
- [ ] ルールベース計算のみ
- [ ] プライバシー保護

✅ **実装優先順位理解済み**
1. プリセット機能（Week 1-2）
2. 詳細分析機能（Week 3-4）
3. GPS・気象API（Week 5、オプション）
4. 仕上げ（Week 6）

---

## 🚀 実装開始コマンド

準備が整ったら、以下のコマンドで実装を開始してください：

```bash
# 新しいブランチ作成
git checkout -b feature/phase5-implementation

# Week 1の作業開始
git checkout -b feature/preset-learning-engine

# 実装後
git add .
git commit -m "feat: implement preset learning engine"
git push origin feature/preset-learning-engine
```

---

## 📝 週次レポートテンプレート

各週末に進捗をレポートしてください：

```markdown
# Week [X] 進捗レポート

## 完了した作業
- [ ] タスク1
- [ ] タスク2
- [ ] タスク3

## 未完了の作業
- [ ] タスク4（理由: ...）

## 遭遇した問題
1. 問題1
   - 原因: ...
   - 解決策: ...

2. 問題2
   - 原因: ...
   - 解決策: ...

## 次週の予定
- タスク5
- タスク6

## メモ
- ...
```

---

## 🎯 成功の定義

### フェーズ5完了の基準

✅ **機能要件**
- [ ] プリセット機能が動作する（2タップ入力）
- [ ] プリセット学習が動作する（10回以上で自動生成）
- [ ] 詳細分析画面が表示される（グラフあり）
- [ ] 6次元統合分析が動作する
- [ ] パターン検出が動作する
- [ ] データエクスポートが動作する

✅ **品質要件**
- [ ] 単体テストカバレッジ80%以上
- [ ] 統合テスト主要フロー100%
- [ ] E2Eテスト重要フロー100%
- [ ] パフォーマンス: 画面遷移1秒以内
- [ ] パフォーマンス: グラフ描画2秒以内

✅ **ドキュメント要件**
- [ ] README.md完成
- [ ] ユーザーマニュアル完成
- [ ] API仕様書完成
- [ ] テスト仕様書完成

✅ **リリース要件**
- [ ] ビルド設定完了（iOS/Android）
- [ ] アプリアイコン完成
- [ ] スクリーンショット完成（各5枚以上）
- [ ] プライバシーポリシー完成
- [ ] 利用規約完成

---

## 🎉 完了後のネクストステップ

フェーズ5が完了したら：

1. **フェーズ6: テスト・品質保証**
   - ベータテスト実施
   - ユーザーフィードバック収集
   - バグ修正
   - パフォーマンス最適化

2. **フェーズ7: リリース**
   - App Store申請
   - Google Play申請
   - リリース
   - プレスリリース配信

3. **フェーズ8: 運用・改善**
   - ユーザーサポート
   - 継続的な機能改善
   - バージョンアップ

---

## 📞 連絡先・サポート

**開発チーム**
- メール: dev@example.com
- Slack: #golf-app-dev

**ユーザーサポート**
- メール: support@example.com
- FAQ: https://example.com/faq

**バグレポート**
- GitHub Issues: https://github.com/example/golf-app-pro/issues

---

## 📄 ライセンス

MIT License

Copyright (c) 2025 [Your Name/Company]

---

## 🙏 謝辞

このプロジェクトは、BIALPHAメソッドに基づいて開発されました。

---

# ✅ フェーズ5実装計画書 完成

**本ドキュメントの作成日**: 2025年9月30日  
**想定実装期間**: 6週間  
**目標**: リリース可能な完成版アプリの実装

**次のアクション**: Week 1の実装開始

---

**準備完了！実装を開始してください！** 🚀⛳

---

## 📋 付録: 実装チェックリスト（詳細版）

### Week 1: プリセット学習エンジン

**Day 1**
- [ ] PresetLearningEngine.ts ファイル作成
- [ ] extractFrequentPatterns メソッド実装
- [ ] パターンキー生成ロジック実装
- [ ] 単体テスト作成（パターン抽出）

**Day 2**
- [ ] generatePresetCandidates メソッド実装
- [ ] プリセット名自動生成ロジック実装
- [ ] 単体テスト作成（候補生成）
- [ ] calculatePresetAccuracy メソッド実装

**Day 3**
- [ ] presetStore.ts ファイル作成
- [ ] Zustandストア定義
- [ ] loadPresets アクション実装
- [ ] createPreset アクション実装

**Day 4**
- [ ] updatePreset アクション実装
- [ ] deletePreset アクション実装
- [ ] usePreset アクション実装
- [ ] getRecommendedPresets メソッド実装

**Day 5**
- [ ] presetsテーブル作成・マイグレーション
- [ ] インデックス作成
- [ ] PresetRepository 実装
- [ ] 統合テスト作成

### Week 2: プリセット選択UI

**Day 1**
- [ ] PresetSelectionScreen.tsx 作成
- [ ] PresetCard コンポーネント作成
- [ ] おすすめプリセット表示実装
- [ ] マイプリセット表示実装

**Day 2**
- [ ] PresetEditModal コンポーネント作成
- [ ] PresetCreateModal コンポーネント作成
- [ ] 編集・削除機能実装
- [ ] UI単体テスト作成

**Day 3**
- [ ] 2タップ入力フロー実装（ShotRecordScreen改良）
- [ ] プリセット選択ロジック実装
- [ ] 自動パラメータ設定実装
- [ ] 想定飛距離計算連携

**Day 4**
- [ ] 実際の飛距離入力画面実装
- [ ] 保存ロジック実装
- [ ] プリセット統計更新実装
- [ ] 成功メッセージ表示実装

**Day 5**
- [ ] 統合テスト（プリセット選択→保存フロー）
- [ ] E2Eテスト（2タップ入力フロー）
- [ ] バグ修正
- [ ] Week 1-2振り返り

### Week 3: 詳細統計エンジン

**Day 1**
- [ ] DetailedAnalysisEngine.ts 作成
- [ ] analyze6DimensionalStats メソッド実装
- [ ] 次元別統計計算実装
- [ ] 単体テスト作成

**Day 2**
- [ ] analyzeTimeSeries メソッド実装
- [ ] 週・月・年別集計実装
- [ ] analyzeClubPerformance メソッド実装
- [ ] analyzeLiePerformance メソッド実装

**Day 3**
- [ ] SuccessRateChart コンポーネント作成
- [ ] ClubPerformanceChart コンポーネント作成
- [ ] TimeSeriesChart コンポーネント作成
- [ ] グラフ表示テスト

**Day 4**
- [ ] LiePerformanceChart コンポーネント作成
- [ ] SlopePerformanceChart コンポーネント作成
- [ ] WindAnalysisChart コンポーネント作成
- [ ] グラフスタイル調整

**Day 5**
- [ ] DetailedAnalysisScreen.tsx 作成
- [ ] タブ切り替え実装
- [ ] 各タブの表示実装
- [ ] 統合テスト作成

### Week 4: 6次元統合分析

**Day 1**
- [ ] SixDimensionalIntegratedAnalysis.ts 作成
- [ ] analyzeCorrelations メソッド実装
- [ ] 相関係数計算実装
- [ ] 単体テスト作成

**Day 2**
- [ ] detectWeaknesses メソッド実装
- [ ] detectStrengths メソッド実装
- [ ] 弱点・強み抽出ロジック実装
- [ ] 単体テスト作成

**Day 3**
- [ ] generateImprovementSuggestions メソッド実装
- [ ] 改善提案テキスト生成ロジック実装
- [ ] PatternDetectionEngine.ts 作成
- [ ] detectTrends メソッド実装

**Day 4**
- [ ] detectAnomalies メソッド実装
- [ ] clusterShots メソッド実装
- [ ] assessProficiency メソッド実装
- [ ] 単体テスト作成

**Day 5**
- [ ] 統合分析画面UI実装
- [ ] 弱点・強み表示実装
- [ ] 改善提案表示実装
- [ ] Week 3-4振り返り

### Week 5: GPS・気象API（オプション）

**Day 1**
- [ ] LocationService.ts 作成
- [ ] 位置情報権限リクエスト実装
- [ ] 現在位置取得実装
- [ ] 単体テスト作成

**Day 2**
- [ ] Geocoding実装（地名取得）
- [ ] オフライン地名DB作成
- [ ] WeatherService.ts 作成
- [ ] OpenWeatherMap API連携

**Day 3**
- [ ] 気象データ取得実装
- [ ] 風の強さ変換実装
- [ ] 季節判定実装
- [ ] 単体テスト作成

**Day 4**
- [ ] autoSetParameters メソッド実装
- [ ] 自動設定UI実装（トグルスイッチ）
- [ ] GPS連携フロー実装
- [ ] エラーハンドリング実装

**Day 5**
- [ ] ExportService.ts 作成
- [ ] exportToCSV メソッド実装
- [ ] exportToJSON メソッド実装
- [ ] share メソッド実装

### Week 6: 仕上げ

**Day 1**
- [ ] AnimatedButton コンポーネント作成
- [ ] 画面遷移アニメーション実装
- [ ] ローディング状態表示改善
- [ ] エラーメッセージ改善

**Day 2**
- [ ] アクセシビリティ対応（フォントサイズ）
- [ ] ハイコントラストモード実装
- [ ] スクリーンリーダー対応
- [ ] ダークモード実装（オプション）

**Day 3**
- [ ] ErrorHandler.ts 作成
- [ ] エラーハンドリング統一
- [ ] エラーログ保存実装
- [ ] ユーザーフレンドリーメッセージ実装

**Day 4**
- [ ] React.memo適用
- [ ] useCallback適用
- [ ] FlatList最適化
- [ ] DBクエリ最適化

**Day 5**
- [ ] 全テスト実行・カバレッジ確認
- [ ] ドキュメント最終確認
- [ ] リリースノート作成
- [ ] フェーズ5完了レポート作成

---

**これでフェーズ5実装計画書は完成です！** 

実装を開始する際は、このチェックリストに従って進めてください。各タスク完了時にチェックを入れることで、進捗を可視化できます。

**頑張ってください！⛳🚀**