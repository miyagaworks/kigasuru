# アイコンデザインガイドライン
## 「上手くなる気がするぅぅぅ PRO」

---

## 1. 基本方針

### 1.1 デザインコンセプト
- **即座の認識性**: プレイ中に一瞬で理解できるデザイン
- **手袋着用時の操作性**: 大きなタップエリア、明確なアイコン
- **屋外視認性**: 直射日光下でも見やすい配色とコントラスト
- **国際対応**: 言語に依存しないビジュアル表現

### 1.2 入力の最小化戦略
1. **ジャイロ自動認識**: 傾斜は自動入力（手動も可能）
2. **プリセットボタン**: 頻出パターンをワンタップ
3. **大型アイコンボタン**: 最小限のタップで完了
4. **視覚的フィードバック**: 選択状態を即座に表示

---

## 2. SVG仕様

### 2.1 標準サイズ
```
- 基本アイコン: 24x24px（viewBox="0 0 24 24"）
- 大型ボタン: 48x48px（viewBox="0 0 48 48"）
- 特大ボタン: 64x64px（viewBox="0 0 64 64"）
```

### 2.2 保存場所
```
/assets/icons/
  ├── slope/           # 傾斜関連（8方向）
  ├── clubs/           # クラブ種類
  ├── lie/             # ライ状況（6種類）
  ├── strength/        # ショット強度（3段階）
  ├── wind/            # 風向き（6方向）
  ├── weather/         # 天候・気温
  ├── result/          # 結果入力（距離・方向）
  ├── ui/              # UI要素（ボタン、ナビゲーション等）
  └── preset/          # プリセット関連
```

### 2.3 命名規則
```
[カテゴリ]-[名前]-[バリエーション].svg

例:
- slope-flat.svg
- slope-left-up.svg
- slope-left-up-toe-up.svg
- club-7i.svg
- club-driver.svg
- lie-a-grade.svg
- wind-against.svg
- strength-full.svg
```

### 2.4 SVGコーディング規則
```xml
<!-- 基本テンプレート -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 48 48"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <!-- アイコン内容 -->
</svg>
```

**重要なポイント:**
- `fill="none"` + `stroke="currentColor"`: CSSで色変更可能
- `viewBox`: レスポンシブ対応
- シンプルなパス: ファイルサイズ最小化

---

## 3. カラーパレット

### 3.1 メインカラー
```css
/* プライマリ */
--primary-green: #2E7D32;      /* メインアクション */
--primary-dark: #1B5E20;       /* 選択状態 */
--primary-light: #4CAF50;      /* ホバー状態 */

/* セカンダリ */
--secondary-blue: #1976D2;     /* 情報表示 */
--secondary-orange: #F57C00;   /* 警告・注意 */
--secondary-red: #D32F2F;      /* エラー・危険 */

/* ニュートラル */
--neutral-gray-100: #F5F5F5;   /* 背景 */
--neutral-gray-300: #E0E0E0;   /* 非選択ボタン */
--neutral-gray-600: #757575;   /* テキスト */
--neutral-gray-900: #212121;   /* 強調テキスト */
```

### 3.2 結果表示カラー
```css
/* ターゲットボードの距離区分 */
--result-just: #4CAF50;        /* 🟢 ジャスト距離 */
--result-short: #FFC107;       /* 🟡 ショート */
--result-big-short: #FF9800;   /* 🟠 大ショート */
--result-over: #2196F3;        /* 🔵 オーバー */
--result-big-over: #9C27B0;    /* 🟣 大オーバー */
```

### 3.3 屋外視認性対応
- **高コントラスト**: 背景と前景の比率 4.5:1 以上
- **境界線**: アイコンに2px以上のストローク
- **影**: 必要に応じてdrop-shadow使用

---

## 4. アイコンカテゴリ別仕様

### 4.1 傾斜アイコン（8+1種類）

**サイズ**: 48x48px（大型ボタン）
**保存場所**: `/assets/icons/slope/`

