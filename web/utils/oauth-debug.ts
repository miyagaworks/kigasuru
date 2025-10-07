// OAuth認証デバッグヘルパー
export const debugOAuth = {
  // PWAモードの検出
  isPWA: () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = 'standalone' in window.navigator &&
                            (window.navigator as { standalone?: boolean }).standalone === true;
    return isStandalone || isIOSStandalone;
  },

  // 環境情報の取得
  getEnvironmentInfo: () => {
    return {
      isPWA: debugOAuth.isPWA(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      currentUrl: window.location.href,
      referrer: document.referrer,
      standalone: (window.navigator as any).standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
    };
  },

  // OAuth設定の検証
  validateOAuthConfig: async () => {
    try {
      const response = await fetch('/api/auth/providers');
      const providers = await response.json();
      return {
        success: true,
        providers: Object.keys(providers || {}),
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // セッション状態の確認
  checkSession: async () => {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      return {
        success: true,
        hasSession: !!session?.user,
        sessionData: session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // デバッグ情報をコンソールに出力
  logDebugInfo: async () => {
    console.group('🔍 OAuth Debug Information');

    console.log('📱 Environment:', debugOAuth.getEnvironmentInfo());

    const configValidation = await debugOAuth.validateOAuthConfig();
    console.log('⚙️ OAuth Config:', configValidation);

    const sessionCheck = await debugOAuth.checkSession();
    console.log('🔐 Session Status:', sessionCheck);

    console.log('🌐 Current URL:', window.location.href);
    console.log('🍪 Cookies Enabled:', navigator.cookieEnabled);

    console.groupEnd();
  },
};

// エラーレポートの生成
export const generateErrorReport = async (error: any) => {
  const report = {
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message || error?.error || 'Unknown error',
      stack: error?.stack,
      code: error?.code,
    },
    environment: debugOAuth.getEnvironmentInfo(),
    session: await debugOAuth.checkSession(),
    config: await debugOAuth.validateOAuthConfig(),
  };

  return report;
};