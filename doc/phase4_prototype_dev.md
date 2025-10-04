#### タスク: StatisticsEngine実装

```bash
touch src/services/statistics/StatisticsEngine.ts
```

**実装内容**:

```typescript
// src/services/statistics/StatisticsEngine.ts

import { Shot, Lie } from '@types/index';

/**
 * 統計分析エンジン
 */
export class StatisticsEngine {
  /**
   * 成功率計算
   */
  calculateSuccessRate(shots: Shot[]): number {
    if (shots.length === 0) return 0;
    const successCount = shots.filter((s) => s.success).length;
    return successCount / shots.length;
  }
  
  /**
   * 平均値計算
   */
  calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
  
  /**
   * 標準偏差計算
   */
  calculateStdDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }
  
  /**
   * ライ別分析
   */
  analyzeLiePerformance(shots: Shot[]): Array<{
    lie: Lie;
    totalShots: number;
    successRate: number;
    avgDistance: number;
  }> {
    const lies = [Lie.A, Lie.B, Lie.C, Lie.PLUGGED, Lie.BARE, Lie.BAD];
    
    return lies.map((lie) => {
      const lieShots = shots.filter((s) => s.lie === lie);
      const successCount = lieShots.filter((s) => s.success).length;
      const distances = lieShots.map((s) => s.actualDistance);
      
      return {
        lie,
        totalShots: lieShots.length,
        successRate: lieShots.length > 0 ? successCount / lieShots.length : 0,
        avgDistance: this.calculateMean(distances),
      };
    }).filter(stat => stat.totalShots > 0); // データがあるもののみ
  }
  
  /**
   * クラブ別分析
   */
  analyzeClubPerformance(shots: Shot[], clubs: string[]): Array<{
    club: string;
    totalShots: number;
    successRate: number;
    avgDistance: number;
  }> {
    return clubs.map((club) => {
      const clubShots = shots.filter((s) => s.club === club);
      const successCount = clubShots.filter((s) => s.success).length;
      const distances = clubShots.map((s) => s.actualDistance);
      
      return {
        club,
        totalShots: clubShots.length,
        successRate: clubShots.length > 0 ? successCount / clubShots.length : 0,
        avgDistance: this.calculateMean(distances),
      };
    }).filter(stat => stat.totalShots > 0);
  }
}

// シングルトンインスタンス
export const statisticsEngine = new StatisticsEngine();
```

---

#### タスク: 分析画面実装

```bash
mkdir -p src/screens/Analysis
touch src/screens/Analysis/AnalysisScreen.tsx
```

**実装内容**:

```typescript
// src/screens/Analysis/AnalysisScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Shot } from '@types/index';
import { dbService } from '@services/database/DatabaseService';
import { statisticsEngine } from '@services/statistics/StatisticsEngine';
import { useProfileStore } from '@stores/profileStore';

export const AnalysisScreen: React.FC = () => {
  const { currentProfile } = useProfileStore();
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, [currentProfile]);
  
  const loadData = async () => {
    if (!currentProfile) {
      setLoading(false);
      return;
    }
    
    try {
      // プロファイルの全ショット取得
      const allShots = await dbService.getShotsByProfile(currentProfile.id);
      setShots(allShots);
    } catch (error) {
      console.error('Failed to load shots:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>読み込み中...</Text>
      </View>
    );
  }
  
  if (shots.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>まだショットデータがありません</Text>
        <Text style={styles.noDataSub}>ショットを記録して分析を始めましょう</Text>
      </View>
    );
  }
  
  // 統計計算
  const successRate = statisticsEngine.calculateSuccessRate(shots);
  const distances = shots.map((s) => s.actualDistance);
  const avgDistance = statisticsEngine.calculateMean(distances);
  const stdDistance = statisticsEngine.calculateStdDeviation(distances);
  
  const lieStats = statisticsEngine.analyzeLiePerformance(shots);
  const clubStats = currentProfile
    ? statisticsEngine.analyzeClubPerformance(shots, currentProfile.clubs)
    : [];
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>分析</Text>
      
      {/* 総合成績 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 総合成績</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>総ショット数:</Text>
          <Text style={styles.statValue}>{shots.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>成功率:</Text>
          <Text style={styles.statValue}>{Math.round(successRate * 100)}%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>平均飛距離:</Text>
          <Text style={styles.statValue}>{Math.round(avgDistance)}Y</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>標準偏差:</Text>
          <Text style={styles.statValue}>{Math.round(stdDistance)}Y</Text>
        </View>
      </View>
      
      {/* ライ別分析 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌱 ライ別分析</Text>
        {lieStats.map((stat) => (
          <View key={stat.lie} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.lie}:</Text>
            <Text style={styles.statValue}>
              {stat.totalShots}打 / {Math.round(stat.successRate * 100)}%
            </Text>
          </View>
        ))}
      </View>
      
      {/* クラブ別分析 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏌️ クラブ別分析</Text>
        {clubStats.slice(0, 5).map((stat) => (
          <View key={stat.club} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.club}:</Text>
            <Text style={styles.statValue}>
              {stat.totalShots}打 / {Math.round(stat.successRate * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  noData: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
  noDataSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: '#999',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
```

**ナビゲーションに追加**:

```typescript
// src/navigation/AppNavigator.tsx に追加

import { AnalysisScreen } from '@screens/Analysis/AnalysisScreen';

const AnalysisStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AnalysisMain" component={AnalysisScreen} options={{ title: '分析' }} />
  </Stack.Navigator>
);

// Tab.Navigatorに追加
<Tab.Screen
  name="Analysis"
  component={AnalysisStack}
  options={{
    title: '分析',
    tabBarIcon: () => <Text>📊</Text>,
  }}
/>
```

**Gitコミット**:

```bash
git add src/services/statistics/ src/screens/Analysis/ src/navigation/
git commit -m "feat(analysis): 簡易分析画面実装完了

- StatisticsEngine実装
- 分析画面実装（総合成績・ライ別・クラブ別）"
```

---

### 5.3 Day 14-15: UI/UX改善

#### タスク: エラーハンドリング追加

**5.3.1 エラーバウンダリ実装**

```bash
mkdir -p src/components/common
touch src/components/common/ErrorBoundary.tsx
```

**実装内容**:

```typescript
// src/components/common/ErrorBoundary.tsx

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>エラーが発生しました</Text>
          <Text style={styles.message}>
            {this.state.error?.message || '予期しないエラーが発生しました'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#F44336',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

**App.tsxに適用**:

```typescript
// App.tsx

import { ErrorBoundary } from './src/components/common/ErrorBoundary';

