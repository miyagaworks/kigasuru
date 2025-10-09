'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navigation } from './Navigation';
import { isAdmin } from '@/lib/admin';

/**
 * Main layout component with bottom navigation
 */
interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      {session && (
        <div className="fixed top-3 right-3 z-50" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-[var(--color-primary-green)] text-white font-bold text-sm flex items-center justify-center hover:bg-[var(--color-primary-dark)] transition-colors overflow-hidden"
            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
          >
            {session.user?.image ? (
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
          {showUserMenu && (
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
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/account');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)] rounded transition-colors flex items-center gap-2"
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
                  className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)] rounded transition-colors flex items-center gap-2"
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
                {isAdmin(session.user?.email) && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/admin');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)] rounded transition-colors flex items-center gap-2"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    管理者ページ
                  </button>
                )}
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
