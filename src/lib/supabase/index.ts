/**
 * Supabase İstemci Dışa Aktarımları
 *
 * Bu dosya Client Component'lerde kullanılacak tarayıcı istemcisini dışa aktarır.
 *
 * ⚠️  Server Component veya API Route'larda doğrudan şu import'u kullanın:
 *       import { createClient } from '@/lib/supabase/server'
 *
 * ⚠️  Middleware için:
 *       import { updateSession } from '@/lib/supabase/middleware'
 */

// Client Component'lerde kullanım:
//   import { createBrowserClient } from '@/lib/supabase'
//   const supabase = createBrowserClient()
export { createClient as createBrowserClient } from './client'
