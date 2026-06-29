'use client'

/**
 * PortalSidebar
 *
 * Sol navigasyon çubuğu. Sadece mevcut sayfalara link içerir.
 * Yeni sayfa eklendikçe `navOgeleri` dizisine ekleme yapılır.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ProfilResmi } from '@/components/arayuz'
import type { Profil } from '@/types'

// ─── Tip ──────────────────────────────────────────────────────────────────────

interface SidebarProps {
  /** Oturum açmış kullanıcının profil bilgisi (şirket adı dahil) */
  profile: (Profil & { company?: { name: string } | null }) | null
}

// ─── Navigasyon Öğeleri ───────────────────────────────────────────────────────

export const navOgeleri = [
  {
    etiket: 'Ana Ekran',
    href: '/dashboard',
    ikon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    etiket: 'Şirketler',
    href: '/sirketler',
    ikon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    etiket: 'Değerlendirmeler',
    href: '/degerlendirme',
    ikon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
]

export const soruYonetimiOgesi = {
  etiket: 'Soru Paneli',
  href: '/sorular',
  ikon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export const yoneticiOgeleri = [
  {
    etiket: 'Kullanıcılar',
    href: '/kullanicilar',
    ikon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  }
]

// ─── Bileşen ──────────────────────────────────────────────────────────────────

export function PortalYanMenu({ profile }: SidebarProps) {
  const aktifSayfa = usePathname()

  // Type definitions for db object
  const companyName = (profile?.company as any)?.ad
  const userName = (profile as any)?.tam_ad || profile?.email || 'Kullanıcı'

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200 min-h-screen">

      {/* Logo + Portal Yazısı */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200">
        <img src="/Atalitixlogo.jpeg" alt="Atalitix Logo" className="h-8 object-contain" />
        <span className="font-bold text-slate-400 tracking-widest text-xs ml-1">PORTAL</span>
      </div>

      {/* Navigasyon linkleri */}
      <nav className="flex-1 px-3 py-4 space-y-1">
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

      {/* User profile block removed from here to reduce clutter. It's available in the top right header. */}
    </aside>
  )
}