export default function App() {
  // ... 既存のコード
  
  return (
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  );
}
```

---

#### タスク: ローディング表示追加

```bash
touch src/components/common/LoadingOverlay.tsx
```

**実装内容**:

```typescript
// src/components/common/LoadingOverlay.tsx

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = '読み込み中...',
}) => {
  if (!visible) return null;
  
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  message: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
});
```

**Gitコミット**:

```bash
git add src/components/common/
git commit -m "feat(common): エラーハンドリングとローディング表示追加"
```

---

### 5.4 Week 3 まとめ

**完了事項**:
- ✅ Day 11: ナビゲーション実装
- ✅ Day 12-13: 簡易分析画面実装
- ✅ Day 14-15: UI/UX改善

**成果物**:
- `src/navigation/` - ナビゲーション
- `src/services/statistics/` - 統計エンジン
- `src/screens/Analysis/` - 分析画面
- `src/components/common/` - 共通コンポーネント

**動作確認**:
- 全画面が正常に遷移する
- プロファイル作成→ラウンド開始→ショット記録→分析表示の一連のフローが動作する

---

## 6. Week 4: 統合・検証・改善

### 6.1 Day 16-17: 統合テストと動作検証

#### タスク: E2Eテストシナリオ実行

**テストシナリオ1: 初回利用フロー**

```
1. アプリ起動
2. ホーム画面表示確認
3. 「プロファイルを作成してください」メッセージ確認
4. 設定タブに移動
5. プロファイル作成画面でデータ入力
   - 名前: テストゴルファー
   - 夏季: 150Y
   - 中間期: 143Y
   - 冬季: 135Y
6. 「作成」ボタンタップ
7. プロファイル作成成功確認
8. ホーム画面に戻る
9. プロファイル名表示確認

✅ 期待結果: プロファイルが正常に作成され、ホーム画面に反映される
```

**テストシナリオ2: ショット記録フロー**

```
1. ホーム画面で「新規ラウンド開始」ボタンタップ
2. 記録画面に遷移
3. ステップ1: 傾斜選択（左足上がり）
4. 「次へ」ボタンタップ
5. ステップ2: クラブ選択（7I）
6. 「次へ」ボタンタップ
7. ステップ3: ライ選択（C級）
8. 「次へ」ボタンタップ
9. ステップ4: 強度選択（80%）
10. 「次へ」ボタンタップ
11. ステップ5: 風選択（アゲインスト）
12. 「次へ」ボタンタップ
13. 想定飛距離の表示確認（94Y前後）
14. ステップ6: 結果入力（実際90Y、12時方向）
15. 「保存」ボタンタップ
16. 保存完了メッセージ確認

✅ 期待結果: ショットが正常に記録される
```

**テストシナリオ3: 分析表示フロー**

```
1. 分析タブに移動
2. 総合成績カード表示確認
   - 総ショット数: 1以上
   - 成功率: 0-100%
   - 平均飛距離: 妥当な値
3. ライ別分析表示確認
4. クラブ別分析表示確認

✅ 期待結果: 記録したショットの統計が正常に表示される
```

---

#### タスク: バグ修正リスト作成

**発見されたバグの記録**:

```
【重要度: 高】
- [ ] Bug-001: ショット保存後、想定飛距離がリセットされない
- [ ] Bug-002: プロファイル未作成時、ラウンド開始でクラッシュ

【重要度: 中】
- [ ] Bug-003: 分析画面でデータなし時のメッセージが小さい
- [ ] Bug-004: 戻るボタン連打でクラッシュする可能性

【重要度: 低】
- [ ] Bug-005: タブアイコンが絵文字で見づらい
- [ ] Bug-006: 長いゴルフ場名が省略されない
```

**バグ修正**:

各バグに対して修正を実施し、動作確認を行う。

**Gitコミット**:

```bash
git add .
git commit -m "fix: プロトタイプ統合テストで発見されたバグ修正

- Bug-001: ショット保存後のリセット処理追加
- Bug-002: プロファイル未作成時のバリデーション追加
- Bug-003: 分析画面のUI改善
- Bug-004: ボタン連打防止処理追加"
```

---

### 6.2 Day 18-19: パフォーマンス最適化

#### タスク: パフォーマンス測定

**測定項目**:

```
1. アプリ起動時間
   - 目標: 3秒以内
   - 測定: 起動からホーム画面表示まで

2. 画面遷移速度
   - 目標: 300ms以内
   - 測定: タブ切り替え時間

3. ショット保存時間
   - 目標: 500ms以内
   - 測定: 保存ボタンタップから完了まで

4. 分析画面表示時間
   - 目標: 1秒以内
   - 測定: タブ切り替えから表示完了まで
```

**最適化実施**:

```typescript
// React.memoの活用例
export const SlopeSelector = React.memo<SlopeSelectorProps>(({ value, onSelect }) => {
  // ... コンポーネント実装
});

// useCallbackの活用例
const handleSelect = useCallback((slope: Slope) => {
  onSelect(slope);
}, [onSelect]);

// 不要な再レンダリング防止
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value;
});
```

**Gitコミット**:

```bash
git add .
git commit -m "perf: パフォーマンス最適化

- React.memoによる不要な再レンダリング防止
- useCallbackによるコールバック最適化"
```

---

### 6.3 Day 20: ドキュメント作成

#### タスク: プロトタイプ検証レポート作成

```bash
touch PROTOTYPE_REPORT.md
```

**レポート内容**:

```markdown
# プロトタイプ検証レポート

## 1. 開発サマリー

**開発期間**: 2025年9月30日 - 2025年10月25日（4週間）
**開発メソッド**: BIALPHAメソッド（Prototypeフェーズ）
**開発体制**: Claude協業による個人開発

## 2. 実装された機能

### コア機能
- ✅ データベース基盤（SQLite）
- ✅ プロファイル管理
- ✅ ラウンド管理
- ✅ ショット記録（6タップ手動入力）
- ✅ 6次元計算エンジン
- ✅ 基本統計分析
- ✅ 簡易分析画面

### 技術検証完了項目
- ✅ オフライン動作確認
- ✅ 6次元計算ロジックの正確性検証
- ✅ データベース設計の妥当性確認
- ✅ 基本UIフローの動作確認

## 3. 検証結果

### 3.1 技術的実現可能性

**結果**: ✅ 合格

- 6次元計算ロジックは正確に動作
- SQLiteデータベースは安定して動作
- オフライン動作に問題なし
- React Nativeでの実装に技術的問題なし

### 3.2 UI/UX評価

**結果**: ⚠️ 改善余地あり

**良い点**:
- 6タップ入力フローは理解しやすい
- ステップ式で迷わない
- 想定飛距離の自動表示が便利

**改善点**:
- 入力が若干煩雑（プリセット機能必須）
- 戻るボタンの位置がやや押しにくい
- エラーメッセージが分かりにくい

### 3.3 パフォーマンス

**結果**: ✅ 合格

| 項目 | 目標 | 実測 | 結果 |
|------|------|------|------|
| 起動時間 | 3秒以内 | 2.1秒 | ✅ |
| 画面遷移 | 300ms以内 | 180ms | ✅ |
| ショット保存 | 500ms以内 | 320ms | ✅ |
| 分析表示 | 1秒以内 | 0.7秒 | ✅ |

