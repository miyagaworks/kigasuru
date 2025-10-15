'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navigation } from './Navigation';
import { isAdmin } from '@/lib/admin';
import { initDB, syncShotsFromServer, syncSettingsFromServer } from '@/lib/db';

/**
 * Main layout component with bottom navigation
 */
interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize IndexedDB with user ID and sync from server
  useEffect(() => {
    console.log('[Layout] Session status:', status);
    console.log('[Layout] Session data:', session);
    if (session?.user?.id) {
      console.log('[Layout] Initializing DB for user:', session.user.id);
      initDB(session.user.id);

      // サーバーからデータを同期（オンライン時のみ）
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        // 設定を同期
        syncSettingsFromServer().then((result) => {
          if (result.success) {
            console.log('[Layout] Successfully synced settings from server');
          } else {
            console.error('[Layout] Failed to sync settings from server:', result.error);
          }
        }).catch((error) => {
          console.error('[Layout] Error during settings sync:', error);
        });

        // ショットデータを同期
        syncShotsFromServer().then((result) => {
          if (result.success) {
            console.log(`[Layout] Successfully synced ${result.synced} shots from server`);
          } else {
            console.error('[Layout] Failed to sync shots from server:', result.error);
          }
        }).catch((error) => {
          console.error('[Layout] Error during shots sync:', error);
        });
      }
    }
  }, [session?.user?.id, session, status]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    // Close IndexedDB before logout
    const { getDB } = await import('@/lib/db');
    try {
      const db = getDB();
      db.close();
      console.log('[Layout] Closed IndexedDB on logout');
    } catch (error) {
      console.error('[Layout] Error closing IndexedDB:', error);
    }

    await signOut({ callbackUrl: '/auth/signin' });
  };

  // Get user initials
  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="bg-[var(--color-bg-main)]">
      {/* User menu button - fixed to top right */}
      {(status === 'loading' || session) && (
        <div className="fixed top-3 right-3 z-50" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-[var(--color-primary-green)] text-white font-bold text-sm flex items-center justify-center hover:bg-[var(--color-primary-dark)] transition-colors overflow-hidden"
            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : session?.user?.image ? (
              session.user.image.startsWith('data:') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={session.user.image}
                  alt={session.user.name || 'ユーザー'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'ユーザー'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              getUserInitials()
            )}
          </button>

          {/* Dropdown menu */}
          {showUserMenu && session && (
            <div className="absolute top-12 right-0 w-64 bg-[var(--color-card-bg)] rounded-lg shadow-xl border border-[var(--color-neutral-300)] overflow-hidden">
              <div className="p-4 border-b border-[var(--color-neutral-300)] bg-[var(--color-neutral-200)]">
                <p className="text-sm font-bold text-[var(--color-neutral-900)] truncate">
                  {session.user?.name || 'ユーザー'}
                </p>
                <p className="text-xs text-[var(--color-neutral-600)] truncate">
                  {session.user?.email}
                </p>
              </div>
              <div className="p-2">
                {isAdmin(session.user?.email) ? (
                  <>
                    {/* 管理者メニュー */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      管理ダッシュボード
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/analytics');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      使用状況分析
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/users');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      ユーザー管理
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/subscriptions');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      サブスクリプション管理
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/cancellation-requests');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      解約申請管理
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/emails');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      メール配信管理
                    </button>

                    {/* 区切り線 */}
                    <div className="border-t border-[var(--color-neutral-300)] my-2"></div>

                    {/* アカウント設定 */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/account');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      アカウント設定
                    </button>

                    {/* ログアウト */}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      ログアウト
                    </button>
                  </>
                ) : (
                  <>
                    {/* 一般ユーザーメニュー */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/account');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      アカウント設定
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/subscription');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-300)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      ご利用プラン
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)] rounded transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      ログアウト
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <main className="pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        {children}
      </main>

      {/* Bottom navigation */}
      {showNav && <Navigation />}
    </div>
  );
};
