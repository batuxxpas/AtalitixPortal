'use client'

import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface YukleniyorProps {
  boyut?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const boyutlar = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}

export function Yukleniyor({ boyut = 'md', className }: YukleniyorProps) {
  return (
    <svg
      className={cn('animate-spin text-blue-500', boyutlar[boyut], className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function SayfaYukleniyor() {
  const pathname = usePathname() || ''
  
  let modulAdi = 'Sistem'
  if (pathname.includes('/sirketler')) modulAdi = 'Şirketler'
  else if (pathname.includes('/sorular')) modulAdi = 'Soru Paneli'
  else if (pathname.includes('/kullanicilar')) modulAdi = 'Kullanıcılar'
  else if (pathname.includes('/degerlendirme')) modulAdi = 'Değerlendirmeler'
  else if (pathname.includes('/sonuclar')) modulAdi = 'Sonuç Raporu'
  else if (pathname.includes('/dashboard')) modulAdi = 'Ana Ekran'
  else if (pathname.includes('/rehber')) modulAdi = 'Rehber'

  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center gap-8">
      <div className="relative flex items-center justify-center w-36 h-36">
        {/* Dış dönen halkalar */}
        <div className="absolute inset-0 rounded-full border-t-[3px] border-r-[3px] border-blue-600 animate-spin opacity-70"></div>
        <div className="absolute inset-3 rounded-full border-b-[3px] border-l-[3px] border-blue-300 animate-[spin_1.5s_reverse_linear_infinite] opacity-50"></div>
        
        {/* Logo Alanı */}
        <div className="relative w-28 h-28 bg-white rounded-full shadow-sm border border-slate-50 flex items-center justify-center p-4 animate-pulse">
          <img src="/Atalitixlogo.jpeg" alt="Atalitix" className="w-full h-full object-contain" />
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <p className="text-base font-medium text-slate-500 tracking-wide animate-pulse">{modulAdi} Yükleniyor...</p>
      </div>
    </div>
  )
}
