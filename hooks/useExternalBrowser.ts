import { useEffect, useState } from 'react';

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isLine: boolean;
  userAgent: string;
}

/**
 * LINEアプリ内ブラウザから外部ブラウザ(Safari/Chrome)でリンクを開くフック
 */
export function useExternalBrowser() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [showBrowserInstructions, setShowBrowserInstructions] = useState(false);

  // デバイス情報を取得
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    const info: DeviceInfo = {
      isIOS: /iphone|ipod|ipad/.test(ua),
      isAndroid: /android/.test(ua),
      isLine: ua.includes('line'),
      userAgent: navigator.userAgent
    };

    setDeviceInfo(info);

    // LINEアプリ内ブラウザの場合、ログ出力
    if (info.isLine) {
      console.log('[useExternalBrowser] LINE in-app browser detected');
    }
  }, []);

  // app.kigasuru.comを外部ブラウザで開く
  const openInExternalBrowser = (path = '/auth/signup') => {
    if (!deviceInfo) return;

    const appUrl = `https://app.kigasuru.com${path}`;

    if (deviceInfo.isLine) {
      let targetUrl: string;

      if (deviceInfo.isIOS) {
        // iOS: Safariで開く
        targetUrl = `x-safari-https://app.kigasuru.com${path}`;
        console.log('[useExternalBrowser] Opening in Safari (iOS):', targetUrl);
      } else if (deviceInfo.isAndroid) {
        // Android: Chromeで開く
        targetUrl = `googlechrome://app.kigasuru.com${path}`;
        console.log('[useExternalBrowser] Opening in Chrome (Android):', targetUrl);
      } else {
        targetUrl = appUrl;
      }

      // URLスキームで外部ブラウザを開く
      window.location.href = targetUrl;

      // フォールバック: 1秒後に手動案内を表示
      setTimeout(() => {
        setShowBrowserInstructions(true);
      }, 1000);

    } else {
      // LINE以外のブラウザの場合は通常通り開く
      window.location.href = appUrl;
    }
  };

  return {
    deviceInfo,
    showBrowserInstructions,
    setShowBrowserInstructions,
    openInExternalBrowser
  };
}
