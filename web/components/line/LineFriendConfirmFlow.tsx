// components/line/LineFriendConfirmFlow.tsx
"use client";

import { useState, useEffect } from "react";

interface LineFriendConfirmFlowProps {
  onComplete?: () => void;
}

export default function LineFriendConfirmFlow({ onComplete }: LineFriendConfirmFlowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<
    "start" | "waiting" | "confirming" | "complete"
  >("start");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const LINE_ADD_URL = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || "https://lin.ee/afKHtFU";

  useEffect(() => {
    // モーダルを表示するか確認（localStorageで管理）
    const dismissed = localStorage.getItem("line_campaign_dismissed");
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (step !== "complete") {
      // 完了していない場合は一時的に閉じるだけ（次回再表示）
      setIsOpen(false);
    } else {
      // 完了している場合は永続的に閉じる
      localStorage.setItem("line_campaign_dismissed", "true");
      setIsOpen(false);
      onComplete?.();
    }
  };

  const handleStartAddFriend = () => {
    window.open(LINE_ADD_URL, "_blank");
    setStep("waiting");
    setError("");
  };

  const handleConfirmAddFriend = async () => {
    setStep("confirming");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/line/confirm-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep("complete");
        // 3秒後に自動で閉じる
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setError(
          data.message || "友だち追加が確認できませんでした。LINEで友だち追加後、もう一度お試しください。"
        );
        setStep("waiting");
      }
    } catch (error) {
      console.error("Friend confirmation error:", error);
      setError("エラーが発生しました。もう一度お試しください。");
      setStep("waiting");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-slideUp overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Step Indicator */}
          {step !== "complete" && (
            <div className="flex items-center justify-center gap-2 pt-6 pb-4 px-6">
              <div className={`h-2 flex-1 rounded-full transition-all ${step === "start" ? "bg-[#06C755]" : "bg-gray-200"}`} />
              <div className={`h-2 flex-1 rounded-full transition-all ${step === "waiting" || step === "confirming" ? "bg-[#06C755]" : "bg-gray-200"}`} />
            </div>
          )}

          {/* Content */}
          <div className="p-6 pt-4">
            {/* Start Step */}
            {step === "start" && (
              <div className="text-center animate-fadeIn">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#06C755] to-[#00B900] rounded-full animate-pulse opacity-20" />
                  <div className="relative w-20 h-20 flex items-center justify-center text-6xl">
                    🎁
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                  30日間無料キャンペーン
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  公式LINEを友だち追加すると<br />
                  <span className="text-[#06C755] font-bold text-xl">30日間無料</span>
                  でご利用いただけます
                </p>

                {/* Benefits */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">✨</span>
                    <h3 className="font-bold text-gray-900">特典内容</h3>
                  </div>
                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-[#06C755] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>無料期間が<strong className="text-[#06C755]">7日間→30日間</strong>に延長</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-[#06C755] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>全機能が制限なく利用可能</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-[#06C755] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>分析レポートやリマインダーをLINEで受信</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleStartAddFriend}
                  className="w-full py-4 bg-gradient-to-r from-[#06C755] to-[#00B900] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    <span>友だち追加して</span>
                  </div>
                  <span>30日間無料で使う</span>
                </button>
              </div>
            )}

            {/* Waiting Step */}
            {step === "waiting" && (
              <div className="text-center animate-fadeIn">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#06C755] to-[#00B900] rounded-full animate-ping opacity-20" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📱</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-3 text-gray-900">
                  友だち追加はお済みですか？
                </h2>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  LINEで「上手くなる気がするぅぅぅ」を<br />友だち追加したら、下のボタンを押して下さい
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-shake">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleConfirmAddFriend}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-[#06C755] to-[#00B900] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "確認中..." : "✓ 友だち追加完了"}
                  </button>

                  <button
                    onClick={handleStartAddFriend}
                    className="w-full py-3 text-[#06C755] hover:text-[#00B900] font-medium text-sm transition-colors"
                  >
                    もう一度友だち追加ページを開く →
                  </button>
                </div>
              </div>
            )}

            {/* Confirming Step */}
            {step === "confirming" && (
              <div className="text-center py-8 animate-fadeIn">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#06C755] rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-gray-700 font-medium">連携を確認中...</p>
              </div>
            )}

            {/* Complete Step */}
            {step === "complete" && (
              <div className="text-center animate-fadeIn">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#06C755] to-[#00B900] rounded-full animate-ping opacity-20" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[#06C755] to-[#00B900] rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-12 h-12 text-white animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-[#06C755]">
                  連携完了！
                </h2>
                <p className="text-gray-600 mb-6">
                  30日間の無料期間が開始されました
                </p>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    今後、ショット分析レポートやラウンド予定のリマインダーなどをLINEで受け取れます。
                    通知設定は「設定」メニューから変更できます。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes checkmark {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-checkmark {
          animation: checkmark 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
