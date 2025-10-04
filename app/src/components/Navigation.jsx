import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

/**
 * Bottom navigation bar for main screens
 */
export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'home', label: 'ホーム' },
    { path: '/record', icon: 'record', label: '記録' },
    { path: '/history', icon: 'calendar', label: '履歴' },
    { path: '/analysis', icon: 'analysis', label: '分析' },
    { path: '/settings', icon: 'settings', label: '設定' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-menu)] border-t border-[var(--color-neutral-300)] shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-4 transition-colors ${
                isActive
                  ? "text-[var(--color-primary-green)]"
                  : "text-[var(--color-neutral-900)]"
              }`}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  WebkitMaskImage: `url(/assets/icons/ui/ui-${icon}.svg)`,
                  maskImage: `url(/assets/icons/ui/ui-${icon}.svg)`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  backgroundColor: isActive ? 'var(--color-primary-green)' : 'var(--color-neutral-900)'
                }}
              />
              <span className="text-xs mt-1">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
