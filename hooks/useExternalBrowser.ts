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
    // 最初に必ず表示されるアラート（関数が呼ばれたことを確認）
    alert('ボタンがクリックされました');

    const logs: string[] = [];

    if (!deviceInfo) {
      alert('デバイス情報がまだ準備できていません');
      return;
    }

    // デバッグ情報をアラートで表示
    const debugMsg = `デバイス検出:\niOS: ${deviceInfo.isIOS}\nAndroid: ${deviceInfo.isAndroid}\nLINE: ${deviceInfo.isLine}\n\nUserAgent:\n${deviceInfo.userAgent}`;
    alert(debugMsg);

    logs.push(`Device: iOS=${deviceInfo.isIOS}, Android=${deviceInfo.isAndroid}, LINE=${deviceInfo.isLine}`);
    logs.push(`UserAgent: ${deviceInfo.userAgent}`);

    const appUrl = `https://app.kigasuru.com${path}`;

    if (deviceInfo.isLine) {
      if (deviceInfo.isIOS) {
        // iOS: 直接Safariで開くように案内
        alert('iOSのLINEブラウザを検出しました。\n\n右上の「…」メニューから「Safariで開く」を選択してください。');
        setShowBrowserInstructions(true);
      } else if (deviceInfo.isAndroid) {
        // Android: 直接Chromeで開くように案内
        alert('AndroidのLINEブラウザを検出しました。\n\n右上のメニューから「他のアプリで開く」→「Chrome」を選択してください。');
        setShowBrowserInstructions(true);
      } else {
        // 判定できない場合
        alert('LINEブラウザを検出しましたが、端末を判別できませんでした。\n\nメニューから外部ブラウザで開いてください。');
        setShowBrowserInstructions(true);
      }

      setDebugInfo(logs);

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
