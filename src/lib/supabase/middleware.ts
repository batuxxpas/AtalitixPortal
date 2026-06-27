/**
 * Supabase Middleware Yardımcısı
 *
 * Her istekte Supabase Auth session'ını tazeler ve cookie'leri güncel tutar.
 * Next.js middleware'inden çağrılır (`src/proxy.ts` aracılığıyla).
 *
 * Döndürdüğü değerler:
 *   - supabaseResponse : Cookie'ler güncellenmiş NextResponse nesnesi
 *   - user            : Oturum açmış kullanıcı (yoksa null)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1) İstek cookie'lerini güncelle
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // 2) Yanıt cookie'lerini güncelle (tarayıcıya gönderilecek)
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Kullanıcı oturumunu doğrula (getSession() yerine getUser() güvenlidir)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
