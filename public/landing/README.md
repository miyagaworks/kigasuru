# ランディングページ用画像ファイル

このディレクトリには、ランディングページで使用する画像ファイルを配置します。

## 必要な画像ファイル一覧

### ヒーローセクション
- `hero-background.jpg` または `hero-background.webp`
  - サイズ: 1920x1080px (16:9)
  - 内容: ゴルフコースの美しい風景、またはショットを打つシルエット

### スクリーンショット (`/screenshots/`)
- `screenshot-record.png` - 記録画面のスクリーンショット (375x812px)
- `screenshot-analysis.png` - 分析画面のスクリーンショット (375x812px)
- `screenshot-history.png` - 履歴画面のスクリーンショット (375x812px)

### データビジュアライゼーション (`/visualizations/`)
- `viz-club-accuracy.png` - クラブ別精度のグラフ (800x600px)
- `viz-shot-pattern.png` - ショットパターンのヒートマップ (800x600px)
- `viz-condition-comparison.png` - 条件別比較グラフ (800x600px)

### 問題提起イラスト (`/problems/`) - オプション
- `problem-1.svg` - 感覚のズレを表すイラスト
- `problem-2.svg` - 条件の影響を表すイラスト
- `problem-3.svg` - 繰り返すミスを表すイラスト

### 使い方イラスト (`/steps/`) - オプション
- `step-1.svg` - ショットを打つイラスト
- `step-2.svg` - 結果を記録するイラスト
- `step-3.svg` - データで確認するイラスト

## 注意事項
- 画像がない場合は、プレースホルダーまたはグラデーション背景が表示されます
- WebP形式を推奨（ファイルサイズが小さく、品質が高い）
- SVGはインラインで直接コンポーネントに埋め込むこともできます
