/**
 * Supabase Tarayıcı İstemcisi
 *
 * Sadece Client Component'lerde ('use client') kullanılır.
 * Her çağrıda aynı instance döner (singleton değil, hafif wrapper).
 *
 * Kullanım:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
