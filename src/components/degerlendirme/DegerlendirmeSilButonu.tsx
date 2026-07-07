'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Buton } from '@/components/arayuz'

export function DegerlendirmeSilButonu({ id }: { id: string }) {
  const [siliniyor, setSiliniyor] = useState(false)
  const router = useRouter()

  const handleSil = async () => {
    if (!window.confirm('Bu değerlendirmeyi tamamen silmek istediğinize emin misiniz? (Tüm cevaplar da silinecektir)')) return

    setSiliniyor(true)
    try {
      const res = await fetch(`/api/admin/degerlendirme-sil?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Silinirken bir hata oluştu')
      
      alert('Değerlendirme başarıyla silindi.')
      router.refresh()
    } catch (error: any) {
      alert(error.message)
      setSiliniyor(false)
    }
  }

  return (
    <Buton 
      varyant="ghost" 
      boyut="xs" 
      onClick={handleSil} 
      disabled={siliniyor}
      className="text-red-400 hover:text-red-600 hover:bg-red-50/50 px-2 flex items-center justify-center shrink-0"
      title="Değerlendirmeyi Sil"
    >
      {siliniyor ? (
        <svg className="w-4 h-4 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </Buton>
  )
}
