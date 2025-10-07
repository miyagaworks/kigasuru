'use client';

import { useState, useEffect } from 'react';

export function IosPwaAuthNotice() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
      setIsPWA(isIOS && isStandalone);
    };
    checkPWA();
  }, []);

  if (!isPWA) return null;

  return (
    <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-900">
            iOS PWAでのログインについて
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            iOS PWAではLINE認証がご利用いただけません。Googleまたはメールアドレスでログインしてください。
          </p>

          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-slate-900">
              利用可能なログイン方法：
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
              <li>Googleアカウントでログイン</li>
              <li>メールアドレスとパスワードでログイン</li>
            </ul>
          </div>

          <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">LINE認証をご利用の方へ：</span><br />
              LINE認証で登録された方は、SafariでGoogleアカウントまたはメールアドレスを追加設定してから、PWAでログインしてください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}