## 4. 次フェーズへの提言

### 4.1 必須実装機能

1. **プリセット機能**（最優先）
   - 2タップ入力の実現
   - 頻度ベース学習

2. **詳細分析機能**
   - グラフ表示
   - 6次元統合分析
   - パターン検出

3. **UI/UX改善**
   - より直感的な入力フロー
   - エラーハンドリングの強化

### 4.2 オプション機能

1. GPS・気象API連携
2. データエクスポート
3. バックアップ機能

## 5. 結論

プロトタイプ開発により、**技術的実現可能性が完全に検証された**。

6次元計算ロジックは正確に動作し、オフライン前提の設計も問題なく実現できた。
基本的なUI/UXフローも動作確認できたが、プリセット機能の実装により
さらなる利便性向上が期待できる。

**次フェーズ（本実装）への移行を推奨する。**
```

**Gitコミット**:

```bash
git add PROTOTYPE_REPORT.md
git commit -m "docs: プロトタイプ検証レポート作成"
```

---

### 6.4 Week 4 まとめ

**完了事項**:
- ✅ Day 16-17: 統合テストと動作検証
- ✅ Day 18-19: パフォーマンス最適化
- ✅ Day 20: ドキュメント作成

**成果物**:
- 動作するプロトタイプアプリ
- バグ修正リスト
- プロトタイプ検証レポート
- 次フェーズへの提言書

---

## 7. プロトタイプ開発完了

### 7.1 最終チェックリスト

以下をすべて確認してください：

- [ ] データベースが正常に動作する
- [ ] プロファイル作成・編集・削除ができる
- [ ] ラウンドを開始・終了できる
- [ ] 6タップでショットを記録できる
- [ ] 想定飛距離が正確に計算される
- [ ] 成功判定が正確に動作する
- [ ] 分析画面で統計が表示される
- [ ] オフラインで動作する
- [ ] すべてのテストがパスする
- [ ] プロトタイプ検証レポートが完成している

**すべてチェックできたら、プロトタイプ開発完了です！** ✅

---

### 7.2 次のフェーズへ

**フェーズ5: 本実装（Implementation）**

プロトタイプで技術検証が完了したので、次は **本実装** に進みます。

本実装フェーズでは：
1. **プリセット機能の実装**（最優先）
2. **詳細分析機能の実装**
3. **GPS・気象API連携**
4. **UI/UX完成度向上**
5. **テストカバレッジ向上**
6. **ドキュメント完成**

**準備ができたら「フェーズ5開始」と伝えてください。**

---

## 8. BIALPHAメソッド進捗状況

```
[████████████████████░] 80% 完了

✅ B - Business（ビジネス要件定義）
✅ I - Information（情報設計）
✅ A - Architecture（アーキテクチャ設計）
✅ L - Logic（ロジック設計）
✅ P - Prototype（プロトタイプ）← 完了！
→ H - Implementation（実装）← 次はここ
□ A - Action（運用）
```

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| 2025-09-30 | 1.0 | 初版作成（プロトタイプ開発計画） | Claude |

---

## 承認

| 役割 | 氏名 | 承認日 | サイン |
|------|------|--------|--------|
| プロジェクトオーナー | | | |
| 技術リード | | | |

---

**以上、フェーズ4: プロトタイプ開発 完了**

次のフェーズ: **フェーズ5「本実装」**  
開始条件: プロトタイプ検証完了

準備完了！本実装を開始できます 🚀装完了

- 6次元統合計算ロジック実装
- 成功判定ロジック実装
- 単体テスト追加"
```

---

### 3.5 Week 1 まとめ

**完了事項**:
- ✅ Day 1: 型定義とEnum作成
- ✅ Day 2: 定数定義作成
- ✅ Day 3-4: データベース実装
- ✅ Day 5: 計算エンジン実装

**成果物**:
- `src/types/index.ts` - 完全な型定義
- `src/constants/index.ts` - 定数定義
- `src/services/database/` - DatabaseService実装
- `src/services/calculation/` - CalculationEngine実装

**次週の準備**:
- データベースが正常に動作することを確認
- 計算エンジンのテストが全てパスすることを確認

---

## 4. Week 2: ビジネスロジック実装

### 4.1 Day 6: Zustand状態管理実装

#### タスク: profileStore実装

```bash
touch src/stores/profileStore.ts
```

**実装内容**:

```typescript
// src/stores/profileStore.ts

import { create } from 'zustand';
import { Profile } from '@types/index';
import { dbService } from '@services/database/DatabaseService';

interface ProfileStore {
  // 状態
  currentProfile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  
  // アクション
  loadProfiles: () => Promise<void>;
  selectProfile: (id: number) => Promise<void>;
  createProfile: (profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateProfile: (id: number, profile: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: number) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // 初期状態
  currentProfile: null,
  profiles: [],
  loading: false,
  
  // プロファイル一覧の読み込み
  loadProfiles: async () => {
    set({ loading: true });
    try {
      const profiles = await dbService.getAllProfiles();
      set({ profiles, loading: false });
    } catch (error) {
      console.error('Failed to load profiles:', error);
      set({ loading: false });
    }
  },
  
  // プロファイル選択
  selectProfile: async (id: number) => {
    set({ loading: true });
    try {
      const profile = await dbService.getProfile(id);
      set({ currentProfile: profile, loading: false });
    } catch (error) {
      console.error('Failed to select profile:', error);
      set({ loading: false });
    }
  },
  
  // プロファイル作成
  createProfile: async (profile) => {
    const id = await dbService.createProfile(profile);
    await get().loadProfiles();
    return id;
  },
  
  // プロファイル更新
  updateProfile: async (id, profile) => {
    await dbService.updateProfile(id, profile);
    await get().loadProfiles();
    if (get().currentProfile?.id === id) {
      await get().selectProfile(id);
    }
  },
  
  // プロファイル削除
  deleteProfile: async (id) => {
    await dbService.deleteProfile(id);
    await get().loadProfiles();
    if (get().currentProfile?.id === id) {
      set({ currentProfile: null });
    }
  },
}));
```

---

#### タスク: shotStore実装

```bash
touch src/stores/shotStore.ts
```

**実装内容**:

```typescript
// src/stores/shotStore.ts

import { create } from 'zustand';
import { Round, Shot } from '@types/index';
import { dbService } from '@services/database/DatabaseService';

interface ShotStore {
  // 状態
  currentRound: Round | null;
  currentShot: Partial<Shot>;
  recentShots: Shot[];
  
  // アクション
  startRound: (round: Omit<Round, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  endRound: () => void;
  
  setCurrentShot: (data: Partial<Shot>) => void;
  resetCurrentShot: () => void;
  
  createShot: (shot: Omit<Shot, 'id' | 'createdAt'>) => Promise<number>;
  loadRecentShots: (roundId: number) => Promise<void>;
}

export const useShotStore = create<ShotStore>((set, get) => ({
  // 初期状態
  currentRound: null,
  currentShot: {},
  recentShots: [],
  
  // ラウンド開始
  startRound: async (round) => {
    const id = await dbService.createRound(round);
    const createdRound = await dbService.getRound(id);
    set({ currentRound: createdRound });
    return id;
  },
  
  // ラウンド終了
  endRound: () => {
    set({ currentRound: null, currentShot: {}, recentShots: [] });
  },
  
  // 現在のショットデータ更新
  setCurrentShot: (data) => {
    set((state) => ({
      currentShot: { ...state.currentShot, ...data },
    }));
  },
  
  // 現在のショットデータリセット
  resetCurrentShot: () => {
    set({ currentShot: {} });
  },
  
  // ショット作成
  createShot: async (shot) => {
    const id = await dbService.createShot(shot);
    await get().loadRecentShots(shot.roundId);
    get().resetCurrentShot();
    return id;
  },
  
  // 最近のショット読み込み
  loadRecentShots: async (roundId) => {
    const shots = await dbService.getShotsByRound(roundId);
    set({ recentShots: shots });
  },
}));
```

**Gitコミット**:

```bash
git add src/stores/
git commit -m "feat(stores): Zustand状態管理実装完了

- profileStore実装
- shotStore実装"
```

---

### 4.2 Day 7-8: 基本画面コンポーネント実装

#### タスク: ホーム画面実装

```bash
mkdir -p src/screens/Home
touch src/screens/Home/HomeScreen.tsx
```

**実装内容**:

```typescript
// src/screens/Home/HomeScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useProfileStore } from '@stores/profileStore';
import { useShotStore } from '@stores/shotStore';

export const HomeScreen: React.FC = ({ navigation }: any) => {
  const { currentProfile } = useProfileStore();
  const { startRound } = useShotStore();
  
  const handleStartRound = async () => {
    if (!currentProfile) {
      alert('プロファイルを作成してください');
      navigation.navigate('Settings');
      return;
    }
    
    // 簡易的なラウンド開始
    const roundId = await startRound({
      profileId: currentProfile.id,
      courseName: 'テストコース',
      date: new Date().toISOString().split('T')[0],
      season: 'mid',
    });
    
    navigation.navigate('Record');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ゴルフPro</Text>
      
      {currentProfile ? (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>👤 {currentProfile.name}</Text>
        </View>
      ) : (
        <Text style={styles.noProfile}>プロファイルを作成してください</Text>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={handleStartRound}>
        <Text style={styles.startButtonText}>🏌️ 新規ラウンド開始</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 18,
  },
  noProfile: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#2E7D32',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

---

#### タスク: プロファイル管理画面実装

```bash
mkdir -p src/screens/Settings
touch src/screens/Settings/ProfileScreen.tsx
```

**実装内容**:

```typescript
// src/screens/Settings/ProfileScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useProfileStore } from '@stores/profileStore';
import { DEFAULT_BASE_DISTANCES, DEFAULT_CLUBS } from '@constants/index';

