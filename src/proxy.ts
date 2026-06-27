/**
 * Proxy — Yönlendirme Katmanı (Next.js 16 convention)
 *
 * Next.js 16'da middleware.ts yerine proxy.ts kullanılır.
 * Her HTTP isteğinde şu işlemleri yapar:
 *   1. Supabase session'ını tazeler (cookie güncel kalır)
 *   2. Kimliği doğrulanmamış kullanıcıları /giris'e yönlendirir
 *   3. Oturum açmış kullanıcıları auth sayfalarından dashboard'a yönlendirir
 *
 * Rol kontrolü (admin vs. kullanıcı) layout.tsx seviyesinde yapılır,
 * burada sadece kimlik doğrulama kontrol edilir.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ─── Route Grupları ───────────────────────────────────────────────────────────

/** Kimlik doğrulama gerektirmeyen rotalar */
const ACIK_ROTALAR = ['/', '/giris', '/kayit', '/sifremi-unuttum', '/auth/callback']

/** Oturum açmış kullanıcının görmemesi gereken auth rotaları */
const AUTH_ROTALARI = ['/giris', '/kayit', '/sifremi-unuttum']

// ─── Proxy Fonksiyonu ─────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  const acikRota = ACIK_ROTALAR.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const authRotasi = AUTH_ROTALARI.some((r) => pathname.startsWith(r))

  // Oturum açmışsa auth sayfalarına gitmesin → dashboard'a yönlendir
  if (user && authRotasi) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Oturum açmamışsa korumalı sayfalara gitmesin → login'e yönlendir
  if (!user && !acikRota) {
    const loginUrl = new URL('/giris', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

// Statik dosyaları ve resimleri proxy'den dışla
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
