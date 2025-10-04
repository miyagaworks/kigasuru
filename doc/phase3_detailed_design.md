| 4  | 新規ラウンド開始ボタン | Button | ラウンド開始 | RECORD-001へ遷移 |
| 5  | 最近のラウンドリスト | ListView | 直近5ラウンド表示 | タップでラウンド詳細へ |
| 6  | タブバー | TabBar | 画面切り替え | 各画面へ遷移 |

**画面遷移**:
- 新規ラウンド開始ボタン → RECORD-001（ラウンド開始画面）
- ラウンドリストアイテム → ラウンド詳細画面
- タブバー → 各タブ画面

**データ取得**:
```typescript
// 表示データの取得
interface HomeScreenData {
  profile: Profile;                    // プロファイル情報
  averageScore: number;                // 平均スコア（直近5ラウンド）
  scoreDiff: number;                   // 前回比
  recentRounds: Round[];               // 直近5ラウンド
  totalRounds: number;                 // 総ラウンド数
}
```

**画面ロジック**:
```typescript
// 平均スコア計算
function calculateAverageScore(rounds: Round[]): number {
  const recentRounds = rounds.slice(0, 5);
  const total = recentRounds.reduce((sum, r) => sum + (r.totalScore || 0), 0);
  return Math.round(total / recentRounds.length);
}

// 前回比計算
function calculateScoreDiff(rounds: Round[]): number {
  if (rounds.length < 2) return 0;
  const latest = rounds[0].totalScore || 0;
  const previous = rounds[1].totalScore || 0;
  return latest - previous;
}
```

---

#### 2.2.2 RECORD-002: ショット記録画面（6タップ入力）

**画面概要**:
- ショット記録のメイン画面
- 6次元データの入力
- 想定飛距離の自動表示

**画面レイアウト（ワイヤーフレーム）**:

```
┌─────────────────────────────────┐
│  ショット記録 - 7H 第2打          │  ← ヘッダー
├─────────────────────────────────┤
│                                 │
│  ステップ 1/6: 傾斜を選択          │  ← 進行状況
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│  │ 🏔️↗️ │ │ ⚾  │ │ ⚾↘️ │ │ 🏔️↖️ ││
│  │左足上│ │平地 │ │左足下│ │右足上││
│  └─────┘ └─────┘ └─────┘ └─────┘│
│                                 │
│  [← 戻る]              [次へ →] │
│                                 │
├─────────────────────────────────┤
│  選択中: なし                     │
│  想定飛距離: ---Y                │
└─────────────────────────────────┘

（傾斜選択後、クラブ選択画面へ）

┌─────────────────────────────────┐
│  ショット記録 - 7H 第2打          │
├─────────────────────────────────┤
│                                 │
│  ステップ 2/6: クラブを選択        │
│                                 │
│  よく使うクラブ:                  │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ 7I  │ │ PW  │ │ 9I  │        │
│  │ 68% │ │ 45% │ │ 34% │        │ ← 使用頻度
│  └─────┘ └─────┘ └─────┘        │
│                                 │
│  全てのクラブ:                    │
│  [DR][3W][5W][U4][U5]           │
│  [6I][7I][8I][9I][PW]           │
│  [AW][52][56][PT]               │
│                                 │
│  [← 戻る]              [次へ →] │
│                                 │
├─────────────────────────────────┤
│  選択中: 左足上がり               │
│  想定飛距離: ---Y                │
└─────────────────────────────────┘

（以下、ライ→強度→風向き→結果入力と続く）
```

**6ステップの詳細**:

**ステップ1: 傾斜選択**
```
選択肢:
- 🏔️↗️ 左足上がり (left_up)
- ⚾ 平地 (flat)
- ⚾↘️ 左足下がり (left_down)
- 🏔️↖️ 右足上がり (right_up)
```

**ステップ2: クラブ選択**
```
表示順:
1. よく使うクラブ（使用頻度順TOP3）
2. 全てのクラブ（プロファイル設定順）

各クラブに使用頻度（%）を表示
```

**ステップ3: ライ選択**
```
選択肢:
- ✨ A級（好条件）
- 🌱 B級（軽ラフ）
- 🌿 C級（深ラフ）
- 📦 目玉（バンカー）
- 🏖️ ベアグラウンド
- 🍂 悪条件
```

**ステップ4: ショット強度選択**
```
選択肢:
- 💪 フルショット (100%)
- 😐 普通ショット (80%)
- 🤏 ソフトショット (60%)
```

**ステップ5: 風向き選択**
```
選択肢:
- 🌪️ 無風 (none)
- ⬆️ アゲインスト (against)
- ⬇️ フォロー (follow)
- ⬅️ 左風 (left)
- ➡️ 右風 (right)
- 🌀 複雑 (complex)
```

**ステップ6: 結果入力（TargetBoard）**
```
┌─────────────────────────────────┐
│  結果を記録                       │
├─────────────────────────────────┤
│  7I・左上・C級・80%・アゲ・冬      │
│  想定飛距離: 94Y                 │
├─────────────────────────────────┤
│         12時(ターゲット)          │
│     🟢  🟢  🟢                  │
│ 9時 🟡  🟡  ⭕  🟢  🟢 3時      │
│     🟠  🟡  🟢                  │
│          6時(手前)              │
├─────────────────────────────────┤
│  凡例:                           │
│  🟢 ジャスト距離(±10Y以内)        │
│  🟡 ショート(-10〜-30Y)          │
│  🟠 大ショート(-30Y以上)         │
│  🔵 オーバー(+10〜+30Y)          │
│  🟣 大オーバー(+30Y以上)         │
├─────────────────────────────────┤
│  [💾 保存]  [↶ やり直し]         │
└─────────────────────────────────┘
```

**想定飛距離の自動計算**:

```typescript
// 6次元補正による想定飛距離計算
function calculateTargetDistance(params: {
  baseDistance: number;  // 7I基準距離（季節別）
  slope: Slope;
  lie: Lie;
  strength: Strength;
  wind: Wind;
  season: Season;
}): number {
  let distance = params.baseDistance;
  
  // 1. 傾斜補正
  distance += getSlopeCorrection(params.slope, distance);
  
  // 2. ライ補正
  distance += getLieCorrection(params.lie, distance);
  
  // 3. 強度補正
  distance = distance * (params.strength / 100);
  
  // 4. 風補正
  distance += getWindCorrection(params.wind, distance);
  
  return Math.round(distance);
}
```

**画面遷移**:
- 各ステップで「次へ」→ 次のステップ
- 「戻る」→ 前のステップ
- ステップ6で「保存」→ ホーム画面またはラウンド継続

**バリデーション**:
- 各ステップで必ず選択が必要
- 選択なしでは「次へ」ボタン無効化

---

#### 2.2.3 RECORD-003: プリセット選択画面

**画面概要**:
- 頻出パターンのワンタップ選択
- 実質2タップでショット記録完了

**画面レイアウト（ワイヤーフレーム）**:

```
┌─────────────────────────────────┐
│  よく使うパターン                 │  ← ヘッダー
├─────────────────────────────────┤
│                                 │
│  📌 TOP 5 プリセット              │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 1️⃣ 左上・7I・B級・80%・アゲ・冬 │  │
│  │    使用回数: 42回           │  │
│  │    成功率: 68%              │  │
│  │    [選択]                   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 2️⃣ 平地・PW・A級・フル・無風・夏│  │
│  │    使用回数: 31回           │  │
│  │    成功率: 82%              │  │
│  │    [選択]                   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 3️⃣ 左上・9I・B級・80%・アゲ・冬 │  │
│  │    使用回数: 19回           │  │
│  │    成功率: 53%              │  │
│  │    [選択]                   │  │
│  └───────────────────────────┘  │
│                                 │
│  [手動入力]          [閉じる]    │
└─────────────────────────────────┘
```

**UI要素詳細**:

| No | 要素名 | タイプ | 説明 | アクション |
|----|--------|--------|------|-----------|
| 1  | プリセットカード | Card | 6次元の組み合わせ表示 | タップで選択 |
| 2  | 使用回数 | Text | 過去の使用回数 | - |
| 3  | 成功率 | Text | このパターンの成功率 | - |
| 4  | 選択ボタン | Button | プリセット選択 | TargetBoard画面へ |
| 5  | 手動入力ボタン | Button | 通常の6タップ入力 | RECORD-002へ |

**プリセット選択後の流れ**:
1. プリセット選択（1タップ目）
2. 想定飛距離が自動計算される
3. TargetBoard画面へ遷移
4. 結果入力（2タップ目）
5. 保存完了

**実質2タップ入力の実現**:
```
通常: 6タップ（傾斜→クラブ→ライ→強度→風→結果）
プリセット: 2タップ（プリセット選択→結果）
```

---

#### 2.2.4 ANALYSIS-001: 分析トップ画面

**画面概要**:
- 統計データの可視化
- 各種分析へのアクセス

**画面レイアウト（ワイヤーフレーム）**:

```
┌─────────────────────────────────┐
│  分析                            │  ← ヘッダー
├─────────────────────────────────┤
│                                 │
│  📊 総合成績                     │
│  ┌───────────────────────────┐  │
│  │ 総ショット数: 1,247          │  │
│  │ 成功率: 62%                 │  │
│  │ 平均飛距離: 138Y            │  │
│  └───────────────────────────┘  │
│                                 │
│  📈 成功率推移（直近10ラウンド）   │
│  ┌───────────────────────────┐  │
│  │     ●                       │  │
│  │   ●   ●                     │  │
│  │ ●       ●   ●               │  │
│  │             ● ●   ●         │  │
│  │                   ● ●       │  │
│  └───────────────────────────┘  │
│                                 │
│  🎯 詳細分析                     │
│  ┌─────────┐ ┌─────────┐       │
│  │ ライ別   │ │ クラブ別 │       │
│  │ 分析     │ │ 分析     │       │
│  └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐       │
│  │ 傾斜別   │ │ 風向き別 │       │
│  │ 分析     │ │ 分析     │       │
│  └─────────┘ └─────────┘       │
│                                 │
├─────────────────────────────────┤
│ [ホーム][記録][分析][設定]       │  ← タブバー
└─────────────────────────────────┘
```

**UI要素詳細**:

