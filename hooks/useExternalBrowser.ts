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
    if (!deviceInfo) {
      // デバイス情報がまだ準備できていない場合は通常のリダイレクト
      window.location.href = `https://app.kigasuru.com${path}`;
      return;
    }

    const appUrl = `https://app.kigasuru.com${path}`;

    if (deviceInfo.isLine) {
      // LINEブラウザの場合、外部ブラウザで開く
      if (deviceInfo.isIOS) {
        // iOS: Safariで開く
        // 方法1: 新しいウィンドウで開く（target="_blank"をJSで実行）
        const newWindow = window.open(appUrl, '_blank');

        // 方法2: 開けなかった場合のフォールバック（ユーザージェスチャーが必要）
        if (!newWindow) {
          // ポップアップがブロックされた場合、直接リダイレクト
          window.location.href = appUrl;
        }
      } else if (deviceInfo.isAndroid) {
        // Android: intentスキームでChromeを開く
        const intentUrl = `intent://${appUrl.replace('https://', '')}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;

        // フォールバック
        setTimeout(() => {
          window.location.href = appUrl;
        }, 1000);
      } else {
        // 判定できない場合は通常のリダイレクト
        window.location.href = appUrl;
      }
    } else {
      // LINE以外のブラウザの場合は通常通り開く
      window.location.href = appUrl;
    }
  };

  return {
    deviceInfo,
    openInExternalBrowser,
  };
}