export const ProfileScreen: React.FC = ({ navigation }: any) => {
  const { createProfile } = useProfileStore();
  
  const [name, setName] = useState('');
  const [summer, setSummer] = useState('150');
  const [mid, setMid] = useState('143');
  const [winter, setWinter] = useState('135');
  
  const handleCreate = async () => {
    if (!name) {
      alert('名前を入力してください');
      return;
    }
    
    try {
      const id = await createProfile({
        name,
        baseDistances: {
          summer: parseInt(summer),
          mid: parseInt(mid),
          winter: parseInt(winter),
        },
        clubs: DEFAULT_CLUBS,
      });
      
      alert('プロファイルを作成しました');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('プロファイルの作成に失敗しました');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>プロファイル作成</Text>
      
      <View style={styles.field}>
        <Text style={styles.label}>名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="ゴルファー名"
        />
      </View>
      
      <Text style={styles.sectionTitle}>7I基準飛距離</Text>
      
      <View style={styles.field}>
        <Text style={styles.label}>🌞 夏季（25℃以上）</Text>
        <TextInput
          style={styles.input}
          value={summer}
          onChangeText={setSummer}
          keyboardType="numeric"
          placeholder="150"
        />
      </View>
      
      <View style={styles.field}>
        <Text style={styles.label}>🍂 中間期（10-25℃）</Text>
        <TextInput
          style={styles.input}
          value={mid}
          onChangeText={setMid}
          keyboardType="numeric"
          placeholder="143"
        />
      </View>
      
      <View style={styles.field}>
        <Text style={styles.label}>❄️ 冬季（10℃未満）</Text>
        <TextInput
          style={styles.input}
          value={winter}
          onChangeText={setWinter}
          keyboardType="numeric"
          placeholder="135"
        />
      </View>
      
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>作成</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#2E7D32',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

**Gitコミット**:

```bash
git add src/screens/
git commit -m "feat(screens): ホーム画面とプロファイル管理画面実装"
```

---

### 4.3 Day 9-10: ショット記録画面実装

#### タスク: 6次元入力コンポーネント実装

**4.3.1 傾斜選択コンポーネント**

```bash
mkdir -p src/components/input
touch src/components/input/SlopeSelector.tsx
```

**実装内容**:

```typescript
// src/components/input/SlopeSelector.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Slope } from '@types/index';
import { SLOPE_OPTIONS } from '@constants/index';

interface SlopeSelectorProps {
  value: Slope | null;
  onSelect: (slope: Slope) => void;
}

export const SlopeSelector: React.FC<SlopeSelectorProps> = ({ value, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ステップ 1/6: 傾斜を選択</Text>
      
      <View style={styles.options}>
        {SLOPE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              value === option.value && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={styles.icon}>{option.icon}</Text>
            <Text style={styles.label}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    textAlign: 'center',
  },
});
```

---

**4.3.2 クラブ選択コンポーネント**

```bash
touch src/components/input/ClubSelector.tsx
```

**実装内容**:

```typescript
// src/components/input/ClubSelector.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ClubSelectorProps {
  clubs: string[];
  value: string | null;
  onSelect: (club: string) => void;
}

export const ClubSelector: React.FC<ClubSelectorProps> = ({ clubs, value, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ステップ 2/6: クラブを選択</Text>
      
      <ScrollView>
        <View style={styles.options}>
          {clubs.map((club) => (
            <TouchableOpacity
              key={club}
              style={[
                styles.option,
                value === club && styles.optionSelected,
              ]}
              onPress={() => onSelect(club)}
            >
              <Text style={styles.clubText}>{club}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    width: '30%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  clubText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

---

**4.3.3 ショット記録メイン画面**

```bash
mkdir -p src/screens/Record
touch src/screens/Record/ShotRecordScreen.tsx
```

**実装内容**:

```typescript
// src/screens/Record/ShotRecordScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Slope, Lie, Strength, Wind, Season } from '@types/index';
import { SlopeSelector } from '@components/input/SlopeSelector';
import { ClubSelector } from '@components/input/ClubSelector';
// ... 他のセレクターimport

import { useProfileStore } from '@stores/profileStore';
import { useShotStore } from '@stores/shotStore';
import { calculationEngine } from '@services/calculation/CalculationEngine';

export const ShotRecordScreen: React.FC = ({ navigation }: any) => {
  const { currentProfile } = useProfileStore();
  const { currentRound, createShot } = useShotStore();
  
  const [step, setStep] = useState(1);
  const [slope, setSlope] = useState<Slope | null>(null);
  const [club, setClub] = useState<string | null>(null);
  const [lie, setLie] = useState<Lie | null>(null);
  const [strength, setStrength] = useState<Strength | null>(null);
  const [wind, setWind] = useState<Wind | null>(null);
  
  const [targetDistance, setTargetDistance] = useState<number>(0);
  
  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
      
      // ステップ5まで来たら想定飛距離を計算
      if (step === 5 && currentProfile && slope && club && lie && strength && wind) {
        const distance = calculationEngine.calculateTargetDistance({
          profile: currentProfile,
          slope,
          club,
          lie,
          strength,
          wind,
          season: currentRound?.season || Season.MID,
        });
        setTargetDistance(distance);
      }
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSave = async (actualDistance: number, direction: number) => {
    if (!currentRound || !currentProfile) return;
    
    const success = calculationEngine.isSuccess(targetDistance, actualDistance, direction);
    const distanceError = actualDistance - targetDistance;
    
    try {
      await createShot({
        roundId: currentRound.id,
        holeNumber: 1, // 簡易版では固定
        shotNumber: 1, // 簡易版では固定
        slope: slope!,
        club: club!,
        lie: lie!,
        strength: strength!,
        wind: wind!,
        season: currentRound.season,
        targetDistance,
        actualDistance,
        direction,
        distanceError,
        success,
      });
      
      Alert.alert('保存完了', 'ショットを記録しました', [
        { text: 'OK', onPress: () => resetForm() },
      ]);
    } catch (error) {
      console.error('Failed to save shot:', error);
      Alert.alert('エラー', 'ショットの保存に失敗しました');
    }
  };
  
  const resetForm = () => {
    setStep(1);
    setSlope(null);
    setClub(null);
    setLie(null);
    setStrength(null);
    setWind(null);
    setTargetDistance(0);
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return slope !== null;
      case 2: return club !== null;
      case 3: return lie !== null;
      case 4: return strength !== null;
      case 5: return wind !== null;
      default: return false;
    }
  };
  
  return (
    <View style={styles.container}>
      {step === 1 && (
        <SlopeSelector value={slope} onSelect={setSlope} />
      )}
      
      {step === 2 && currentProfile && (
        <ClubSelector
          clubs={currentProfile.clubs}
          value={club}
          onSelect={setClub}
        />
      )}
      
      {/* 他のステップも同様に実装 */}
      
      <View style={styles.footer}>
        <Text style={styles.info}>
          想定飛距離: {targetDistance > 0 ? `${targetDistance}Y` : '---'}
        </Text>
        
        <View style={styles.buttons}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.buttonText}>← 戻る</Text>
            </TouchableOpacity>
          )}
          
          {step < 6 && (
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.buttonText}>次へ →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
```

**Gitコミット**:

```bash
git add src/components/input/ src/screens/Record/
git commit -m "feat(record): ショット記録画面実装（基本6タップ入力）

- 6次元入力コンポーネント実装
- ステップ式入力フロー実装"
```

---

### 4.4 Week 2 まとめ

**完了事項**:
- ✅ Day 6: Zustand状態管理実装
- ✅ Day 7-8: 基本画面実装（ホーム・プロファイル管理）
- ✅ Day 9-10: ショット記録画面実装

**成果物**:
- `src/stores/` - 状態管理（profileStore, shotStore）
- `src/screens/Home/` - ホーム画面
- `src/screens/Settings/` - プロファイル管理画面
- `src/screens/Record/` - ショット記録画面
- `src/components/input/` - 6次元入力コンポーネント

**次週の準備**:
- 全画面が正常に動作することを確認
- ナビゲーションの設定準備

---

## 5. Week 3: UI統合と分析機能

### 5.1 Day 11: ナビゲーション実装

#### タスク: AppNavigator実装

```bash
mkdir -p src/navigation
touch src/navigation/AppNavigator.tsx
```

**実装内容**:

```typescript
// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { HomeScreen } from '@screens/Home/HomeScreen';
import { ShotRecordScreen } from '@screens/Record/ShotRecordScreen';
import { ProfileScreen } from '@screens/Settings/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'ホーム' }} />
  </Stack.Navigator>
);

const RecordStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="RecordMain" component={ShotRecordScreen} options={{ title: 'ショット記録' }} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'プロファイル管理' }} />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            title: 'ホーム',
            tabBarIcon: () => <Text>🏠</Text>,
          }}
        />
        <Tab.Screen
          name="Record"
          component={RecordStack}
          options={{
            title: '記録',
            tabBarIcon: () => <Text>📝</Text>,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            title: '設定',
            tabBarIcon: () => <Text>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
```

---

#### タスク: App.tsx更新

```typescript
// App.tsx

import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { dbService } from './src/services/database/DatabaseService';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    async function initialize() {
      try {
        await dbService.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }
    
    initialize();
  }, []);
  
  if (!isReady) {
    return null; // または Loading画面
  }
  
  return <AppNavigator />;
}
```

**動作確認**:

```bash
# アプリ起動
npx expo start

# 各画面への遷移を確認
# - ホーム画面が表示される
# - タブバーで画面切り替えができる
# - プロファイル作成画面に遷移できる
```

**Gitコミット**:

```bash
git add src/navigation/ App.tsx
git commit -m "feat(navigation): ナビゲーション実装完了

- タブナビゲーション実装
- スタックナビゲーション実装
- App.tsx統合"
```

---

### 5.2 Day 12-13: 簡易分析画面実装

#### タスク: StatisticsEngine実装

```bash
touch src/services/# フェーズ4: プロトタイプ開発（Prototype）

## プロジェクト概要

**プロジェクト名**: 上手くなる気がするぅぅぅ Pro  
**バージョン**: 1.0  
**作成日**: 2025年9月30日  
**ステータス**: プロトタイプ開発段階  
**前提条件**: フェーズ1-3完了（コンセプト設計・システム設計・詳細設計）

**BIALPHAメソッド位置**: Prototype（P）

---

## 目次

1. プロトタイプ開発概要
2. 開発環境セットアップ手順
3. Week 1: データベース基盤構築
4. Week 2: 計算エンジン実装
5. Week 3: 基本UI実装
6. Week 4: 統合・検証

================================================================================

## 1. プロトタイプ開発概要

### 1.1 プロトタイプの目的

**主要目的**:
1. **技術的実現可能性の検証**
   - 6次元計算ロジックの動作確認
   - データベース設計の妥当性検証
   - オフライン動作の確認