| No | 要素名 | タイプ | 説明 | アクション |
|----|--------|--------|------|-----------|
| 1  | 総合成績カード | Card | 全体の統計 | - |
| 2  | 成功率推移グラフ | LineChart | 折れ線グラフ | - |
| 3  | ライ別分析ボタン | Button | ライ別詳細へ | ANALYSIS-002へ |
| 4  | クラブ別分析ボタン | Button | クラブ別詳細へ | ANALYSIS-003へ |
| 5  | 傾斜別分析ボタン | Button | 傾斜別詳細へ | - |
| 6  | 風向き別分析ボタン | Button | 風向き別詳細へ | - |

---

#### 2.2.5 ANALYSIS-002: ライ別分析画面

**画面概要**:
- ライ状況別の成績表示
- 6段階ライの詳細分析

**画面レイアウト（ワイヤーフレーム）**:

```
┌─────────────────────────────────┐
│  ← ライ別分析                    │  ← ヘッダー
├─────────────────────────────────┤
│                                 │
│  📊 ライ別成功率                 │
│  ┌───────────────────────────┐  │
│  │ A級 ████████ 78%            │  │
│  │ B級 ██████   65%            │  │
│  │ C級 ███      31% ⚠️          │  │
│  │ 目玉 ██       23% 🚨         │  │
│  │ ベア ████     41%            │  │
│  │ 悪条件 █       18% 🚨        │  │
│  └───────────────────────────┘  │
│                                 │
│  💡 分析結果                     │
│  ┌───────────────────────────┐  │
│  │ 最優先課題: 深ラフ(C級)対策  │  │
│  │                             │  │
│  │ あなたの成功率: 31%         │  │
│  │ 一般平均: 55%               │  │
│  │ 差: -24% 🔴                 │  │
│  │                             │  │
│  │ 推奨練習:                   │  │
│  │ • 深ラフからの脱出練習      │  │
│  │ • 1番手上げる戦略           │  │
│  └───────────────────────────┘  │
│                                 │
│  📈 ライ別詳細データ             │
│  ┌───────────────────────────┐  │
│  │ C級ライ（深ラフ）            │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │ 総ショット数: 147           │  │
│  │ 成功数: 46                  │  │
│  │ 成功率: 31%                 │  │
│  │ 平均飛距離: 102Y            │  │
│  │ 標準偏差: 18Y               │  │
│  │                             │  │
│  │ よくある失敗パターン:        │  │
│  │ • 距離不足 (58%)            │  │
│  │ • 右へのミス (28%)          │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**表示データ**:

```typescript
interface LieAnalysisData {
  lieName: Lie;
  totalShots: number;
  successCount: number;
  successRate: number;
  avgDistance: number;
  stdDistance: number;
  commonMistakes: {
    type: string;      // '距離不足', '右ミス'等
    percentage: number;
  }[];
}
```

**分析ロジック**:

```typescript
// ライ別成功率の計算
function calculateLieSuccessRate(shots: Shot[], lie: Lie): number {
  const lieShots = shots.filter(s => s.lie === lie);
  const successCount = lieShots.filter(s => s.success).length;
  return lieShots.length > 0 ? successCount / lieShots.length : 0;
}

// 一般平均との比較
function compareToBenchmark(userRate: number, benchmark: number): string {
  const diff = userRate - benchmark;
  if (diff >= 10) return '優秀';
  if (diff >= 0) return '良好';
  if (diff >= -10) return '改善の余地あり';
  return '要改善';
}
```

---

### 2.3 画面遷移図

```
┌──────────────┐
│  ホーム画面   │
│  (HOME-001)  │
└──────┬───────┘
       │
       ├─→ [新規ラウンド開始]
       │    ↓
       │  ┌──────────────────┐
       │  │ ラウンド開始画面  │
       │  │ (RECORD-001)     │
       │  └────────┬─────────┘
       │           │
       │           ├─→ [プリセット使用]
       │           │    ↓
       │           │  ┌──────────────────┐
       │           │  │ プリセット選択   │
       │           │  │ (RECORD-003)     │
       │           │  └────────┬─────────┘
       │           │           │
       │           │           ├─→ [プリセット選択]
       │           │           │    ↓
       │           │           │  ┌──────────────────┐
       │           │           │  │ TargetBoard      │
       │           │           │  │ (RECORD-004)     │
       │           │           │  └────────┬─────────┘
       │           │           │           │
       │           │           │          [保存]
       │           │           │           │
       │           ├─→ [手動入力]        │
       │           │    ↓                 │
       │           │  ┌──────────────────┐│
       │           │  │ ショット記録     ││
       │           │  │ (RECORD-002)     ││
       │           │  └────────┬─────────┘│
       │           │           │          │
       │           │          [6ステップ]  │
       │           │           │          │
       │           │           └──────────┘
       │           │
       │          [完了]
       │           │
       ├───────────┴─→ ホーム画面へ戻る
       │
       ├─→ [タブ: 分析]
       │    ↓
       │  ┌──────────────────┐
       │  │ 分析トップ画面    │
       │  │ (ANALYSIS-001)   │
       │  └────────┬─────────┘
       │           │
       │           ├─→ [ライ別分析]
       │           │    ↓
       │           │  ┌──────────────────┐
       │           │  │ ライ別分析画面   │
       │           │  │ (ANALYSIS-002)   │
       │           │  └──────────────────┘
       │           │
       │           ├─→ [クラブ別分析]
       │           │    ↓
       │           │  ┌──────────────────┐
       │           │  │ クラブ別分析画面  │
       │           │  │ (ANALYSIS-003)   │
       │           │  └──────────────────┘
       │           │
       │          [戻る]
       │           │
       ├───────────┴─→ 分析トップへ戻る
       │
       └─→ [タブ: 設定]
            ↓
          ┌──────────────────┐
          │ 設定トップ画面    │
          │ (SETTINGS-001)   │
          └────────┬─────────┘
                   │
                   ├─→ [プロファイル管理]
                   │    ↓
                   │  ┌──────────────────┐
                   │  │ プロファイル管理  │
                   │  │ (SETTINGS-002)   │
                   │  └──────────────────┘
                   │
                  [戻る]
                   │
                   └─→ 設定トップへ戻る
```

---

## 3. 6次元計算ロジック詳細設計書

### 3.1 計算エンジン概要

**目的**: 6次元データに基づく想定飛距離の自動計算

**入力**:
- 基準距離（7I・季節別）
- 傾斜 (Slope)
- ライ (Lie)
- ショット強度 (Strength)
- 風向き (Wind)
- 季節 (Season)

**出力**:
- 想定飛距離（ヤード）

---

### 3.2 補正係数定義

#### 3.2.1 傾斜補正係数

**計算式**:

```typescript
// 傾斜による飛距離補正（基準距離の％）
const SLOPE_CORRECTION: Record<Slope, number> = {
  left_up: -0.07,      // -7%（左足上がり：飛距離減）
  flat: 0.00,          // ±0%（平地：補正なし）
  left_down: -0.10,    // -10%（左足下がり：飛距離大幅減）
  right_up: -0.05,     // -5%（右足上がり：やや飛距離減）
};

// 補正値の計算
function getSlopeCorrection(slope: Slope, baseDistance: number): number {
  return Math.round(baseDistance * SLOPE_CORRECTION[slope]);
}
```

**例**:
```
7I基準距離150Y、左足上がりの場合
補正: 150 × (-0.07) = -10.5Y → -11Y
```

---

#### 3.2.2 ライ補正係数

**計算式**:

```typescript
// ライによる飛距離補正（基準距離の％）
const LIE_CORRECTION: Record<Lie, number> = {
  A: 0.00,             // ±0%（A級：補正なし）
  B: -0.05,            // -5%（B級軽ラフ：やや飛距離減）
  C: -0.15,            // -15%（C級深ラフ：大幅飛距離減）
  plugged: -0.25,      // -25%（目玉：非常に飛距離減）
  bare: -0.03,         // -3%（ベアグラウンド：やや飛距離減）
  bad: -0.20,          // -20%（悪条件：大幅飛距離減）
};

// 補正値の計算
function getLieCorrection(lie: Lie, baseDistance: number): number {
  return Math.round(baseDistance * LIE_CORRECTION[lie]);
}
```

**例**:
```
7I基準距離150Y、C級ライの場合
補正: 150 × (-0.15) = -22.5Y → -23Y
```

---

#### 3.2.3 ショット強度補正

**計算式**:

```typescript
// ショット強度による補正（乗算）
const STRENGTH_MULTIPLIER: Record<Strength, number> = {
  100: 1.00,           // 100%（フルショット）
  80: 0.80,            // 80%（普通ショット）
  60: 0.60,            // 60%（ソフトショット）
};

// 補正後の距離
function applyStrengthCorrection(distance: number, strength: Strength): number {
  return Math.round(distance * STRENGTH_MULTIPLIER[strength]);
}
```

**例**:
```
補正後距離127Y、80%ショットの場合
127 × 0.80 = 101.6Y → 102Y
```

---

#### 3.2.4 風向き補正係数

**計算式**:

```typescript
// 風向きによる飛距離補正（基準距離の％）
const WIND_CORRECTION: Record<Wind, number> = {
  none: 0.00,          // ±0%（無風）
  against: -0.08,      // -8%（アゲインスト：飛距離減）
  follow: +0.08,       // +8%（フォロー：飛距離増）
  left: 0.00,          // ±0%（横風：飛距離への影響小）
  right: 0.00,         // ±0%（横風：飛距離への影響小）
  complex: -0.05,      // -5%（複雑な風：やや飛距離減）
};

// 補正値の計算
function getWindCorrection(wind: Wind, baseDistance: number): number {
  return Math.round(baseDistance * WIND_CORRECTION[wind]);
}
```

**例**:
```
7I基準距離150Y、アゲインストの場合
補正: 150 × (-0.08) = -12Y
```

---

#### 3.2.5 季節補正（基準距離設定時点で反映済み）

**基準距離の設定**:

```typescript
// プロファイル設定での7I基準距離
interface BaseDistances {
  summer: number;      // 夏季（25℃以上）: 150Y
  mid: number;         // 中間期（10-25℃）: 143Y
  winter: number;      // 冬季（10℃未満）: 135Y
}

// 季節に応じた基準距離の取得
function getSeasonBaseDistance(
  baseDistances: BaseDistances,
  season: Season
): number {
  return baseDistances[season];
}
```

**注意**: 季節補正は基準距離選択時に既に反映されているため、
6次元計算では追加の季節補正は不要。

---

### 3.3 6次元統合計算アルゴリズム

**完全な計算フロー**:

```typescript
/**
 * 6次元統合計算エンジン
 */
