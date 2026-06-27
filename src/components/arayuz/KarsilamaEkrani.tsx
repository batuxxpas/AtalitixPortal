'use client'

import { useState, useEffect } from 'react'

export function KarsilamaEkrani({ children }: { children: React.ReactNode }) {
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    // Sadece ilk açılışta veya F5 atıldığında 1.5 saniye ekranda kalacak
    const timer = setTimeout(() => {
      setYukleniyor(false)
    }, 1200)
    
    return () => clearTimeout(timer)
  }, [])

  if (yukleniyor) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f8f9fc] animate-fade-in">
        {/* Atalitix Logosu */}
        <div className="relative w-72 h-24 mb-10 animate-pulse">
          <img src="/Atalitixlogo.jpeg" alt="Atalitix" className="object-contain w-full h-full" />
        </div>
        
        {/* Zarif ve modern yükleme noktaları */}
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 bg-[#0a1945] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 bg-[#2d3a8c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    )
  }

  // Animasyon bitince asıl içeriği hafif bir saydamlık (fade-in) efektiyle ekrana basıyoruz
  return <div className="animate-fade-in h-full w-full">{children}</div>
}
