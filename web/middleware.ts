// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = nextUrl.pathname.startsWith('/auth');
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');

  // PWA and static files that should be publicly accessible
  const isStaticAsset =
    nextUrl.pathname === '/manifest.json' ||
    nextUrl.pathname === '/favicon.ico' ||
    nextUrl.pathname.startsWith('/icon-') ||
    nextUrl.pathname === '/apple-touch-icon.png' ||
    nextUrl.pathname === '/og-image.png';

  const isPublicRoute = nextUrl.pathname === '/' || isAuthRoute || isApiAuthRoute || isStaticAsset;

  // 認証されていないユーザーを保護されたルートから除外
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl),
    );
  }

  // 認証済みユーザーが認証ページにアクセスした場合、ダッシュボードにリダイレクト
  if (isLoggedIn && isAuthRoute && !nextUrl.pathname.includes('/auth/error')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