class CalculationEngine {
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
    // ステップ1: 基準距離取得（季節別）
    const baseDistance = this.getClubBaseDistance(
      params.profile,
      params.club,
      params.season
    );
    
    // ステップ2: 傾斜補正
    const slopeCorrection = this.getSlopeCorrection(params.slope, baseDistance);
    let distance = baseDistance + slopeCorrection;
    
    // ステップ3: ライ補正
    const lieCorrection = this.getLieCorrection(params.lie, distance);
    distance = distance + lieCorrection;
    
    // ステップ4: ショット強度補正（乗算）
    distance = distance * (params.strength / 100);
    
    // ステップ5: 風補正
    const windCorrection = this.getWindCorrection(params.wind, baseDistance);
    distance = distance + windCorrection;
    
    // ステップ6: 丸め処理
    return Math.round(distance);
  }
  
  /**
   * クラブ別基準距離の取得
   */
  private getClubBaseDistance(
    profile: Profile,
    club: string,
    season: Season
  ): number {
    // 7I基準距離取得
    const baseSevenIron = profile.baseDistances[season];
    
    // クラブ係数テーブル
    const CLUB_MULTIPLIER: Record<string, number> = {
      'DR': 2.40,   // 7Iの240%
      '3W': 2.00,   // 7Iの200%
      '5W': 1.73,   // 7Iの173%
      'U4': 1.53,   // 7Iの153%
      'U5': 1.40,   // 7Iの140%
      '6I': 1.13,   // 7Iの113%
      '7I': 1.00,   // 基準
      '8I': 0.87,   // 7Iの87%
      '9I': 0.73,   // 7Iの73%
      'PW': 0.67,   // 7Iの67%
      'AW': 0.60,   // 7Iの60%
      '52': 0.53,   // 7Iの53%
      '56': 0.47,   // 7Iの47%
      'PT': 0.00,   // パターは別計算
    };
    
    const multiplier = CLUB_MULTIPLIER[club] || 1.00;
    return Math.round(baseSevenIron * multiplier);
  }
  
  /**
   * 成功判定
   */
  isSuccess(
    targetDistance: number,
    actualDistance: number,
    direction: number
  ): boolean {
    // 距離判定: ±10ヤード以内
    const distanceOK = Math.abs(actualDistance - targetDistance) <= 10;
    
    // 方向判定: 11時-1時の範囲（ターゲット±1時間）
    const directionOK = direction >= 11 || direction <= 1;
    
    return distanceOK && directionOK;
  }
}
```

**計算例**:

```
【入力】
プロファイル: 7I冬季基準135Y
傾斜: 左足上がり
クラブ: 7I
ライ: C級（深ラフ）
強度: 80%
風: アゲインスト
季節: 冬季

【計算プロセス】
1. 基準距離: 135Y（7I・冬季）
2. 傾斜補正: 135 × (-0.07) = -9.45 → -9Y
   → 126Y
3. ライ補正: 126 × (-0.15) = -18.9 → -19Y
   → 107Y
4. 強度補正: 107 × 0.80 = 85.6 → 86Y
5. 風補正: 135 × (-0.08) = -10.8 → -11Y
   → 75Y
6. 最終想定飛距離: 75Y

【出力】
想定飛距離: 75Y
```

---

### 3.4 補正係数の妥当性検証

**検証方法**:
- 実データ収集による補正係数の調整
- 統計分析による最適化
- ユーザーフィードバックによる継続的改善

**初期値の根拠**:

| 補正項目 | 初期値 | 根拠 |
|---------|--------|------|
| 左足上がり | -7% | 一般的なゴルフ理論 |
| 深ラフ | -15% | プロツアーデータ参考 |
| アゲインスト | -8% | 風速2-3m/s想定 |

**将来的な改善**:
- ユーザー個別の補正係数学習
- 実測データによる係数最適化
- コース別・気象条件別の細分化

---

## 4. 統計分析ロジック詳細設計書

### 4.1 統計分析エンジン概要

**目的**: ショットデータの統計分析と可視化

**提供機能**:
1. 基本統計量計算（平均・標準偏差）
2. 成功率分析
3. ライ別分析
4. クラブ別分析
5. パターン検出（頻度分析）
6. 相関分析

---

### 4.2 基本統計量計算

#### 4.2.1 平均・標準偏差

**計算式**:

```typescript
/**
 * 基本統計量の計算
 */
class StatisticsEngine {
  /**
   * 平均値
   */
  calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
  
  /**
   * 標準偏差
   */
  calculateStdDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }
  
  /**
   * 中央値
   */
  calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
```

---

#### 4.2.2 成功率計算

**計算式**:

```typescript
/**
 * 成功率の計算
 */
calculateSuccessRate(shots: Shot[]): number {
  if (shots.length === 0) return 0;
  const successCount = shots.filter(s => s.success).length;
  return successCount / shots.length;
}

/**
 * 条件付き成功率
 */
calculateConditionalSuccessRate(
  shots: Shot[],
  condition: (shot: Shot) => boolean
): number {
  const filtered = shots.filter(condition);
  return this.calculateSuccessRate(filtered);
}
```

**例**:

```typescript
// ライ別成功率
const cLieSuccessRate = calculateConditionalSuccessRate(
  allShots,
  shot => shot.lie === Lie.C
);

// クラブ別成功率
const sevenIronSuccessRate = calculateConditionalSuccessRate(
  allShots,
  shot => shot.club === '7I'
);
```

---

### 4.3 ライ別分析

**分析内容**:

```typescript
/**
 * ライ別統計データ
 */
interface LieStats {
  lie: Lie;
  totalShots: number;
  successCount: number;
  successRate: number;
  avgDistance: number;
  stdDistance: number;
  avgDistanceError: number;
  commonMistakes: {
    type: string;
    percentage: number;
  }[];
}

/**
 * ライ別分析の実行
 */
analyzeLiePerformance(shots: Shot[]): LieStats[] {
  const lies = [Lie.A, Lie.B, Lie.C, Lie.PLUGGED, Lie.BARE, Lie.BAD];
  
  return lies.map(lie => {
    const lieShots = shots.filter(s => s.lie === lie);
    const successCount = lieShots.filter(s => s.success).length;
    const distances = lieShots.map(s => s.actualDistance);
    const errors = lieShots.map(s => s.distanceError);
    
    return {
      lie,
      totalShots: lieShots.length,
      successCount,
      successRate: successCount / lieShots.length,
      avgDistance: this.calculateMean(distances),
      stdDistance: this.calculateStdDeviation(distances),
      avgDistanceError: this.calculateMean(errors),
      commonMistakes: this.analyzeCommonMistakes(lieShots),
    };
  });
}

/**
 * よくある失敗パターンの分析
 */
analyzeCommonMistakes(shots: Shot[]): Array<{type: string; percentage: number}> {
  const failedShots = shots.filter(s => !s.success);
  const total = failedShots.length;
  
  if (total === 0) return [];
  
  // 距離不足
  const shortCount = failedShots.filter(s => s.distanceError < -10).length;
  
  // 距離オーバー
  const longCount = failedShots.filter(s => s.distanceError > 10).length;
  
  // 方向ミス（左）
  const leftCount = failedShots.filter(s => 
    s.direction >= 2 && s.direction <= 6
  ).length;
  
  // 方向ミス（右）
  const rightCount = failedShots.filter(s => 
    s.direction >= 7 && s.direction <= 10
  ).length;
  
  return [
    { type: '距離不足', percentage: (shortCount / total) * 100 },
    { type: '距離オーバー', percentage: (longCount / total) * 100 },
    { type: '左へのミス', percentage: (leftCount / total) * 100 },
    { type: '右へのミス', percentage: (rightCount / total) * 100 },
  ].filter(m => m.percentage > 0);
}
```

---

### 4.4 クラブ別分析

**分析内容**:

```typescript
/**
 * クラブ別統計データ
 */
interface ClubStats {
  club: string;
  totalShots: number;
  successCount: number;
  successRate: number;
  avgDistance: number;
  stdDistance: number;
  reliability: number;  // 安定度（標準偏差の逆数）
}

/**
 * クラブ別分析の実行
 */
analyzeClubPerformance(shots: Shot[], clubs: string[]): ClubStats[] {
  return clubs.map(club => {
    const clubShots = shots.filter(s => s.club === club);
    const successCount = clubShots.filter(s => s.success).length;
    const distances = clubShots.map(s => s.actualDistance);
    const stdDistance = this.calculateStdDeviation(distances);
    
    return {
      club,
      totalShots: clubShots.length,
      successCount,
      successRate: clubShots.length > 0 ? successCount / clubShots.length : 0,
      avgDistance: this.calculateMean(distances),
      stdDistance,
      reliability: stdDistance > 0 ? 1 / stdDistance : 1,
    };
  }).sort((a, b) => b.successRate - a.successRate);
}
```

---

### 4.5 パターン検出（頻度分析）

**分析内容**:

```typescript
/**
 * パターン検出結果
 */
interface Pattern {
  combination: SixDimensionCombo;
  frequency: number;
  successRate: number;
  avgDistance: number;
  description: string;
}

/**
 * 頻出パターンの検出
 */
