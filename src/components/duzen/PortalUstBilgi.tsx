'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { navOgeleri, soruYonetimiOgesi, yoneticiOgeleri } from './PortalYanMenu'
import { cn } from '@/lib/utils'
import type { Profil } from '@/types'

interface HeaderProps {
  profile: Profil | null
}

export function PortalUstBilgi({ profile }: HeaderProps) {
  const router = useRouter()
  const aktifSayfa = usePathname()
  const supabase = createBrowserClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/giris')
    router.refresh()
  }

  return (
    <>
      <header className="h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-[#0a1945] rounded-lg hover:bg-slate-100"
        >
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

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)} 
          />
          
          {/* Drawer */}
          <div className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <img src="/Atalitixlogo.jpeg" alt="Atalitix Logo" className="h-8 object-contain" />
                <span className="font-bold text-slate-400 tracking-widest text-xs ml-1">PORTAL</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="p-1 -mr-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {[
                ...navOgeleri, 
                ...((profile?.rol as string) === 'superadmin' || (profile as any)?.yetkiler?.soru_yonetimi ? [soruYonetimiOgesi] : []),
                ...((profile?.rol as string) === 'superadmin' ? yoneticiOgeleri : [])
              ].map((item) => {
                const aktif = aktifSayfa === item.href || aktifSayfa.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      aktif
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-slate-600 hover:text-[#0a1945] hover:bg-slate-50'
                    )}
                  >
                    <span className={cn(aktif ? 'text-blue-600' : 'text-slate-400')}>
                      {item.ikon}
                    </span>
                    {item.etiket}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
