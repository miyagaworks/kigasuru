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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

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
    const logs: string[] = [];

    if (!deviceInfo) {
      logs.push('Device info not ready');
      setDebugInfo(logs);
      return;
    }

    logs.push(`Device: iOS=${deviceInfo.isIOS}, Android=${deviceInfo.isAndroid}, LINE=${deviceInfo.isLine}`);
    logs.push(`UserAgent: ${deviceInfo.userAgent}`);

    const appUrl = `https://app.kigasuru.com${path}`;

    if (deviceInfo.isLine) {
      let targetUrl: string;

      if (deviceInfo.isIOS) {
        // iOS: Safariで開く
        targetUrl = `x-safari-https://app.kigasuru.com${path}`;
        logs.push(`iOS detected - Using: ${targetUrl}`);

        // iframeを使った方法も試す
        try {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = targetUrl;
          document.body.appendChild(iframe);
          logs.push('iframe created successfully');

          setTimeout(() => {
            document.body.removeChild(iframe);
            logs.push('iframe removed');
          }, 100);
        } catch (error) {
          logs.push(`iframe error: ${error}`);
        }

      } else if (deviceInfo.isAndroid) {
        // Android: intent URLを使用
        targetUrl = `intent://app.kigasuru.com${path}#Intent;scheme=https;package=com.android.chrome;end`;
        logs.push(`Android detected - Using: ${targetUrl}`);
        window.location.href = targetUrl;
      } else {
        targetUrl = appUrl;
        logs.push(`Unknown platform - Using normal URL: ${targetUrl}`);
        window.location.href = targetUrl;
      }

      setDebugInfo(logs);

      // フォールバック: 1.5秒後に手動案内を表示
      setTimeout(() => {
        setShowBrowserInstructions(true);
      }, 1500);

    } else {
      // LINE以外のブラウザの場合は通常通り開く
      logs.push(`Not LINE browser - redirecting to: ${appUrl}`);
      setDebugInfo(logs);
      window.location.href = appUrl;
    }
  };

  return {
    deviceInfo,
    showBrowserInstructions,
    setShowBrowserInstructions,
    openInExternalBrowser,
    debugInfo
  };
}