detectPatterns(shots: Shot[], minFrequency: number = 5): Pattern[] {
  // 6次元の組み合わせをグループ化
  const groups = new Map<string, Shot[]>();
  
  shots.forEach(shot => {
    const key = this.createComboKey(shot);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(shot);
  });
  
  // 頻度がminFrequency以上のパターンを抽出
  const patterns: Pattern[] = [];
  
  groups.forEach((groupShots, key) => {
    if (groupShots.length >= minFrequency) {
      const successCount = groupShots.filter(s => s.success).length;
      const distances = groupShots.map(s => s.actualDistance);
      
      patterns.push({
        combination: this.parseComboKey(key),
        frequency: groupShots.length,
        successRate: successCount / groupShots.length,
        avgDistance: this.calculateMean(distances),
        description: this.generateDescription(groupShots[0]),
      });
    }
  });
  
  // 頻度順にソート
  return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * 6次元組み合わせのキー生成
 */
private createComboKey(shot: Shot): string {
  return `${shot.slope}_${shot.club}_${shot.lie}_${shot.strength}_${shot.wind}_${shot.season}`;
}

/**
 * パターン説明文の生成
 */
private generateDescription(shot: Shot): string {
  const slopeNames = {
    left_up: '左足上がり',
    flat: '平地',
    left_down: '左足下がり',
    right_up: '右足上がり',
  };
  
  const lieNames = {
    A: 'A級',
    B: 'B級軽ラフ',
    C: 'C級深ラフ',
    plugged: '目玉',
    bare: 'ベアグラウンド',
    bad: '悪条件',
  };
  
  const windNames = {
    none: '無風',
    against: 'アゲインスト',
    follow: 'フォロー',
    left: '左風',
    right: '右風',
    complex: '複雑な風',
  };
  
  return `${slopeNames[shot.slope]}・${shot.club}・${lieNames[shot.lie]}・${shot.strength}%・${windNames[shot.wind]}・${shot.season}`;
}
```

---

### 4.6 相関分析

**分析内容**:

```typescript
/**
 * 相関係数の計算（ピアソンの積率相関係数）
 */
calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = this.calculateMean(x);
  const meanY = this.calculateMean(y);
  
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denominatorX += diffX * diffX;
    denominatorY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * 次元間の相関分析
 */
analyzeDimensionCorrelation(shots: Shot[]): {
  dimension1: string;
  dimension2: string;
  correlation: number;
}[] {
  const results = [];
  
  // ライと成功率の相関
  const lieValues = shots.map(s => this.lieToNumeric(s.lie));
  const successValues = shots.map(s => s.success ? 1 : 0);
  results.push({
    dimension1: 'ライ',
    dimension2: '成功率',
    correlation: this.calculateCorrelation(lieValues, successValues),
  });
  
  // 風と距離誤差の相関
  const windValues = shots.map(s => this.windToNumeric(s.wind));
  const errorValues = shots.map(s => s.distanceError);
  results.push({
    dimension1: '風',
    dimension2: '距離誤差',
    correlation: this.calculateCorrelation(windValues, errorValues),
  });
  
  return results;
}

/**
 * ライの数値化（順序尺度）
 */
private lieToNumeric(lie: Lie): number {
  const mapping = { A: 5, B: 4, C: 2, plugged: 1, bare: 3, bad: 1 };
  return mapping[lie] || 0;
}

/**
 * 風の数値化
 */
private windToNumeric(wind: Wind): number {
  const mapping = { none: 0, against: -1, follow: 1, left: 0, right: 0, complex: -0.5 };
  return mapping[wind] || 0;
}
```

---

### 4.7 統計キャッシュの更新戦略

**キャッシュ更新タイミング**:

```typescript
/**
 * 統計キャッシュ更新マネージャー
 */
class StatisticsCacheManager {
  /**
   * ショット追加時の非同期更新
   */
  async updateOnShotAdded(shot: Shot, profileId: number): Promise<void> {
    // 更新対象の統計を特定
    const updates = [
      { type: 'club', value: shot.club },
      { type: 'lie', value: shot.lie },
      { type: 'slope', value: shot.slope },
      { type: 'wind', value: shot.wind },
      { type: 'overall', value: 'all' },
    ];
    
    // 非同期で各統計を更新
    await Promise.all(
      updates.map(u => this.updateStatistic(profileId, u.type, u.value))
    );
  }
  
  /**
   * ラウンド終了時の全統計再計算
   */
  async updateOnRoundComplete(roundId: number, profileId: number): Promise<void> {
    // 該当ラウンドの全ショット取得
    const shots = await this.db.getShotsByRound(roundId);
    
    // 全統計を再計算
    await this.recalculateAllStatistics(profileId, shots);
  }
  
  /**
   * 統計の再計算
   */
  private async updateStatistic(
    profileId: number,
    type: string,
    value: string
  ): Promise<void> {
    // 該当データ取得
    const shots = await this.db.getShots({ profileId, [type]: value });
    
    // 統計値計算
    const successRate = this.calculateSuccessRate(shots);
    const avgDistance = this.calculateMean(shots.map(s => s.actualDistance));
    const stdDistance = this.calculateStdDeviation(shots.map(s => s.actualDistance));
    
    // statisticsテーブルに保存（UPSERT）
    await this.db.upsertStatistic({
      profileId,
      statType: 'success_rate',
      dimension: type,
      dimensionValue: value,
      successRate,
      avgDistance,
      stdDistance,
      sampleCount: shots.length,
      updatedAt: new Date().toISOString(),
    });
  }
}
```

---

## 5. プリセット学習ロジック詳細設計書

### 5.1 プリセット学習エンジン概要

**目的**: 頻度ベースのプリセット学習

**機能**:
1. 6次元組み合わせの使用回数記録
2. TOP5プリセットの抽出
3. コース別頻出パターンの特定

---

### 5.2 プリセット記録ロジック

**記録アルゴリズム**:

```typescript
/**
 * プリセット学習エンジン
 */
class PresetLearningEngine {
  /**
   * プリセット使用の記録
   */
  async recordUsage(
    profileId: number,
    combination: SixDimensionCombo
  ): Promise<void> {
    // 既存のプリセット検索
    const existing = await this.db.findPreset(profileId, combination);
    
    if (existing) {
      // 既存の場合: 使用回数をインクリメント
      await this.db.updatePreset(existing.id, {
        usageCount: existing.usageCount + 1,
        lastUsedAt: new Date().toISOString(),
      });
    } else {
      // 新規の場合: プリセット作成
      await this.db.createPreset({
        profileId,
        ...combination,
        usageCount: 1,
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
  }
  
  /**
   * TOP5プリセットの取得
   */
  async getTopPresets(profileId: number, limit: number = 5): Promise<Preset[]> {
    return await this.db.getPresets({
      profileId,
      orderBy: 'usageCount DESC',
      limit,
    });
  }
  
  /**
   * コース別頻出パターンの取得
   */
  async getCoursePresets(
    profileId: number,
    courseName: string,
    limit: number = 5
  ): Promise<Preset[]> {
    // 該当コースのラウンド取得
    const rounds = await this.db.getRounds({ profileId, courseName });
    const roundIds = rounds.map(r => r.id);
    
    // 該当ラウンドのショット取得
    const shots = await this.db.getShots({ roundId: roundIds });
    
    // 6次元組み合わせの頻度カウント
    const frequency = this.countCombinations(shots);
    
    // 頻度順にソート
    return frequency
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * 6次元組み合わせの頻度カウント
   */
  private countCombinations(shots: Shot[]): Array<{
    combination: SixDimensionCombo;
    count: number;
  }> {
    const map = new Map<string, number>();
    
    shots.forEach(shot => {
      const key = this.createComboKey(shot);
      map.set(key, (map.get(key) || 0) + 1);
    });
    
    const result = [];
    map.forEach((count, key) => {
      result.push({
        combination: this.parseComboKey(key),
        count,
      });
    });
    
    return result;
  }
}
```

---

### 5.3 プリセット推奨ロジック

**推奨アルゴリズム**:

```typescript
/**
 * プリセット推奨エンジン
 */
class PresetRecommendationEngine {
  /**
   * 状況に応じたプリセット推奨
   */
  async recommendPresets(
    profileId: number,
    context: {
      courseName?: string;
      season: Season;
      recentShots?: Shot[];
    }
  ): Promise<Preset[]> {
    // 1. コース別プリセット
    const coursePresets = context.courseName
      ? await this.learningEngine.getCoursePresets(profileId, context.courseName)
      : [];
    
    // 2. 季節別プリセット
    const seasonPresets = await this.getSeasonPresets(profileId, context.season);
    
    // 3. 最近使用したプリセット
    const recentPresets = await this.getRecentPresets(profileId);
    
    // 4. スコアリングして統合
    return this.mergeAndScore([
      { presets: coursePresets, weight: 0.5 },
      { presets: seasonPresets, weight: 0.3 },
      { presets: recentPresets, weight: 0.2 },
    ]);
  }
  
  /**
   * プリセットのスコアリング
   */
  private mergeAndScore(
    groups: Array<{ presets: Preset[]; weight: number }>
  ): Preset[] {
    const scoreMap = new Map<string, { preset: Preset; score: number }>();
    
    groups.forEach(({ presets, weight }) => {
      presets.forEach((preset, index) => {
        const key = this.createComboKey(preset);
        const rankScore = (presets.length - index) / presets.length;
        const score = rankScore * weight;
        
        if (scoreMap.has(key)) {
          scoreMap.get(key)!.score += score;
        } else {
          scoreMap.set(key, { preset, score });
        }
      });
    });
    
    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .map(item => item.preset)
      .slice(0, 5);
  }
}
```

---

## 6. API詳細設計書

### 6.1 内部API仕様（コンポーネント間インターフェース）

#### 6.1.1 DatabaseService API

**プロファイル管理**:

```typescript
interface IProfileService {
  // プロファイル作成
  createProfile(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>;
  
  // プロファイル取得
  getProfile(id: number): Promise<Profile | null>;
  
  // 全プロファイル取得
  getAllProfiles(): Promise<Profile[]>;
  
  // プロファイル更新
  updateProfile(id: number, profile: Partial<Profile>): Promise<void>;
  
  // プロファイル削除
  deleteProfile(id: number): Promise<void>;
}
```

**ラウンド管理**:

```typescript
interface IRoundService {
  // ラウンド作成
  createRound(round: Omit<Round, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>;
  
  // ラウンド取得
  getRound(id: number): Promise<Round | null>;
  
  // プロファイル別ラウンド取得
  getRoundsByProfile(profileId: number, limit?: number): Promise<Round[]>;
  
  // ラウンド更新
  updateRound(id: number, round: Partial<Round>): Promise<void>;
  
  // ラウンド削除
  deleteRound(id: number): Promise<void>;
}
```

**ショット管理**:

```typescript
interface IShotService {
  // ショット作成
  createShot(shot: Omit<Shot, 'id' | 'createdAt'>): Promise<number>;
  
  // ショット取得
  getShot(id: number): Promise<Shot | null>;
  
  // ラウンド別ショット取得
  getShotsByRound(roundId: number): Promise<Shot[]>;
  
  // フィルター付きショット取得
  getShots(filter: ShotFilter): Promise<Shot[]>;
  
  // ショット更新
  updateShot(id: number, shot: Partial<Shot>): Promise<void>;
  
  // ショット削除
  deleteShot(id: number): Promise<void>;
}
```

---

#### 6.1.2 CalculationEngine API

```typescript
interface ICalculationEngine {
  // 想定飛距離計算
  calculateTargetDistance(params: {
    profile: Profile;
    slope: Slope;
    club: string;
    lie: Lie;
    strength: Strength;
    wind: Wind;
    season: Season;
  }): number;
  
  // 成功判定
  isSuccess(targetDistance: number, actualDistance: number, direction: number): boolean;
  
  // クラブ別基準距離取得
  getClubBaseDistance(profile: Profile, club: string, season: Season): number;
  
  // 各補正値の取得
  getSlopeCorrection(slope: Slope, baseDistance: number): number;
  getLieCorrection(lie: Lie, baseDistance: number): number;
  getWindCorrection(wind: Wind, baseDistance: number): number;
  
  // 距離補正の詳細取得
  getDistanceCorrection(params: {
    profile: Profile;
    slope: Slope;
    club: string;
    lie: Lie;
    strength: Strength;
    wind: Wind;
    season: Season;
  }): DistanceCorrection;
}
```

---

#### 6.1.3 StatisticsEngine API

```typescript
interface IStatisticsEngine {
  // 成功率計算
  calculateSuccessRate(shots: Shot[]): number;
  
  // 基本統計量
  calculateMean(values: number[]): number;
  calculateStdDeviation(values: number[]): number;
  calculateMedian(values: number[]): number;
  
  // ライ別分析
  analyzeLiePerformance(shots: Shot[]): LieStats[];
  
  // クラブ別分析
  analyzeClubPerformance(shots: Shot[], clubs: string[]): ClubStats[];
  
  // 傾斜別分析
  analyzeSlopePerformance(shots: Shot[]): SlopeStats[];
  
  // パターン検出
  detectPatterns(shots: Shot[], minFrequency?: number): Pattern[];
  
  // 相関分析
  calculateCorrelation(x: number[], y: number[]): number;
  analyzeDimensionCorrelation(shots: Shot[]): Array<{
    dimension1: string;
    dimension2: string;
    correlation: number;
  }>;
  
  // 成功率分析
  analyzeSuccessRate(shots: Shot[]): SuccessRateAnalysis;
}
```

---

#### 6.1.4 PresetLearningEngine API

```typescript
interface IPresetLearningEngine {
  // プリセット使用記録
  recordUsage(profileId: number, combination: SixDimensionCombo): Promise<void>;
  
  // TOP5プリセット取得
  getTopPresets(profileId: number, limit?: number): Promise<Preset[]>;
  
  // コース別プリセット取得
  getCoursePresets(profileId: number, courseName: string, limit?: number): Promise<Preset[]>;
  
  // 季節別プリセット取得
  getSeasonPresets(profileId: number, season: Season, limit?: number): Promise<Preset[]>;
  
  // 最近使用したプリセット取得
  getRecentPresets(profileId: number, limit?: number): Promise<Preset[]>;
}
```

---

### 6.2 外部API連携仕様

#### 6.2.1 位置情報API（expo-location）

**API仕様**:

```typescript
/**
 * 位置情報サービス
 */
class LocationService {
  /**
   * 現在位置の取得
   */
  async getCurrentLocation(): Promise<{
    lat: number;
    lng: number;
  } | null> {
    try {
      // 権限確認
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return null;
      }
      
      // 現在位置取得
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  }
  
  /**
   * ゴルフ場の特定
   */
  async identifyGolfCourse(location: {
    lat: number;
    lng: number;
  }): Promise<string | null> {
    // ゴルフ場データベースから最寄りのコースを検索
    const nearestCourse = await this.findNearestCourse(location);
    
    // 500m以内のゴルフ場があれば返す
    if (nearestCourse && nearestCourse.distance < 0.5) {
      return nearestCourse.name;
    }
    
    return null;
  }
  
  /**
   * 最寄りゴルフ場の検索
   */
  private async findNearestCourse(location: {
    lat: number;
    lng: number;
  }): Promise<{ name: string; distance: number } | null> {
    // ゴルフ場データベース（簡易版）
    const golfCourses = await this.db.getGolfCourses();
    
    let nearest = null;
    let minDistance = Infinity;
    
    golfCourses.forEach(course => {
      const distance = this.calculateDistance(
        location,
        { lat: course.lat, lng: course.lng }
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { name: course.name, distance };
      }
    });
    
    return nearest;
  }
  
  /**
   * 2点間の距離計算（Haversine式）
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // 地球の半径（km）
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLng = this.deg2rad(point2.lng - point1.lng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.lat)) *
        Math.cos(this.deg2rad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
```

---

#### 6.2.2 気象API（OpenWeatherMap）

**API仕様**:

```typescript
/**
 * 気象情報サービス
 */
class WeatherService {
  private readonly API_KEY = process.env.OPENWEATHER_API_KEY;
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
  
  /**
   * 現在の気象情報取得
   */
  async getCurrentWeather(location: {
    lat: number;
    lng: number;
  }): Promise<{
    temperature: number;
    weather: string;
    season: Season;
  } | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}?lat=${location.lat}&lon=${location.lng}&appid=${this.API_KEY}&units=metric&lang=ja`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const temperature = Math.round(data.main.temp);
      const weather = data.weather[0].description;
      const season = this.determineSeason(temperature);
      
      return { temperature, weather, season };
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  }
  
  /**
   * 気温から季節を判定
   */
  private determineSeason(temperature: number): Season {
    if (temperature >= 25) return Season.SUMMER;
    if (temperature >= 10) return Season.MID;
    return Season.WINTER;
  }
  
  /**
   * レート制限チェック
   */
  private async checkRateLimit(): Promise<boolean> {
    // 60回/分、100万回/月の制限
    const lastCall = await this.storage.getItem('weather_last_call');
    const now = Date.now();
    
    if (lastCall && now - parseInt(lastCall) < 1000) {
      // 1秒以内の連続呼び出しは拒否
      return false;
    }
    
    await this.storage.setItem('weather_last_call', now.toString());
    return true;
  }
}
```

---

## 7. テスト設計書

### 7.1 テスト戦略

**テストレベル**:

1. **単体テスト（Unit Test）**
   - 対象: ビジネスロジック、ユーティリティ関数
   - カバレッジ目標: 80%以上
   - ツール: Jest

2. **統合テスト（Integration Test）**
   - 対象: データベース操作、API連携
   - カバレッジ目標: 主要フロー100%
   - ツール: Jest + React Native Testing Library

3. **E2Eテスト（End-to-End Test）**
   - 対象: 主要ユーザーフロー
   - カバレッジ目標: 重要フロー100%
   - ツール: Detox（後期導入）

---

### 7.2 単体テストケース

#### 7.2.1 CalculationEngine テストケース

**テストケースID**: UT-CALC-001  
**テスト対象**: calculateTargetDistance()  
**目的**: 6次元補正計算の正確性検証

```typescript
describe('CalculationEngine', () => {
  let engine: CalculationEngine;
  
  beforeEach(() => {
    engine = new CalculationEngine();
  });
  
  // TC-001: 基本補正（全て標準値）
  test('平地・A級・フル・無風・7I・夏季の場合、補正なし', () => {
    const profile: Profile = {
      baseDistances: { summer: 150, mid: 143, winter: 135 },
      // ... 他のフィールド
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
  
  // TC-002: 複合補正
  test('左上・C級・80%・アゲ・7I・冬季の場合、94Y', () => {
    const profile: Profile = {
      baseDistances: { summer: 150, mid: 143, winter: 135 },
      // ... 他のフィールド
    };
    
    const result = engine.calculateTargetDistance({
      profile,
      slope: Slope.LEFT_UP,
      club: '7I',
      lie: Lie.C,
      strength: Strength.NORMAL,
      wind: Wind.AGAINST,
      season: Season.WINTER,
    });
    
    expect(result).toBe(94);
  });
  
  // TC-003: 成功判定（成功ケース）
  test('距離±10Y以内、方向12時の場合、成功', () => {
    const result = engine.isSuccess(100, 105, 12);
    expect(result).toBe(true);
  });
  
  // TC-004: 成功判定（失敗ケース：距離）
  test('距離-15Y、方向12時の場合、失敗', () => {
    const result = engine.isSuccess(100, 85, 12);
    expect(result).toBe(false);
  });
  
  // TC-005: 成功判定（失敗ケース：方向）
  test('距離±5Y、方向3時の場合、失敗', () => {
    const result = engine.isSuccess(100, 105, 3);
    expect(result).toBe(false);
  });
});
```

---

#### 7.2.2 StatisticsEngine テストケース

**テストケースID**: UT-STAT-001  
**テスト対象**: calculateSuccessRate()  
**目的**: 成功率計算の正確性検証

```typescript
describe('StatisticsEngine', () => {
  let engine: StatisticsEngine;
  
  beforeEach(() => {
    engine = new StatisticsEngine();
  });
  
  // TC-001: 成功率計算（基本）
  test('10ショット中6成功の場合、60%', () => {
    const shots: Shot[] = [
      { success: true, /* ... */ },
      { success: true, /* ... */ },
      { success: true, /* ... */ },
      { success: true, /* ... */ },
      { success: true, /* ... */ },
      { success: true, /* ... */ },
      { success: false, /* ... */ },
      { success: false, /* ... */ },
      { success: false, /* ... */ },
      { success: false, /* ... */ },
    ];
    
    const result = engine.calculateSuccessRate(shots);
    expect(result).toBe(0.6);
  });
  
  // TC-002: 成功率計算（空配列）
  test('ショット数0の場合、0%', () => {
    const shots: Shot[] = [];
    const result = engine.calculateSuccessRate(shots);
    expect(result).toBe(0);
  });
  
  // TC-003: 平均計算
  test('平均値の計算', () => {
    const values = [100, 110, 90, 105, 95];
    const result = engine.calculateMean(values);
    expect(result).toBe(100);
  });
  
  // TC-004: 標準偏差計算
  test('標準偏差の計算', () => {
    const values = [100, 110, 90, 105, 95];
    const result = engine.calculateStdDeviation(values);
    expect(result).toBeCloseTo(7.07, 2);
  });
});
```

---

### 7.3 統合テストケース

#### 7.3.1 DatabaseService 統合テスト

**テストケースID**: IT-DB-001  
**テスト対象**: Profile CRUD操作  
**目的**: データベース操作の正確性検証

```typescript
describe('DatabaseService Integration', () => {
  let db: DatabaseService;
  
  beforeEach(async () => {
    db = new DatabaseService();
    await db.initialize();
  });
  
  afterEach(async () => {
    await db.clear();
  });
  
  // TC-001: プロファイル作成
  test('プロファイルを作成できる', async () => {
    const profile = {
      name: 'テストユーザー',
      swingType: SwingType.RIGHT,
      swingTempo: SwingTempo.NORMAL,
      ballTrajectory: BallTrajectory.STRAIGHT,
      distanceType: DistanceType.BALANCE,
      baseDistances: { summer: 150, mid: 143, winter: 135 },
      clubs: ['DR', '7I', 'PW'],
      headSpeed: 42,
      meetRate: 1.35,
      distanceFactor: 1.0,
    };
    
    const id = await db.createProfile(profile);
    expect(id).toBeGreaterThan(0);
    
    const retrieved = await db.getProfile(id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('テストユーザー');
  });
  
  // TC-002: プロファイル更新
  test('プロファイルを更新できる', async () => {
    const id = await db.createProfile({ /* ... */ });
    
    await db.updateProfile(id, { name: '更新後ユーザー' });
    
    const retrieved = await db.getProfile(id);
    expect(retrieved!.name).toBe('更新後ユーザー');
  });
  
  // TC-003: カスケード削除
  test('プロファイル削除時、関連データも削除される', async () => {
    const profileId = await db.createProfile({ /* ... */ });
    const roundId = await db.createRound({ profileId, /* ... */ });
    await db.createShot({ roundId, /* ... */ });
    
    await db.deleteProfile(profileId);
    
    const round = await db.getRound(roundId);
    expect(round).toBeNull();
  });
});
```

---

### 7.4 E2Eテストケース

#### 7.4.1 ショット記録フロー

**テストケースID**: E2E-001  
**テスト対象**: プリセット使用による2タップ記録  
**目的**: 最短記録フローの動作検証

```typescript
describe('Shot Recording E2E', () => {
  // TC-001: プリセット2タップ記録
  test('プリセット使用で2タップ記録完了', async () => {
    // 1. ホーム画面から記録開始
    await element(by.id('start-round-button')).tap();
    
    // 2. プリセット選択画面を開く
    await element(by.id('use-preset-button')).tap();
    
    // 3. プリセット選択（1タップ目）
    await element(by.id('preset-1')).tap();
    
    // 4. TargetBoard表示を確認
    await expect(element(by.id('target-board'))).toBeVisible();
    
    // 5. 結果入力（2タップ目）
    await element(by.id('target-board-12')).tap();
    
    // 6. 保存完了を確認
    await expect(element(by.text('保存完了'))).toBeVisible();
  });
  
  // TC-002: 6タップ手動記録
  test('手動入力で6タップ記録完了', async () => {
    // 1. ホーム画面から記録開始
    await element(by.id('start-round-button')).tap();
    
    // 2. 手動入力選択
    await element(by.id('manual-input-button')).tap();
    
    // 3. ステップ1: 傾斜選択
    await element(by.id('slope-left-up')).tap();
    await element(by.id('next-button')).tap();
    
    // 4. ステップ2: クラブ選択
    await element(by.id('club-7I')).tap();
    await element(by.id('next-button')).tap();
    
    // 5. ステップ3: ライ選択
    await element(by.id('lie-C')).tap();
    await element(by.id('next-button')).tap();
    
    // 6. ステップ4: 強度選択
    await element(by.id('strength-80')).tap();
    await element(by.id('next-button')).tap();
    
    // 7. ステップ5: 風選択
    await element(by.id('wind-against')).tap();
    await element(by.id('next-button')).tap();
    
    // 8. ステップ6: 結果入力
    await element(by.id('target-board-12')).tap();
    
    // 9. 保存完了を確認
    await expect(element(by.text('保存完了'))).toBeVisible();
  });
});
```

---

### 7.5 テストデータ

#### 7.5.1 テスト用プロファイル

```typescript
const TEST_PROFILE: Profile = {
  id: 1,
  name: 'テストゴルファー',
  swingType: SwingType.RIGHT,
  swingTempo: SwingTempo.NORMAL,
  ballTrajectory: BallTrajectory.STRAIGHT,
  distanceType: DistanceType.BALANCE,
  baseDistances: {
    summer: 150,
    mid: 143,
    winter: 135,
  },
  clubs: ['DR', '3W', '5W', '6I', '7I', '8I', '9I', 'PW', 'AW', '52', '56', 'PT'],
  headSpeed: 42,
  meetRate: 1.35,
  distanceFactor: 1.0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};
```

#### 7.5.2 テスト用ショットデータ

```typescript
const TEST_SHOTS: Shot[] = [
  {
    id: 1,
    roundId: 1,
    holeNumber: 7,
    shotNumber: 2,
    slope: Slope.LEFT_UP,
    club: '7I',
    lie: Lie.C,
    strength: Strength.NORMAL,
    wind: Wind.AGAINST,
    season: Season.WINTER,
    targetDistance: 94,
    actualDistance: 91,
    direction: 12,
    distanceError: -3,
    success: true,
    createdAt: '2025-01-01T10:00:00Z',
  },
  // ... 他のテストショット
];
```

---

### 7.6 テスト実施計画

**Week 1-2（開発中）**:
- 単体テスト: 各機能実装時に実施
- カバレッジ: 機能単位で80%以上を確保

**Week 3（統合テスト週）**:
- 統合テスト: 全機能統合後に実施
- データベース操作の一貫性確認

**Week 4（E2Eテスト週）**:
- E2Eテスト: 主要フロー全体の動作確認
- 実機テスト（iOS/Android）

---

## 8. まとめ

### 8.1 詳細設計完了チェックリスト

以下をすべて確認してください：

- [ ] データベース詳細設計書が完成
  - [ ] 全テーブルのフィールド定義
  - [ ] インデックス設計
  - [ ] 制約条件の明確化
  - [ ] 初期化SQL完成

- [ ] 画面詳細設計書が完成
  - [ ] 全画面のワイヤーフレーム
  - [ ] UI要素の詳細仕様
  - [ ] 画面遷移図

- [ ] 6次元計算ロジック詳細設計書が完成
  - [ ] 補正係数の定義
  - [ ] 計算アルゴリズムの詳細
  - [ ] 計算例の検証

- [ ] 統計分析ロジック詳細設計書が完成
  - [ ] 基本統計量の計算式
  - [ ] 各種分析アルゴリズム
  - [ ] キャッシュ更新戦略

- [ ] プリセット学習ロジック詳細設計書が完成
  - [ ] 頻度ベース学習アルゴリズム
  - [ ] プリセット推奨ロジック

- [ ] API詳細設計書が完成
  - [ ] 内部API仕様
  - [ ] 外部API連携仕様

- [ ] テスト設計書が完成
  - [ ] 単体テストケース
  - [ ] 統合テストケース
  - [ ] E2Eテストケース
  - [ ] テストデータ

**すべてチェックできたら、フェーズ3（詳細設計）完了です！** ✅

---

### 8.2 次のフェーズへの移行

**フェーズ4: プロトタイプ開発**

詳細設計が完了したら、次は **プロトタイプ開発** に進みます。

プロトタイプフェーズでは：
1. コア機能の実装（データベース・計算エンジン）
2. 基本UI/UXの実装
3. 動作検証

**準備ができたら「フェーズ4開始」と伝えてください。**

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| 2025-09-30 | 1.0 | 初版作成（詳細設計書） | Claude |

---

## 承認

| 役割 | 氏名 | 承認日 | サイン |
|------|------|--------|--------|
| プロジェクトオーナー | | | |
| システムアーキテクト | | | |
| 技術リード | | | |

---

**以上、フェーズ3: 詳細設計 完了**

次のフェーズ: **フェーズ4「プロトタイプ開発」**  
開始条件: 詳細設計の承認完了

準備完了！プロトタイプ開発を開始できます 🚀# フェーズ3: 詳細設計（Logic Design）

## プロジェクト概要

**プロジェクト名**: 上手くなる気がするぅぅぅ Pro  
**バージョン**: 1.0  
**作成日**: 2025年9月30日  
**ステータス**: 詳細設計段階  
**前提条件**: フェーズ1（コンセプト設計）、フェーズ2（システム設計）完了

**BIALPHAメソッド位置**: Logic Design（L）

---

## 目次

1. データベース詳細設計書
2. 画面詳細設計書
3. 6次元計算ロジック詳細設計書
4. 統計分析ロジック詳細設計書
5. プリセット学習ロジック詳細設計書
6. API詳細設計書
7. テスト設計書

================================================================================

## 1. データベース詳細設計書

### 1.1 テーブル定義詳細

#### 1.1.1 profiles テーブル

**目的**: ユーザープロファイル情報を管理

**テーブル定義**:

```
テーブル名: profiles
主キー: id (INTEGER, AUTO_INCREMENT)
```

**フィールド定義**:

| No | フィールド名 | 型 | NULL | デフォルト | 説明 | 制約 |
|----|------------|-----|------|-----------|------|------|
| 1  | id | INTEGER | NO | AUTO | プロファイルID | PRIMARY KEY |
| 2  | name | TEXT | NO | - | ユーザー名 | NOT NULL, 最大100文字 |
| 3  | swing_type | TEXT | NO | - | スイング特性 | CHECK(swing_type IN ('right', 'left')) |
| 4  | swing_tempo | TEXT | NO | - | スイングテンポ | CHECK(swing_tempo IN ('slow', 'normal', 'fast')) |
| 5  | ball_trajectory | TEXT | NO | - | 球筋傾向 | CHECK(ball_trajectory IN ('draw', 'straight', 'fade')) |
| 6  | distance_type | TEXT | NO | - | 飛距離タイプ | CHECK(distance_type IN ('distance', 'balance', 'accuracy')) |
| 7  | base_distances | TEXT | NO | - | 7I基準飛距離（JSON） | NOT NULL, JSON形式 |
| 8  | clubs | TEXT | NO | - | 使用クラブ一覧（JSON） | NOT NULL, JSON配列 |
| 9  | head_speed | REAL | NO | 42.0 | ヘッドスピード(m/s) | >= 0 |
| 10 | meet_rate | REAL | NO | 1.35 | ミート率 | >= 0 |
| 11 | distance_factor | REAL | NO | 1.0 | 飛距離係数 | >= 0 |
| 12 | created_at | TEXT | NO | CURRENT_TIMESTAMP | 作成日時 | ISO 8601形式 |
| 13 | updated_at | TEXT | NO | CURRENT_TIMESTAMP | 更新日時 | ISO 8601形式 |

**base_distancesのJSON形式**:

```json
{
  "summer": 150,
  "mid": 143,
  "winter": 135
}
```

**clubsのJSON形式**:

```json
["DR", "3W", "5W", "U4", "U5", "6I", "7I", "8I", "9I", "PW", "AW", "52", "56", "PT"]
```

**インデックス**:

```sql
-- 主キーインデックス（自動作成）
CREATE INDEX idx_profiles_pk ON profiles(id);
```

**制約条件**:

- nameは空文字列不可
- base_distancesは有効なJSON形式であること
- summer >= mid >= winterの関係を保つこと（アプリケーション層で検証）
- clubsは最低1つのクラブを含むこと（アプリケーション層で検証）

---

#### 1.1.2 rounds テーブル

**目的**: ラウンド情報を管理

**テーブル定義**:

```
テーブル名: rounds
主キー: id (INTEGER, AUTO_INCREMENT)
外部キー: profile_id → profiles(id)
```

**フィールド定義**:

| No | フィールド名 | 型 | NULL | デフォルト | 説明 | 制約 |
|----|------------|-----|------|-----------|------|------|
| 1  | id | INTEGER | NO | AUTO | ラウンドID | PRIMARY KEY |
| 2  | profile_id | INTEGER | NO | - | プロファイルID | FOREIGN KEY |
| 3  | course_name | TEXT | NO | - | ゴルフ場名 | NOT NULL, 最大200文字 |
| 4  | course_location | TEXT | YES | NULL | 位置情報（JSON） | JSON形式 |
| 5  | date | TEXT | NO | - | 日付 | ISO 8601形式(YYYY-MM-DD) |
| 6  | weather | TEXT | YES | NULL | 天気 | 最大50文字 |
| 7  | temperature | REAL | YES | NULL | 気温（℃） | -50 <= temperature <= 50 |
| 8  | season | TEXT | NO | - | 季節区分 | CHECK(season IN ('summer', 'mid', 'winter')) |
| 9  | total_score | INTEGER | YES | NULL | 合計スコア | >= 0 |
| 10 | notes | TEXT | YES | NULL | メモ | 最大1000文字 |
| 11 | created_at | TEXT | NO | CURRENT_TIMESTAMP | 作成日時 | ISO 8601形式 |
| 12 | updated_at | TEXT | NO | CURRENT_TIMESTAMP | 更新日時 | ISO 8601形式 |

**course_locationのJSON形式**:

```json
{
  "lat": 36.083333,
  "lng": 140.116667
}
```

**インデックス**:

```sql
CREATE INDEX idx_rounds_profile ON rounds(profile_id);
CREATE INDEX idx_rounds_date ON rounds(date DESC);
CREATE INDEX idx_rounds_course ON rounds(course_name);
```

**制約条件**:

- profile_idは存在するprofilesレコードを参照すること
- dateは有効な日付形式であること（YYYY-MM-DD）
- temperatureとseasonは整合性を保つこと（アプリケーション層で検証）
  - summer: 25℃以上
  - mid: 10-25℃
  - winter: 10℃未満

**カスケード削除**:

```sql
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
```

プロファイル削除時、関連するラウンドもすべて削除される。

---

#### 1.1.3 shots テーブル（6次元データの核心）

**目的**: ショット記録を管理（6次元データ）

**テーブル定義**:

```
テーブル名: shots
主キー: id (INTEGER, AUTO_INCREMENT)
外部キー: round_id → rounds(id)
```

**フィールド定義**:

| No | フィールド名 | 型 | NULL | デフォルト | 説明 | 制約 |
|----|------------|-----|------|-----------|------|------|
| 1  | id | INTEGER | NO | AUTO | ショットID | PRIMARY KEY |
| 2  | round_id | INTEGER | NO | - | ラウンドID | FOREIGN KEY |
| 3  | hole_number | INTEGER | NO | - | ホール番号 | CHECK(1 <= hole_number <= 18) |
| 4  | shot_number | INTEGER | NO | - | ショット番号 | CHECK(shot_number >= 1) |
|    |            |     |      |           | **6次元データ** | |
| 5  | slope | TEXT | NO | - | 傾斜 | CHECK(slope IN ('left_up', 'flat', 'left_down', 'right_up')) |
| 6  | club | TEXT | NO | - | クラブ | NOT NULL |
| 7  | lie | TEXT | NO | - | ライ状況 | CHECK(lie IN ('A', 'B', 'C', 'plugged', 'bare', 'bad')) |
| 8  | strength | INTEGER | NO | - | ショット強度 | CHECK(strength IN (60, 80, 100)) |
| 9  | wind | TEXT | NO | - | 風向き | CHECK(wind IN ('none', 'against', 'follow', 'left', 'right', 'complex')) |
| 10 | season | TEXT | NO | - | 季節 | CHECK(season IN ('summer', 'mid', 'winter')) |
|    |            |     |      |           | **結果データ** | |
| 11 | target_distance | INTEGER | NO | - | 想定飛距離（Y） | >= 0 |
| 12 | actual_distance | INTEGER | NO | - | 実際飛距離（Y） | >= 0 |
| 13 | direction | INTEGER | NO | - | 方向（時計） | CHECK(1 <= direction <= 12) |
| 14 | distance_error | INTEGER | NO | - | 距離誤差（Y） | actual_distance - target_distance |
| 15 | success | BOOLEAN | NO | - | 成功判定 | 0 or 1 |
|    |            |     |      |           | **オプションデータ** | |
| 16 | confidence | TEXT | YES | NULL | 自信度 | CHECK(confidence IN ('confident', 'normal', 'anxious')) |
| 17 | target_point | TEXT | YES | NULL | 狙った地点 | CHECK(target_point IN ('pin', 'center', 'safe')) |
| 18 | feeling | TEXT | YES | NULL | 感想 | CHECK(feeling IN ('as_expected', 'unexpected', 'worst')) |
| 19 | pressure | TEXT | YES | NULL | プレッシャー度 | CHECK(pressure IN ('relaxed', 'normal', 'high')) |
| 20 | notes | TEXT | YES | NULL | メモ | 最大500文字 |
| 21 | created_at | TEXT | NO | CURRENT_TIMESTAMP | 作成日時 | ISO 8601形式 |

**インデックス（重要）**:

```sql
-- ラウンド別検索用
CREATE INDEX idx_shots_round ON shots(round_id);

-- 6次元検索用（複合インデックス）
CREATE INDEX idx_shots_6dim ON shots(slope, club, lie, strength, wind, season);

-- クラブ別検索用
CREATE INDEX idx_shots_club ON shots(club);

-- ライ別検索用
CREATE INDEX idx_shots_lie ON shots(lie);

-- 成功判定別検索用
CREATE INDEX idx_shots_success ON shots(success);

-- 日付順検索用（created_at）
CREATE INDEX idx_shots_created ON shots(created_at DESC);
```

**制約条件**:

- round_idは存在するroundsレコードを参照すること
- clubはプロファイルのclubs配列に含まれるクラブであること（アプリケーション層で検証）
- seasonはラウンドのseasonと一致すること（アプリケーション層で検証）
- distance_errorは自動計算されること（アプリケーション層で設定）
- successは以下の条件で判定：
  - 距離誤差: ±10ヤード以内
  - 方向誤差: ±1時以内（11時-1時の範囲）

**カスケード削除**:

```sql
FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
```

ラウンド削除時、関連するショットもすべて削除される。

---

#### 1.1.4 presets テーブル

**目的**: プリセット（頻度学習）を管理

**テーブル定義**:

```
テーブル名: presets
主キー: id (INTEGER, AUTO_INCREMENT)
外部キー: profile_id → profiles(id)
ユニーク制約: profile_id + 6次元の組み合わせ
```

**フィールド定義**:

| No | フィールド名 | 型 | NULL | デフォルト | 説明 | 制約 |
|----|------------|-----|------|-----------|------|------|
| 1  | id | INTEGER | NO | AUTO | プリセットID | PRIMARY KEY |
| 2  | profile_id | INTEGER | NO | - | プロファイルID | FOREIGN KEY |
| 3  | slope | TEXT | NO | - | 傾斜 | CHECK(slope IN ('left_up', 'flat', 'left_down', 'right_up')) |
| 4  | club | TEXT | NO | - | クラブ | NOT NULL |
| 5  | lie | TEXT | NO | - | ライ状況 | CHECK(lie IN ('A', 'B', 'C', 'plugged', 'bare', 'bad')) |
| 6  | strength | INTEGER | NO | - | ショット強度 | CHECK(strength IN (60, 80, 100)) |
| 7  | wind | TEXT | NO | - | 風向き | CHECK(wind IN ('none', 'against', 'follow', 'left', 'right', 'complex')) |
| 8  | season | TEXT | NO | - | 季節 | CHECK(season IN ('summer', 'mid', 'winter')) |
| 9  | usage_count | INTEGER | NO | 1 | 使用回数 | >= 1 |
| 10 | last_used_at | TEXT | NO | CURRENT_TIMESTAMP | 最終使用日時 | ISO 8601形式 |
| 11 | created_at | TEXT | NO | CURRENT_TIMESTAMP | 作成日時 | ISO 8601形式 |

**インデックス**:

```sql
CREATE INDEX idx_presets_profile ON presets(profile_id);
CREATE INDEX idx_presets_usage ON presets(profile_id, usage_count DESC);
CREATE INDEX idx_presets_last_used ON presets(profile_id, last_used_at DESC);
```

**ユニーク制約**:

```sql
CREATE UNIQUE INDEX idx_presets_unique ON presets(
  profile_id, slope, club, lie, strength, wind, season
);
```

同じ6次元の組み合わせは、1つのプロファイルに対して1つだけ存在する。

**制約条件**:

- profile_idは存在するprofilesレコードを参照すること
- usage_countは必ず1以上
- 同じ組み合わせが記録された場合、usage_countをインクリメントし、last_used_atを更新

**カスケード削除**:

```sql
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
```

---

#### 1.1.5 statistics テーブル

**目的**: 統計データのキャッシュを管理

**テーブル定義**:

```
テーブル名: statistics
主キー: id (INTEGER, AUTO_INCREMENT)
外部キー: profile_id → profiles(id)
ユニーク制約: profile_id + stat_type + dimension + dimension_value
```

**フィールド定義**:

| No | フィールド名 | 型 | NULL | デフォルト | 説明 | 制約 |
|----|------------|-----|------|-----------|------|------|
| 1  | id | INTEGER | NO | AUTO | 統計ID | PRIMARY KEY |
| 2  | profile_id | INTEGER | NO | - | プロファイルID | FOREIGN KEY |
| 3  | stat_type | TEXT | NO | - | 統計種別 | 'success_rate', 'avg_distance'等 |
| 4  | dimension | TEXT | NO | - | 次元 | 'slope', 'club', 'lie'等 |
| 5  | dimension_value | TEXT | NO | - | 値 | '7I', 'left_up', 'C'等 |
| 6  | success_rate | REAL | YES | NULL | 成功率 | 0.0 <= success_rate <= 1.0 |
| 7  | avg_distance | REAL | YES | NULL | 平均飛距離 | >= 0 |
| 8  | std_distance | REAL | YES | NULL | 標準偏差 | >= 0 |
| 9  | sample_count | INTEGER | NO | - | サンプル数 | >= 0 |
| 10 | additional_stats | TEXT | YES | NULL | その他統計値（JSON） | JSON形式 |
| 11 | updated_at | TEXT | NO | CURRENT_TIMESTAMP | 更新日時 | ISO 8601形式 |

**インデックス**:

```sql
CREATE INDEX idx_stats_profile ON statistics(profile_id);
CREATE INDEX idx_stats_type ON statistics(stat_type);
CREATE INDEX idx_stats_dimension ON statistics(dimension, dimension_value);
```

**ユニーク制約**:

```sql
CREATE UNIQUE INDEX idx_stats_unique ON statistics(
  profile_id, stat_type, dimension, dimension_value
);
```

**制約条件**:

- profile_idは存在するprofilesレコードを参照すること
- success_rateは0.0-1.0の範囲
- sample_countが0の場合、他の統計値はNULL

**カスケード削除**:

```sql
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
```

**キャッシュ更新タイミング**:

1. ショット追加時: 非同期で関連統計を再計算
2. ラウンド終了時: 全統計を再計算
3. 手動更新: ユーザーがリクエスト時

---

### 1.2 データベース初期化SQL

```sql
-- profiles テーブル
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  swing_type TEXT NOT NULL CHECK(swing_type IN ('right', 'left')),
  swing_tempo TEXT NOT NULL CHECK(swing_tempo IN ('slow', 'normal', 'fast')),
  ball_trajectory TEXT NOT NULL CHECK(ball_trajectory IN ('draw', 'straight', 'fade')),
  distance_type TEXT NOT NULL CHECK(distance_type IN ('distance', 'balance', 'accuracy')),
  base_distances TEXT NOT NULL,
  clubs TEXT NOT NULL,
  head_speed REAL NOT NULL DEFAULT 42.0,
  meet_rate REAL NOT NULL DEFAULT 1.35,
  distance_factor REAL NOT NULL DEFAULT 1.0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- rounds テーブル
CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  course_location TEXT,
  date TEXT NOT NULL,
  weather TEXT,
  temperature REAL,
  season TEXT NOT NULL CHECK(season IN ('summer', 'mid', 'winter')),
  total_score INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_rounds_profile ON rounds(profile_id);
CREATE INDEX idx_rounds_date ON rounds(date DESC);
CREATE INDEX idx_rounds_course ON rounds(course_name);

-- shots テーブル
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
  confidence TEXT CHECK(confidence IN ('confident', 'normal', 'anxious')),
  target_point TEXT CHECK(target_point IN ('pin', 'center', 'safe')),
  feeling TEXT CHECK(feeling IN ('as_expected', 'unexpected', 'worst')),
  pressure TEXT CHECK(pressure IN ('relaxed', 'normal', 'high')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
);

CREATE INDEX idx_shots_round ON shots(round_id);
CREATE INDEX idx_shots_6dim ON shots(slope, club, lie, strength, wind, season);
CREATE INDEX idx_shots_club ON shots(club);
CREATE INDEX idx_shots_lie ON shots(lie);
CREATE INDEX idx_shots_success ON shots(success);
CREATE INDEX idx_shots_created ON shots(created_at DESC);

-- presets テーブル
CREATE TABLE IF NOT EXISTS presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  slope TEXT NOT NULL CHECK(slope IN ('left_up', 'flat', 'left_down', 'right_up')),
  club TEXT NOT NULL,
  lie TEXT NOT NULL CHECK(lie IN ('A', 'B', 'C', 'plugged', 'bare', 'bad')),
  strength INTEGER NOT NULL CHECK(strength IN (60, 80, 100)),
  wind TEXT NOT NULL CHECK(wind IN ('none', 'against', 'follow', 'left', 'right', 'complex')),
  season TEXT NOT NULL CHECK(season IN ('summer', 'mid', 'winter')),
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_presets_profile ON presets(profile_id);
CREATE INDEX idx_presets_usage ON presets(profile_id, usage_count DESC);
CREATE INDEX idx_presets_last_used ON presets(profile_id, last_used_at DESC);
CREATE UNIQUE INDEX idx_presets_unique ON presets(
  profile_id, slope, club, lie, strength, wind, season
);

-- statistics テーブル
CREATE TABLE IF NOT EXISTS statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  stat_type TEXT NOT NULL,
  dimension TEXT NOT NULL,
  dimension_value TEXT NOT NULL,
  success_rate REAL,
  avg_distance REAL,
  std_distance REAL,
  sample_count INTEGER NOT NULL,
  additional_stats TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_stats_profile ON statistics(profile_id);
CREATE INDEX idx_stats_type ON statistics(stat_type);
CREATE INDEX idx_stats_dimension ON statistics(dimension, dimension_value);
CREATE UNIQUE INDEX idx_stats_unique ON statistics(
  profile_id, stat_type, dimension, dimension_value
);
```

---

### 1.3 マイグレーション戦略

**バージョン管理**:

```sql
-- schema_versionsテーブル
CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- 初期バージョン登録
INSERT INTO schema_versions (version, description) VALUES (1, '初期スキーマ作成');
```

**マイグレーション例（バージョン2）**:

```sql
-- 将来的にフィールド追加が必要な場合
-- 例: shotsテーブルにmemo_imageフィールド追加

ALTER TABLE shots ADD COLUMN memo_image TEXT;

INSERT INTO schema_versions (version, description) 
VALUES (2, 'shotsテーブルにmemo_imageフィールド追加');
```

---

### 1.4 データ整合性チェック

**アプリケーション層でのバリデーション**:

```typescript
// ショットデータの整合性チェック
function validateShot(shot: Shot, round: Round, profile: Profile): boolean {
  // 1. clubがプロファイルのclubs配列に含まれるか
  if (!profile.clubs.includes(shot.club)) {
    throw new Error(`Invalid club: ${shot.club}`);
  }
  
  // 2. seasonがラウンドのseasonと一致するか
  if (shot.season !== round.season) {
    throw new Error('Season mismatch');
  }
  
  // 3. distance_errorが正しく計算されているか
  const expectedError = shot.actualDistance - shot.targetDistance;
  if (shot.distanceError !== expectedError) {
    throw new Error('Distance error mismatch');
  }
  
  // 4. successが正しく判定されているか
  const distanceOK = Math.abs(shot.distanceError) <= 10;
  const directionOK = shot.direction >= 11 || shot.direction <= 1;
  const expectedSuccess = distanceOK && directionOK;
  if (shot.success !== expectedSuccess) {
    throw new Error('Success判定エラー');
  }
  
  return true;
}
```

---

## 2. 画面詳細設計書

### 2.1 画面一覧

| No | 画面ID | 画面名 | 画面タイプ | 優先度 |
|----|--------|--------|-----------|--------|
| 1  | HOME-001 | ホーム画面 | タブ | P1 |
| 2  | RECORD-001 | ラウンド開始画面 | モーダル | P0 |
| 3  | RECORD-002 | ショット記録画面（6タップ） | メイン | P0 |
| 4  | RECORD-003 | プリセット選択画面 | モーダル | P1 |
| 5  | RECORD-004 | TargetBoard画面 | モーダル | P0 |
| 6  | ANALYSIS-001 | 分析トップ画面 | タブ | P1 |
| 7  | ANALYSIS-002 | ライ別分析画面 | サブ | P1 |
| 8  | ANALYSIS-003 | クラブ別分析画面 | サブ | P1 |
| 9  | SETTINGS-001 | 設定トップ画面 | タブ | P2 |
| 10 | SETTINGS-002 | プロファイル管理画面 | サブ | P1 |

---

### 2.2 画面詳細設計

#### 2.2.1 HOME-001: ホーム画面

**画面概要**:
- アプリのトップ画面
- ダッシュボード表示
- クイックアクセス機能

**画面レイアウト（ワイヤーフレーム）**:

```
┌─────────────────────────────────┐
│        ゴルフPro                  │  ← ヘッダー
├─────────────────────────────────┤
│                                 │
│  👤 田中 健太さん                 │
│  📊 平均スコア: 92               │
│  📈 前回比: -3打                 │
│                                 │
├─────────────────────────────────┤
│  🏌️ クイックスタート               │
│  ┌───────────────────────────┐  │
│  │  [新規ラウンド開始]          │  │ ← ボタン
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  📅 最近のラウンド                │
│  ┌───────────────────────────┐  │
│  │ 2025/09/28                │  │
│  │ つくばゴルフクラブ          │  │
│  │ スコア: 89                 │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 2025/09/21                │  │
│  │ 霞ヶ浦カントリークラブ      │  │
│  │ スコア: 95                 │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│ [ホーム][記録][分析][設定]       │  ← タブバー
└─────────────────────────────────┘
```

**UI要素詳細**:

| No | 要素名 | タイプ | 説明 | アクション |
|----|--------|--------|------|-----------|
| 1  | ユーザー名表示 | Text | プロファイル名 | タップで設定画面へ |
| 2  | 平均スコア | Text | 直近5ラウンドの平均 | - |
| 3  | 前回比 | Text | 前回ラウンドとの差 | - |
| 4  |