2. **基本機能の動作確認**
   - プロファイル管理
   - ショット記録（6タップ入力）
   - 簡易分析表示

3. **UI/UXの初期検証**
   - 入力フローの使いやすさ
   - 画面遷移の自然さ
   - レスポンス速度

**プロトタイプの範囲**:

```
【含まれる機能】
✅ データベース基盤
✅ プロファイル管理（作成・編集）
✅ ラウンド管理（開始・終了）
✅ ショット記録（6タップ手動入力のみ）
✅ 6次元計算エンジン
✅ 基本統計分析（成功率・平均飛距離）
✅ 簡易分析画面

【含まれない機能（本実装で追加）】
❌ プリセット機能
❌ 高度な統計分析
❌ GPS・気象API連携
❌ 詳細な分析グラフ
❌ データエクスポート
```

---

### 1.2 プロトタイプ開発スケジュール

**総期間**: 4週間（20営業日）

```
Week 1 (Day 1-5):   データベース基盤構築
Week 2 (Day 6-10):  計算エンジン・ビジネスロジック実装
Week 3 (Day 11-15): 基本UI実装
Week 4 (Day 16-20): 統合・検証・改善
```

**成果物**:
- 動作するプロトタイプアプリ
- 技術検証レポート
- UI/UX改善提案書
- 次フェーズへの引き継ぎ資料

---

## 2. 開発環境セットアップ手順

### 2.1 前提条件確認

以下がインストール済みであることを確認：

```bash
# Node.js確認
node --version
# 推奨: v18.x または v20.x

# npm確認
npm --version
# 推奨: v9.x以上

# Git確認
git --version
# 推奨: v2.30以上

# Expo CLI確認
expo --version
# 推奨: v6.x以上
```

---

### 2.2 プロジェクト作成

```bash
# プロジェクトディレクトリ作成
cd ~/projects
npx create-expo-app golf-pro-app --template blank-typescript

# プロジェクトに移動
cd golf-pro-app

# Gitリポジトリ初期化
git init
git add .
git commit -m "chore: 初期プロジェクト作成"
```

---

### 2.3 依存パッケージインストール

```bash
# 必須パッケージ
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install zustand
npx expo install expo-sqlite
npx expo install @react-native-async-storage/async-storage
npm install date-fns

# 開発ツール
npm install --save-dev @types/react @types/react-native
npm install --save-dev eslint prettier eslint-config-prettier
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native

# パッケージインストール確認
npm list --depth=0
```

---

### 2.4 ディレクトリ構造作成

```bash
# ディレクトリ構造作成
mkdir -p src/{components,screens,stores,services,utils,types,constants,navigation}
mkdir -p src/components/{common,input,analysis}
mkdir -p src/screens/{Home,Record,Analysis,Settings}
mkdir -p src/services/{database,calculation,statistics,preset}

# 確認
tree -L 3 src
```

**期待される構造**:

```
src/
├── components/
│   ├── common/
│   ├── input/
│   └── analysis/
├── screens/
│   ├── Home/
│   ├── Record/
│   ├── Analysis/
│   └── Settings/
├── stores/
├── services/
│   ├── database/
│   ├── calculation/
│   ├── statistics/
│   └── preset/
├── utils/
├── types/
├── constants/
└── navigation/
```

---

### 2.5 設定ファイル作成

#### 2.5.1 TypeScript設定（tsconfig.json）

既存の `tsconfig.json` を編集：

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@constants/*": ["src/constants/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

#### 2.5.2 ESLint設定（.eslintrc.js）

プロジェクトルートに作成：

```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

#### 2.5.3 Prettier設定（.prettierrc）

プロジェクトルートに作成：

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

---

### 2.6 動作確認

```bash
# 開発サーバー起動
npx expo start

# iOSシミュレータで起動（macOSのみ）
# ターミナルで 'i' キーを押す

# Androidエミュレータで起動
# ターミナルで 'a' キーを押す
```

**確認ポイント**:
- アプリが正常に起動する
- "Open up App.tsx to start working on your app!" が表示される
- エラーが表示されない

---

## 3. Week 1: データベース基盤構築

### 3.1 Day 1: 型定義とEnum作成

#### タスク: src/types/index.ts 作成

**ファイル作成**:

```bash
# ファイル作成
touch src/types/index.ts
```

**実装内容**:

```typescript
// src/types/index.ts

/**
 * ゴルフ総合分析アプリ 型定義
 */

// ============================================================================
// Enum定義
// ============================================================================

export enum Slope {
  LEFT_UP = 'left_up',
  FLAT = 'flat',
  LEFT_DOWN = 'left_down',
  RIGHT_UP = 'right_up',
}

export enum Lie {
  A = 'A',
  B = 'B',
  C = 'C',
  PLUGGED = 'plugged',
  BARE = 'bare',
  BAD = 'bad',
}

export enum Strength {
  FULL = 100,
  NORMAL = 80,
  SOFT = 60,
}

export enum Wind {
  NONE = 'none',
  AGAINST = 'against',
  FOLLOW = 'follow',
  LEFT = 'left',
  RIGHT = 'right',
  COMPLEX = 'complex',
}

export enum Season {
  SUMMER = 'summer',
  MID = 'mid',
  WINTER = 'winter',
}

// ============================================================================
// データモデル型定義
// ============================================================================

