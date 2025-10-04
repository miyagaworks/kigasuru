import React from 'react';
import { Navigation } from './Navigation';

/**
 * Main layout component with bottom navigation
 */
export const Layout = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col">
      {/* Main content area */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      {showNav && <Navigation />}
    </div>
  );
};
