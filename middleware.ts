// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = nextUrl.pathname.startsWith('/auth');
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');

  // PWA and static files that should be publicly accessible
  const isStaticAsset =
    nextUrl.pathname === '/manifest.json' ||
    nextUrl.pathname === '/favicon.ico' ||
    nextUrl.pathname.startsWith('/icon-') ||
    nextUrl.pathname === '/apple-touch-icon.png' ||
    nextUrl.pathname === '/og-image.png';

  const isPublicRoute = nextUrl.pathname === '/landing' || isAuthRoute || isApiAuthRoute || isStaticAsset;

  // トップページへのアクセス処理
  if (nextUrl.pathname === '/') {
    if (isLoggedIn) {
      // 管理者は管理者ダッシュボードへ
      const isAdmin = req.auth?.user?.isAdmin;
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', nextUrl));
      }
      // 一般ユーザーはダッシュボードへ
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    } else {
      // 未認証ユーザーは新規登録ページへ
      return NextResponse.redirect(new URL('/auth/signup', nextUrl));
    }
  }

  // 認証されていないユーザーを保護されたルートから除外
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl),
    );
  }

  // 認証済みユーザーが認証ページにアクセスした場合、ダッシュボードにリダイレクト
  if (isLoggedIn && isAuthRoute && !nextUrl.pathname.includes('/auth/error')) {
    const isAdmin = req.auth?.user?.isAdmin;
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', nextUrl));
    }
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // 管理者が一般ダッシュボードにアクセスした場合、管理者ダッシュボードにリダイレクト
  const isAdmin = req.auth?.user?.isAdmin;
  if (isLoggedIn && isAdmin && nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/admin', nextUrl));
  }

  // サブスクリプションチェック（管理者ルートと公開ルートを除く）
  if (isLoggedIn && !isPublicRoute && !isAdminRoute) {
    const subscriptionStatus = req.auth?.user?.subscriptionStatus;

    // 有効なサブスクリプションステータス
    const validStatuses = ['active', 'permanent', 'trial'];

    // subscriptionStatusが無効または期限切れの場合
    if (!subscriptionStatus || !validStatuses.includes(subscriptionStatus)) {
      // サブスクリプションページ以外からアクセスしている場合、サブスクリプションページにリダイレクト
      if (!nextUrl.pathname.startsWith('/subscription')) {
        return NextResponse.redirect(new URL('/subscription', nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