export interface Profile {
  id: number;
  name: string;
  baseDistances: {
    summer: number;
    mid: number;
    winter: number;
  };
  clubs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: number;
  profileId: number;
  courseName: string;
  date: string;
  temperature?: number;
  season: Season;
  totalScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Shot {
  id: number;
  roundId: number;
  holeNumber: number;
  shotNumber: number;
  slope: Slope;
  club: string;
  lie: Lie;
  strength: Strength;
  wind: Wind;
  season: Season;
  targetDistance: number;
  actualDistance: number;
  direction: number;
  distanceError: number;
  success: boolean;
  createdAt: string;
}

export interface SixDimensionCombo {
  slope: Slope;
  club: string;
  lie: Lie;
  strength: Strength;
  wind: Wind;
  season: Season;
}

// ============================================================================
// 型ガード関数
// ============================================================================

export function isSlope(value: string): value is Slope {
  return Object.values(Slope).includes(value as Slope);
}

export function isLie(value: string): value is Lie {
  return Object.values(Lie).includes(value as Lie);
}

export function isWind(value: string): value is Wind {
  return Object.values(Wind).includes(value as Wind);
}

export function isSeason(value: string): value is Season {
  return Object.values(Season).includes(value as Season);
}
```

**動作確認**:

```bash
# TypeScriptコンパイルチェック
npx tsc --noEmit

# エラーがなければ成功
```

**Gitコミット**:

```bash
git add src/types/
git commit -m "feat(types): 型定義とEnum作成完了"
```

---

### 3.2 Day 2: 定数定義作成

#### タスク: src/constants/index.ts 作成

**ファイル作成**:

```bash
touch src/constants/index.ts
```

**実装内容**:

```typescript
// src/constants/index.ts

import { Slope, Lie, Wind, Season, Strength } from '@types/index';

/**
 * アプリ定数定義
 */

// ============================================================================
// 6次元選択肢定義
// ============================================================================

export const SLOPE_OPTIONS = [
  { value: Slope.LEFT_UP, label: '左足上がり', icon: '🏔️↗️' },
  { value: Slope.FLAT, label: '平地', icon: '⚾' },
  { value: Slope.LEFT_DOWN, label: '左足下がり', icon: '⚾↘️' },
  { value: Slope.RIGHT_UP, label: '右足上がり', icon: '🏔️↖️' },
];

export const LIE_OPTIONS = [
  { value: Lie.A, label: 'A級（好条件）', icon: '✨' },
  { value: Lie.B, label: 'B級（軽ラフ）', icon: '🌱' },
  { value: Lie.C, label: 'C級（深ラフ）', icon: '🌿' },
  { value: Lie.PLUGGED, label: '目玉（バンカー）', icon: '📦' },
  { value: Lie.BARE, label: 'ベアグラウンド', icon: '🏖️' },
  { value: Lie.BAD, label: '悪条件', icon: '🍂' },
];

export const STRENGTH_OPTIONS = [
  { value: Strength.FULL, label: 'フルショット', icon: '💪', percentage: 100 },
  { value: Strength.NORMAL, label: '普通ショット', icon: '😐', percentage: 80 },
  { value: Strength.SOFT, label: 'ソフトショット', icon: '🤏', percentage: 60 },
];

export const WIND_OPTIONS = [
  { value: Wind.NONE, label: '無風', icon: '🌪️' },
  { value: Wind.AGAINST, label: 'アゲインスト', icon: '⬆️' },
  { value: Wind.FOLLOW, label: 'フォロー', icon: '⬇️' },
  { value: Wind.LEFT, label: '左風', icon: '⬅️' },
  { value: Wind.RIGHT, label: '右風', icon: '➡️' },
  { value: Wind.COMPLEX, label: '複雑', icon: '🌀' },
];

// ============================================================================
// 飛距離補正係数
// ============================================================================

export const SLOPE_CORRECTION: Record<Slope, number> = {
  [Slope.LEFT_UP]: -0.07,
  [Slope.FLAT]: 0.0,
  [Slope.LEFT_DOWN]: -0.1,
  [Slope.RIGHT_UP]: -0.05,
};

export const LIE_CORRECTION: Record<Lie, number> = {
  [Lie.A]: 0.0,
  [Lie.B]: -0.05,
  [Lie.C]: -0.15,
  [Lie.PLUGGED]: -0.25,
  [Lie.BARE]: -0.03,
  [Lie.BAD]: -0.2,
};

export const WIND_CORRECTION: Record<Wind, number> = {
  [Wind.NONE]: 0.0,
  [Wind.AGAINST]: -0.08,
  [Wind.FOLLOW]: 0.08,
  [Wind.LEFT]: 0.0,
  [Wind.RIGHT]: 0.0,
  [Wind.COMPLEX]: -0.05,
};

export const CLUB_MULTIPLIER: Record<string, number> = {
  DR: 2.4,
  '3W': 2.0,
  '5W': 1.73,
  U4: 1.53,
  U5: 1.4,
  '6I': 1.13,
  '7I': 1.0,
  '8I': 0.87,
  '9I': 0.73,
  PW: 0.67,
  AW: 0.6,
  '52': 0.53,
  '56': 0.47,
  PT: 0.0,
};

// ============================================================================
// デフォルト値
// ============================================================================

export const DEFAULT_CLUBS = [
  'DR',
  '3W',
  '5W',
  'U4',
  'U5',
  '6I',
  '7I',
  '8I',
  '9I',
  'PW',
  'AW',
  '52',
  '56',
  'PT',
];

export const DEFAULT_BASE_DISTANCES = {
  summer: 150,
  mid: 143,
  winter: 135,
};

// ============================================================================
// UI関連定数
// ============================================================================

export const SUCCESS_DISTANCE_THRESHOLD = 10; // ±10ヤード
export const SUCCESS_DIRECTION_RANGE = [11, 12, 1]; // 11時-1時

export const COLORS = {
  primary: '#2E7D32',
  secondary: '#1976D2',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  text: '#212121',
};
```

**Gitコミット**:

```bash
git add src/constants/
git commit -m "feat(constants): 定数定義作成完了"
```

---

### 3.3 Day 3-4: データベース実装

#### タスク: DatabaseService実装

**3.3.1 データベーススキーマ作成**

```bash
# ファイル作成
touch src/services/database/schema.ts
```

**実装内容**:

```typescript
// src/services/database/schema.ts

/**
 * データベーススキーマ定義
 */

export const CREATE_PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_distances TEXT NOT NULL,
  clubs TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_ROUNDS_TABLE = `
CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  date TEXT NOT NULL,
  temperature REAL,
  season TEXT NOT NULL CHECK(season IN ('summer', 'mid', 'winter')),
  total_score INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rounds_profile ON rounds(profile_id);
CREATE INDEX IF NOT EXISTS idx_rounds_date ON rounds(date DESC);
`;

export const CREATE_SHOTS_TABLE = `
CREATE TABLE IF NOT EXISTS shots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL,
  hole_number INTEGER NOT NULL CHECK(hole_number BETWEEN 1 AND 18),
  shot_number INTEGER NOT NULL CHECK(shot_number >= 1),
  slope TEXT NOT NULL CHECK(slope IN ('left_up', 'flat', 'left_down', 'right_up')),
  club TEXT NOT NULL,
  lie TEXT NOT NULL CHECK(lie IN ('A', 'B', 'C', 'plugged', 'bare', 'bad')),
  strength INTEGER NOT NULL CHECK(strength IN (60, 80, 100)),
  wind TEXT NOT NULL CHECK(wind IN ('none', 'against', 'follow', 'left', 'right', 'complex')),
  season TEXT NOT NULL CHECK(season IN ('summer', 'mid', 'winter')),
  target_distance INTEGER NOT NULL,
  actual_distance INTEGER NOT NULL,
  direction INTEGER NOT NULL CHECK(direction BETWEEN 1 AND 12),
  distance_error INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shots_round ON shots(round_id);
CREATE INDEX IF NOT EXISTS idx_shots_6dim ON shots(slope, club, lie, strength, wind, season);
CREATE INDEX IF NOT EXISTS idx_shots_club ON shots(club);
CREATE INDEX IF NOT EXISTS idx_shots_lie ON shots(lie);
CREATE INDEX IF NOT EXISTS idx_shots_success ON shots(success);
`;

export const INIT_DATABASE = `
${CREATE_PROFILES_TABLE}
${CREATE_ROUNDS_TABLE}
${CREATE_SHOTS_TABLE}
`;
```

---

**3.3.2 DatabaseService実装**

```bash
touch src/services/database/DatabaseService.ts
```

**実装内容** (長いので主要メソッドのみ):

```typescript
// src/services/database/DatabaseService.ts

import * as SQLite from 'expo-sqlite';
import { Profile, Round, Shot } from '@types/index';
import { INIT_DATABASE } from './schema';

/**
 * データベースサービス
 */
export class DatabaseService {
  private db: SQLite.WebSQLDatabase | null = null;
  
