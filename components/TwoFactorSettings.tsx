'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TwoFactorSettingsProps {
  userId: string;
  initialEnabled?: boolean;
}

export default function TwoFactorSettings({ userId, initialEnabled = false }: TwoFactorSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSetup = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'セットアップに失敗しました');
      }

      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setShowSetup(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('セットアップに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '有効化に失敗しました');
      }

      setEnabled(true);
      setShowSetup(false);
      setShowBackupCodes(true);
      setSuccess('二要素認証を有効にしました');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('有効化に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('二要素認証を無効にしますか？')) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '無効化に失敗しました');
      }

      setEnabled(false);
      setSuccess('二要素認証を無効にしました');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('無効化に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('新しいバックアップコードを生成しますか？古いコードは使用できなくなります。')) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/regenerate-backup', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成に失敗しました');
      }

      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setSuccess('新しいバックアップコードを生成しました');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('生成に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('バックアップコードをコピーしました');
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">二要素認証（TOTP）</h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {!enabled && !showSetup && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            認証アプリ（Google Authenticator、Microsoft Authenticatorなど）を使用してアカウントのセキュリティを強化します。
          </p>
          <button
            onClick={handleStartSetup}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '準備中...' : '二要素認証を有効にする'}
          </button>
        </div>
      )}

      {showSetup && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              1. 認証アプリで以下のQRコードをスキャンしてください：
            </p>
            {qrCodeUrl && (
              <div className="flex justify-center my-4">
                <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} />
              </div>
            )}
            <p className="text-xs text-gray-500 text-center">
              または、このコードを手動で入力：<br />
              <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              2. 認証アプリに表示される6桁のコードを入力してください：
            </p>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleEnable}
              disabled={isLoading || verificationCode.length !== 6}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '検証中...' : '有効にする'}
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-gray-900">二要素認証が有効です</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleRegenerateBackupCodes}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              バックアップコードを再生成
            </button>
            <button
              onClick={handleDisable}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              無効にする
            </button>
          </div>
        </div>
      )}

      {showBackupCodes && backupCodes.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">
            バックアップコード
          </h4>
          <p className="text-xs text-yellow-800 mb-3">
            認証アプリにアクセスできない場合に使用できます。安全な場所に保存してください。
          </p>
          <div className="bg-white p-3 rounded border border-yellow-300 mb-3">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index}>{code}</div>
              ))}
            </div>
          </div>
          <button
            onClick={copyBackupCodes}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            コピー
          </button>
        </div>
      )}
    </div>
  );
}
