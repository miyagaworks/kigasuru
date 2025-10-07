// app/account/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'react-hot-toast';
import { AuthProviders } from '@/components/AuthProviders';

interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  image?: string | null;
  hasPassword?: boolean;
  authProviders?: string[];
  needsAdditionalAuth?: boolean;
}

/**
 * Account page - Profile management
 */
export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [authProviders, setAuthProviders] = useState<string[]>([]);
  const [needsAdditionalAuth, setNeedsAdditionalAuth] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }

    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/profile?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });

        if (!response.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }

        const data = await response.json();
        const userData: UserProfile = data.user;

        setFormData({
          name: userData?.name || '',
          email: userData?.email || '',
        });
        setImage(userData?.image || null);
        setHasPassword(userData?.hasPassword || false);
        setAuthProviders(userData?.authProviders || []);
        setNeedsAdditionalAuth(userData?.needsAdditionalAuth || false);
      } catch {
        toast.error('プロフィール情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('プロフィールを更新しました');
        if (data.user) {
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
          });
          setImage(data.user.image);

          // セッションを更新して右上のアイコンも更新
          // 画像はDBから毎回取得されるので、名前のみ更新してリロード
          try {
            await update({
              name: data.user.name,
            });
            // ページをリロードして最新のセッション（画像含む）を取得
            window.location.reload();
          } catch (error) {
            console.error('Session update error:', error);
            // エラーがあってもリロードして最新のセッションを取得
            window.location.reload();
          }
        }
      } else {
        throw new Error('プロフィールの更新に失敗しました');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // 半角英数字と記号のみ許可
    const sanitizedValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
    setPasswordData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('すべての項目を入力してください');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新しいパスワードが一致しません');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('新しいパスワードは8文字以上で入力してください');
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワードの変更に失敗しました');
      }

      toast.success('パスワードを変更しました');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'パスワードの変更に失敗しました');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-green)]"></div>
          <p className="mt-4 text-sm text-[var(--color-neutral-600)]">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto pb-32">
        <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-2 flex items-center gap-2">
          <Icon category="ui" name="user" size={28} />
          アカウント設定
        </h1>
        <p className="text-sm text-[var(--color-neutral-600)] mb-6">
          プロフィール画像と名前を変更できます
        </p>

        <form onSubmit={handleSubmit}>
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
              プロフィール画像
            </h2>

            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="w-32 h-32">
                <ImageUpload
                  value={image}
                  onChange={(value) => setImage(value)}
                  disabled={isSaving}
                />
              </div>
              <p className="text-sm text-[var(--color-neutral-600)] text-center">
                クリックして画像をアップロード（JPG, PNG, 最大5MB）
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                  名前
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full px-4 py-2 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed"
                  placeholder="名前を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled={true}
                  className="w-full px-4 py-2 border border-[var(--color-neutral-300)] rounded-lg bg-[var(--color-neutral-100)] cursor-not-allowed"
                />
                <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                  メールアドレスは変更できません
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? '更新中...' : '更新する'}
            </Button>
          </div>
        </form>

        {/* Authentication Providers Section */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
            ログイン方法
          </h2>
          <AuthProviders
            authProviders={authProviders}
            hasPassword={hasPassword}
            needsAdditionalAuth={needsAdditionalAuth}
          />
        </div>

        {/* Password change section - only for email authenticated users */}
        {hasPassword && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-bold text-[var(--color-neutral-900)] mb-4">
                パスワード変更
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                    現在のパスワード
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      onPaste={(e) => {
                        // ペースト時も半角のみ許可
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const sanitized = pastedText.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                        setPasswordData((prev) => ({ ...prev, currentPassword: sanitized }));
                      }}
                      disabled={isChangingPassword}
                      className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed"
                      placeholder="現在のパスワードを入力"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 flex items-center text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] focus:outline-none z-10"
                      style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minHeight: 'auto',
                        minWidth: 'auto',
                      }}
                    >
                      {showPasswords.current ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                    新しいパスワード
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      onPaste={(e) => {
                        // ペースト時も半角のみ許可
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const sanitized = pastedText.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                        setPasswordData((prev) => ({ ...prev, newPassword: sanitized }));
                      }}
                      disabled={isChangingPassword}
                      className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed"
                      placeholder="新しいパスワードを入力（8文字以上）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 flex items-center text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] focus:outline-none z-10"
                      style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minHeight: 'auto',
                        minWidth: 'auto',
                      }}
                    >
                      {showPasswords.new ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                    新しいパスワード（確認）
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      onPaste={(e) => {
                        // ペースト時も半角のみ許可
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const sanitized = pastedText.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
                        setPasswordData((prev) => ({ ...prev, confirmPassword: sanitized }));
                      }}
                      disabled={isChangingPassword}
                      className="w-full px-4 py-2 pr-12 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-green)] disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed"
                      placeholder="新しいパスワードを再入力"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 flex items-center text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] focus:outline-none z-10"
                      style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minHeight: 'auto',
                        minWidth: 'auto',
                      }}
                    >
                      {showPasswords.confirm ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    isChangingPassword ||
                    !passwordData.currentPassword.trim() ||
                    !passwordData.newPassword.trim() ||
                    !passwordData.confirmPassword.trim() ||
                    passwordData.newPassword.length < 8 ||
                    passwordData.newPassword !== passwordData.confirmPassword
                  }
                  className="w-full"
                >
                  {isChangingPassword ? 'パスワード変更中...' : 'パスワードを変更'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
