/**
 * Supabase Server İstemcisi
 *
 * Sadece Server Component ve API Route'larında kullanılır.
 * Cookie yönetimi Next.js'in `cookies()` API'si üzerinden yapılır.
 *
 * Kullanım:
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Tüm cookie'leri al
        getAll() {
          return cookieStore.getAll()
        },
        // Cookie'leri güncelle (Server Component'ten çağrıldığında hata fırlatabilir — görmezden gelinir)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component'ten çağrıldığında set işlemi mümkün değildir.
            // Middleware session'ı zaten tazeler, bu hata güvenle yoksayılabilir.
          }
        },
      },
    }
  )
}