| アイコン | ファイル名 | デザイン要素 |
|---------|-----------|------------|
| 平坦 | `slope-flat.svg` | 水平線 + 丸 |
| 左足上がり | `slope-left-up.svg` | 斜め上矢印（左下→右上） |
| 左足下がり | `slope-left-down.svg` | 斜め下矢印（左上→右下） |
| つま先上がり | `slope-toe-up.svg` | 上矢印 + 足アイコン |
| つま先下がり | `slope-toe-down.svg` | 下矢印 + 足アイコン |
| 左足上+つま先上 | `slope-left-up-toe-up.svg` | 斜め矢印 + 上矢印（複合） |
| 左足上+つま先下 | `slope-left-up-toe-down.svg` | 斜め矢印 + 下矢印（複合） |
| 左足下+つま先上 | `slope-left-down-toe-up.svg` | 斜め矢印 + 上矢印（複合） |
| 左足下+つま先下 | `slope-left-down-toe-down.svg` | 斜め矢印 + 下矢印（複合） |
| 自動認識 | `slope-auto-detect.svg` | スマホ + センサー波形 |

### 4.2 クラブアイコン（14種類）

**サイズ**: 48x48px
**保存場所**: `/assets/icons/clubs/`

| クラブ | ファイル名 | デザイン要素 |
|--------|-----------|------------|
| ドライバー | `club-driver.svg` | DR（大きいヘッド） |
| 3W | `club-3w.svg` | 3W（フェアウェイウッド） |
| 5W | `club-5w.svg` | 5W |
| U4 | `club-u4.svg` | U4（ユーティリティ） |
| U5 | `club-u5.svg` | U5 |
| 6I～PW | `club-6i.svg` ～ `club-pw.svg` | 番号表示 |
| AW | `club-aw.svg` | AW |
| 52° | `club-52.svg` | 52° |
| 56° | `club-56.svg` | 56° |
| パター | `club-putter.svg` | パター形状 |

### 4.3 ライ状況アイコン（6種類）

**サイズ**: 48x48px
**保存場所**: `/assets/icons/lie/`

| ライ | ファイル名 | デザイン要素 | 色 |
|------|-----------|------------|-----|
| A級（好条件） | `lie-a-grade.svg` | ✨ + 平坦な草 | 緑 |
| B級（軽ラフ） | `lie-b-grade.svg` | 🌱 短い草 | 黄緑 |
| C級（深ラフ） | `lie-c-grade.svg` | 🌿 長い草 | 濃緑 |
| 目玉ライ | `lie-buried.svg` | 📦 ボールが埋まった状態 | 茶色 |
| ベアグラウンド | `lie-bare.svg` | 🏖️ 硬い地面 | グレー |
| 悪条件 | `lie-bad.svg` | 🍂 木の根・障害物 | 赤茶色 |

### 4.4 ショット強度アイコン（3種類）

**サイズ**: 48x48px
**保存場所**: `/assets/icons/strength/`

| 強度 | ファイル名 | デザイン要素 | 色 |
|------|-----------|------------|-----|
| フル（100%） | `strength-full.svg` | 💪 3本の波 | 赤 |
| 普通（80%） | `strength-normal.svg` | 😐 2本の波 | 黄 |
| ソフト（60%） | `strength-soft.svg` | 🤏 1本の波 | 緑 |

### 4.5 風向きアイコン（6種類）

**サイズ**: 48x48px
**保存場所**: `/assets/icons/wind/`

| 風向き | ファイル名 | デザイン要素 |
|--------|-----------|------------|
| 無風 | `wind-none.svg` | 🌪️ 渦なし |
| アゲインスト | `wind-against.svg` | ⬆️ 上矢印 + 風線 |
| フォロー | `wind-follow.svg` | ⬇️ 下矢印 + 風線 |
| 左風 | `wind-left.svg` | ⬅️ 左矢印 + 風線 |
| 右風 | `wind-right.svg` | ➡️ 右矢印 + 風線 |
| 複雑 | `wind-complex.svg` | 🌀 回転矢印 |

### 4.6 天候・気温アイコン（3種類）

**サイズ**: 24x24px（小型）
**保存場所**: `/assets/icons/weather/`

| 季節 | ファイル名 | デザイン要素 |
|------|-----------|------------|
| 夏季 | `weather-summer.svg` | 🌞 太陽 |
| 中間期 | `weather-mid.svg` | 🍂 葉 |
| 冬季 | `weather-winter.svg` | ❄️ 雪の結晶 |

### 4.7 結果入力アイコン

**サイズ**: 24x24px
**保存場所**: `/assets/icons/result/`

| 要素 | ファイル名 | デザイン要素 |
|------|-----------|------------|
| ターゲット | `result-target.svg` | 🎯 中心マーク |
| 12時方向 | `result-clock-12.svg` | 時計表示 |
| ジャスト距離 | `result-just.svg` | 🟢 緑丸 |
| ショート | `result-short.svg` | 🟡 黄丸 |
| オーバー | `result-over.svg` | 🔵 青丸 |

