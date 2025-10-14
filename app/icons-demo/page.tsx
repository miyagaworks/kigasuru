"use client";

import React from "react";
import {
  // ゴルフ・スポーツ関連
  Target,
  Flag,
  Trophy,
  Medal,
  Goal,

  // データ分析
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  AreaChart,

  // 位置・マップ
  MapPin,
  Compass,
  Navigation,
  Map,

  // 記録・時間
  Timer,
  Clock,
  Calendar,
  CalendarDays,

  // UI基本
  CheckCircle,
  XCircle,
  Info,
  Settings,
  User,
  Users,

  // アクション
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,

  // ナビゲーション
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,

  // 天気
  Sun,
  Cloud,
  CloudRain,
  Wind,

  // その他
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

export default function IconsDemoPage() {
  const iconSections = [
    {
      title: "ゴルフ・スポーツ関連",
      description: "ゴルフアプリに最適なスポーツ関連アイコン",
      icons: [
        { Icon: Target, name: "Target", description: "ターゲット、ホール、目標" },
        { Icon: Flag, name: "Flag", description: "ホールフラッグ、完了" },
        { Icon: Trophy, name: "Trophy", description: "トロフィー、総合成績" },
        { Icon: Medal, name: "Medal", description: "メダル、達成" },
        { Icon: Goal, name: "Goal", description: "ゴール、目標設定" },
      ],
    },
    {
      title: "データ分析・統計",
      description: "スコア推移やパフォーマンス分析に使用",
      icons: [
        { Icon: TrendingUp, name: "TrendingUp", description: "上昇トレンド、改善" },
        { Icon: TrendingDown, name: "TrendingDown", description: "下降トレンド" },
        { Icon: BarChart3, name: "BarChart3", description: "バーチャート" },
        { Icon: LineChart, name: "LineChart", description: "折れ線グラフ" },
        { Icon: PieChart, name: "PieChart", description: "円グラフ" },
        { Icon: Activity, name: "Activity", description: "アクティビティ波形" },
        { Icon: AreaChart, name: "AreaChart", description: "エリアチャート" },
      ],
    },
    {
      title: "位置・マップ",
      description: "コース、位置情報の表示",
      icons: [
        { Icon: MapPin, name: "MapPin", description: "ピン、位置マーカー" },
        { Icon: Compass, name: "Compass", description: "コンパス、方向" },
        { Icon: Navigation, name: "Navigation", description: "ナビゲーション" },
        { Icon: Map, name: "Map", description: "マップ" },
      ],
    },
    {
      title: "記録・時間",
      description: "ラウンド時間、日付の記録",
      icons: [
        { Icon: Timer, name: "Timer", description: "タイマー" },
        { Icon: Clock, name: "Clock", description: "時計、時間" },
        { Icon: Calendar, name: "Calendar", description: "カレンダー" },
        { Icon: CalendarDays, name: "CalendarDays", description: "日付選択" },
      ],
    },
    {
      title: "UI基本要素",
      description: "基本的なユーザーインターフェース",
      icons: [
        { Icon: CheckCircle, name: "CheckCircle", description: "完了、成功" },
        { Icon: XCircle, name: "XCircle", description: "エラー、キャンセル" },
        { Icon: Info, name: "Info", description: "情報" },
        { Icon: AlertCircle, name: "AlertCircle", description: "注意" },
        { Icon: AlertTriangle, name: "AlertTriangle", description: "警告" },
        { Icon: Settings, name: "Settings", description: "設定" },
        { Icon: User, name: "User", description: "ユーザー" },
        { Icon: Users, name: "Users", description: "複数ユーザー" },
      ],
    },
    {
      title: "アクション",
      description: "ユーザーアクションボタン",
      icons: [
        { Icon: Plus, name: "Plus", description: "追加" },
        { Icon: Minus, name: "Minus", description: "削除、減少" },
        { Icon: Edit, name: "Edit", description: "編集" },
        { Icon: Trash2, name: "Trash2", description: "削除" },
        { Icon: Save, name: "Save", description: "保存" },
        { Icon: Download, name: "Download", description: "ダウンロード" },
        { Icon: Upload, name: "Upload", description: "アップロード" },
      ],
    },
    {
      title: "ナビゲーション",
      description: "画面遷移、方向指示",
      icons: [
        { Icon: ChevronLeft, name: "ChevronLeft", description: "左へ" },
        { Icon: ChevronRight, name: "ChevronRight", description: "右へ" },
        { Icon: ChevronUp, name: "ChevronUp", description: "上へ" },
        { Icon: ChevronDown, name: "ChevronDown", description: "下へ" },
        { Icon: ArrowLeft, name: "ArrowLeft", description: "戻る" },
        { Icon: ArrowRight, name: "ArrowRight", description: "進む" },
      ],
    },
    {
      title: "天気・環境",
      description: "ラウンド時の天候記録",
      icons: [
        { Icon: Sun, name: "Sun", description: "晴れ" },
        { Icon: Cloud, name: "Cloud", description: "曇り" },
        { Icon: CloudRain, name: "CloudRain", description: "雨" },
        { Icon: Wind, name: "Wind", description: "風" },
      ],
    },
    {
      title: "その他",
      description: "評価、お気に入りなど",
      icons: [
        { Icon: Star, name: "Star", description: "星、評価" },
        { Icon: Heart, name: "Heart", description: "お気に入り" },
        { Icon: ThumbsUp, name: "ThumbsUp", description: "良い" },
        { Icon: ThumbsDown, name: "ThumbsDown", description: "悪い" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Lucide Icons デモ
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            ゴルフアプリに使える完全無料のアイコンライブラリ
          </p>
          <p className="text-gray-500">
            各アイコンをクリックすると、アイコン名がクリップボードにコピーされます
          </p>
        </div>

        {/* アイコンセクション */}
        <div className="space-y-12">
          {iconSections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-200"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {section.title}
              </h2>
              <p className="text-gray-600 mb-8">{section.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {section.icons.map((item, iconIndex) => (
                  <button
                    key={iconIndex}
                    onClick={() => {
                      navigator.clipboard.writeText(item.name);
                      alert(`"${item.name}" をコピーしました！`);
                    }}
                    className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 flex items-center justify-center bg-white border-2 border-gray-300 rounded-2xl shadow-lg group-hover:scale-110 group-hover:border-green-500 transition-all">
                        <item.Icon className="w-8 h-8 text-green-600 group-hover:text-green-700" strokeWidth={2} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-sm mb-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 使用例 */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-2xl p-10 border-2 border-blue-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            使用例（コード）
          </h2>
          <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm">
              <code>{`import { Target, TrendingUp, MapPin } from "lucide-react";

// サイズと色をカスタマイズ
<Target className="w-6 h-6 text-green-600" />
<TrendingUp className="w-8 h-8 text-blue-500" />
<MapPin className="w-5 h-5 text-red-500" />

// strokeWidthで線の太さを変更
<Target className="w-6 h-6" strokeWidth={1.5} />
<Target className="w-6 h-6" strokeWidth={3} />`}</code>
            </pre>
          </div>
        </div>

        {/* サイズサンプル */}
        <div className="mt-12 bg-white rounded-3xl shadow-xl p-10 border-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            サイズサンプル
          </h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <Target className="w-4 h-4 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">w-4 h-4 (16px)</p>
            </div>
            <div className="text-center">
              <Target className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">w-5 h-5 (20px)</p>
            </div>
            <div className="text-center">
              <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">w-6 h-6 (24px)</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">w-8 h-8 (32px)</p>
            </div>
            <div className="text-center">
              <Target className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">w-10 h-10 (40px)</p>
            </div>
            <div className="text-center">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">w-12 h-12 (48px)</p>
            </div>
            <div className="text-center">
              <Target className="w-16 h-16 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">w-16 h-16 (64px)</p>
            </div>
          </div>
        </div>

        {/* カラーサンプル */}
        <div className="mt-12 bg-white rounded-3xl shadow-xl p-10 border-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            カラーサンプル
          </h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">text-green-600</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">text-blue-600</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">text-red-600</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">text-orange-600</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">text-purple-600</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">text-gray-600</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
