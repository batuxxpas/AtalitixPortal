'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import type { Profil } from '@/types'

interface HeaderProps {
  profile: Profil | null
}

export function PortalUstBilgi({ profile }: HeaderProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/giris')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu button - placeholder for mobile sidebar */}
        <button className="md:hidden p-2 text-slate-500 hover:text-[#0a1945] rounded-lg hover:bg-slate-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* User menu */}
        <div className="flex items-center gap-2">

          <span className="hidden sm:block text-sm font-medium text-slate-700">
            {((profile as any)?.tam_ad) || 'Kullanıcı'}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="p-2 text-slate-500 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
          title="Çıkış yap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