---

## 5. ボタンデザイン仕様

### 5.1 ボタンサイズ（最小タップエリア）
```
- 大型ボタン: 60x60px（主要入力）
- 中型ボタン: 48x48px（補助入力）
- 小型ボタン: 36x36px（UI要素）
```

### 5.2 ボタン状態
```css
/* 通常状態 */
.button-normal {
  background: #E0E0E0;
  border: 2px solid #BDBDBD;
  color: #424242;
}

/* 選択状態 */
.button-selected {
  background: #2E7D32;
  border: 2px solid #1B5E20;
  color: #FFFFFF;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* ホバー/タップ状態 */
.button-hover {
  background: #4CAF50;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

/* 無効状態 */
.button-disabled {
  background: #F5F5F5;
  border: 2px solid #E0E0E0;
  color: #BDBDBD;
  opacity: 0.5;
}
```

### 5.3 タップフィードバック
- **視覚**: 0.2秒のスケール変化（1.0 → 1.05 → 1.0）
- **触覚**: デバイス振動（10ms）
- **音**: オプション（ソフトクリック音）

---

## 6. レスポンシブ対応

### 6.1 デバイス別サイズ調整
```css
/* 小型スマホ（～375px） */
@media (max-width: 375px) {
  .icon-button { width: 48px; height: 48px; }
}

/* 標準スマホ（376px～414px） */
@media (min-width: 376px) and (max-width: 414px) {
  .icon-button { width: 56px; height: 56px; }
}

/* 大型スマホ・タブレット（415px～） */
@media (min-width: 415px) {
  .icon-button { width: 64px; height: 64px; }
}
```

### 6.2 横画面対応
- ボタン配置を横2列から横3～4列に変更
- アイコンサイズは維持（視認性優先）

---

## 7. アクセシビリティ

### 7.1 カラーブラインド対応
- 色だけに依存しない（形状・アイコンで識別）
- 高コントラスト比の確保
- 代替テキスト（aria-label）の実装

### 7.2 スクリーンリーダー対応
```html
<button aria-label="左足上がりの傾斜を選択">
  <svg><!-- アイコン --></svg>
</button>
```

---

## 8. パフォーマンス最適化

### 8.1 SVG最適化
- SVGO等のツールで圧縮
- 不要な属性・メタデータの削除
- パスの簡略化

### 8.2 ロード戦略
- インライン埋め込み（初期表示速度優先）
- または、スプライトシート方式
- レイジーロード（結果画面等）

### 8.3 ファイルサイズ目標
- 基本アイコン: 500バイト以下
- 複雑なアイコン: 1KB以下

---

## 9. 今後の作業フロー

### 9.1 アイコン作成手順
1. デザイン要件の確認
2. SVGファイル作成（Figma / Illustrator / コード）
3. SVGO等で最適化
4. 指定ディレクトリに保存
5. テスト実装
6. 実機での視認性確認

### 9.2 チェックリスト
- [ ] viewBoxが正しく設定されている
- [ ] currentColorを使用している（色変更可能）
- [ ] ファイル名が命名規則に従っている
- [ ] 保存場所が正しい
- [ ] 最適化済み（不要なコード削除）
- [ ] 実機で視認性を確認
- [ ] 手袋着用時の操作性を確認

---

## 10. サンプル実装

### 10.1 Reactコンポーネント例
```jsx
import React from 'react';

const SlopeButton = ({ type, selected, onClick }) => {
  const icons = {
    flat: '/assets/icons/slope/slope-flat.svg',
    leftUp: '/assets/icons/slope/slope-left-up.svg',
    // ... 他の傾斜
  };

  return (
    <button
      className={`slope-button ${selected ? 'selected' : ''}`}
      onClick={onClick}
      aria-label={`傾斜: ${type}`}
    >
      <img src={icons[type]} alt="" />
    </button>
  );
};

export default SlopeButton;
```

---

## 次のステップ

1. **主要アイコンのSVG作成開始**
   - 傾斜アイコン（優先度: 高）
   - クラブアイコン（優先度: 高）
   - ライアイコン（優先度: 高）

2. **プロトタイプでの視認性テスト**
   - 実機での確認
   - 屋外での視認性確認
   - 手袋着用時の操作性確認

3. **フィードバック反映**
   - サイズ調整
   - 配色調整
   - レイアウト最適化
