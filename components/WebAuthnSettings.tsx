'use client';

import { useState, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

interface Credential {
  id: string;
  name: string | null;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string;
}

export default function WebAuthnSettings() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialName, setCredentialName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/auth/webauthn/credentials');
      const data = await response.json();
      if (response.ok) {
        setCredentials(data.credentials || []);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    setIsRegistering(true);

    try {
      // 登録オプションを取得
      const optionsResponse = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options');
      }

      const options = await optionsResponse.json();

      // WebAuthn登録を開始
      const registrationResponse = await startRegistration(options);

      // レスポンスを検証
      const verifyResponse = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: registrationResponse,
          credentialName: credentialName || undefined,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Registration failed');
      }

      setSuccess('パスキーを登録しました');
      setCredentialName('');
      await loadCredentials();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('登録に失敗しました');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async (credentialId: string) => {
    if (!confirm('この認証情報を削除しますか？')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/webauthn/credentials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete');
      }

      setSuccess('認証情報を削除しました');
      await loadCredentials();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('削除に失敗しました');
      }
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        パスキー・指紋認証（WebAuthn）
      </h3>

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

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          パスキーや生体認証（指紋、顔認証など）を使用してログインできます。
        </p>

        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="認証情報の名前（任意）"
            value={credentialName}
            onChange={(e) => setCredentialName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {isRegistering ? '登録中...' : 'パスキーを追加'}
          </button>
        </div>
      </div>

      {credentials.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">登録済みの認証情報</h4>
          <div className="space-y-2">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {cred.name || '名前なし'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cred.deviceType === 'platform' ? 'このデバイス' : 'セキュリティキー'} •
                    登録日: {new Date(cred.createdAt).toLocaleDateString('ja-JP')} •
                    最終使用: {new Date(cred.lastUsedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(cred.id)}
                  className="ml-4 text-sm text-red-600 hover:text-red-700"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {credentials.length === 0 && (
        <p className="text-sm text-gray-500">登録済みの認証情報はありません</p>
      )}
    </div>
  );
}