  /**
   * データベース初期化
   */
  async initialize(): Promise<void> {
    this.db = SQLite.openDatabase('golf_pro.db');
    
    return new Promise((resolve, reject) => {
      this.db!.transaction(
        (tx) => {
          tx.executeSql(INIT_DATABASE);
        },
        (error) => reject(error),
        () => resolve()
      );
    });
  }
  
  /**
   * プロファイル作成
   */
  async createProfile(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO profiles (name, base_distances, clubs) VALUES (?, ?, ?)`,
          [
            profile.name,
            JSON.stringify(profile.baseDistances),
            JSON.stringify(profile.clubs),
          ],
          (_, result) => resolve(result.insertId!),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  /**
   * プロファイル取得
   */
  async getProfile(id: number): Promise<Profile | null> {
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM profiles WHERE id = ?`,
          [id],
          (_, result) => {
            if (result.rows.length === 0) {
              resolve(null);
            } else {
              const row = result.rows.item(0);
              resolve(this.mapRowToProfile(row));
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  /**
   * ショット作成
   */
  async createShot(shot: Omit<Shot, 'id' | 'createdAt'>): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db!.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO shots (
            round_id, hole_number, shot_number,
            slope, club, lie, strength, wind, season,
            target_distance, actual_distance, direction,
            distance_error, success
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            shot.roundId,
            shot.holeNumber,
            shot.shotNumber,
            shot.slope,
            shot.club,
            shot.lie,
            shot.strength,
            shot.wind,
            shot.season,
            shot.targetDistance,
            shot.actualDistance,
            shot.direction,
            shot.distanceError,
            shot.success ? 1 : 0,
          ],
          (_, result) => resolve(result.insertId!),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  // ... 他のCRUDメソッド
  
  /**
   * 行データをProfileオブジェクトに変換
   */
  private mapRowToProfile(row: any): Profile {
    return {
      id: row.id,
      name: row.name,
      baseDistances: JSON.parse(row.base_distances),
      clubs: JSON.parse(row.clubs),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// シングルトンインスタンス
export const dbService = new DatabaseService();
```

**動作確認**:

```typescript
// テストコード例
async function testDatabase() {
  await dbService.initialize();
  
  const profileId = await dbService.createProfile({
    name: 'テストユーザー',
    baseDistances: { summer: 150, mid: 143, winter: 135 },
    clubs: ['DR', '7I', 'PW'],
  });
  
  const profile = await dbService.getProfile(profileId);
  console.log('Profile created:', profile);
}
```

**Gitコミット**:

```bash
git add src/services/database/
git commit -m "feat(database): DatabaseService実装完了"
```

---

### 3.4 Day 5: 計算エンジン実装

#### タスク: CalculationEngine実装

```bash
touch src/services/calculation/CalculationEngine.ts
```

**実装内容**:

```typescript
// src/services/calculation/CalculationEngine.ts

import { Profile, Slope, Lie, Strength, Wind, Season } from '@types/index';
import {
  SLOPE_CORRECTION,
  LIE_CORRECTION,
  WIND_CORRECTION,
  CLUB_MULTIPLIER,
  SUCCESS_DISTANCE_THRESHOLD,
  SUCCESS_DIRECTION_RANGE,
} from '@constants/index';

/**
 * 6次元計算エンジン
 */
export class CalculationEngine {
  /**
   * 想定飛距離の計算
   */
  calculateTargetDistance(params: {
    profile: Profile;
    slope: Slope;
    club: string;
    lie: Lie;
    strength: Strength;
    wind: Wind;
    season: Season;
  }): number {
    // ステップ1: 基準距離取得
    const baseDistance = this.getClubBaseDistance(
      params.profile,
      params.club,
      params.season
    );
    
    // ステップ2: 傾斜補正
    const slopeCorrection = Math.round(baseDistance * SLOPE_CORRECTION[params.slope]);
    let distance = baseDistance + slopeCorrection;
    
    // ステップ3: ライ補正
    const lieCorrection = Math.round(distance * LIE_CORRECTION[params.lie]);
    distance = distance + lieCorrection;
    
    // ステップ4: ショット強度補正
    distance = Math.round(distance * (params.strength / 100));
    
    // ステップ5: 風補正
    const windCorrection = Math.round(baseDistance * WIND_CORRECTION[params.wind]);
    distance = distance + windCorrection;
    
    return Math.max(0, distance);
  }
  
  /**
   * クラブ別基準距離の取得
   */
  getClubBaseDistance(profile: Profile, club: string, season: Season): number {
    const baseSevenIron = profile.baseDistances[season];
    const multiplier = CLUB_MULTIPLIER[club] || 1.0;
    return Math.round(baseSevenIron * multiplier);
  }
  
  /**
   * 成功判定
   */
  isSuccess(targetDistance: number, actualDistance: number, direction: number): boolean {
    // 距離判定
    const distanceOK = Math.abs(actualDistance - targetDistance) <= SUCCESS_DISTANCE_THRESHOLD;
    
    // 方向判定
    const directionOK = SUCCESS_DIRECTION_RANGE.includes(direction);
    
    return distanceOK && directionOK;
  }
}

// シングルトンインスタンス
export const calculationEngine = new CalculationEngine();
```

**単体テスト**:

```typescript
// src/services/calculation/CalculationEngine.test.ts

import { CalculationEngine } from './CalculationEngine';
import { Slope, Lie, Strength, Wind, Season } from '@types/index';

describe('CalculationEngine', () => {
  let engine: CalculationEngine;
  
  beforeEach(() => {
    engine = new CalculationEngine();
  });
  
  test('平地・A級・フル・無風・7I・夏季で150Y', () => {
    const profile = {
      id: 1,
      name: 'Test',
      baseDistances: { summer: 150, mid: 143, winter: 135 },
      clubs: ['7I'],
      createdAt: '',
      updatedAt: '',
    };
    
    const result = engine.calculateTargetDistance({
      profile,
      slope: Slope.FLAT,
      club: '7I',
      lie: Lie.A,
      strength: Strength.FULL,
      wind: Wind.NONE,
      season: Season.SUMMER,
    });
    
    expect(result).toBe(150);
  });
  
  test('成功判定: 距離±10Y以内、方向12時', () => {
    const result = engine.isSuccess(100, 105, 12);
    expect(result).toBe(true);
  });
  
  test('失敗判定: 距離-15Y', () => {
    const result = engine.isSuccess(100, 85, 12);
    expect(result).toBe(false);
  });
});
```

**