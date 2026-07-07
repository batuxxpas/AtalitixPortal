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
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      {siliniyor ? 'Siliniyor...' : 'Sil'}
    </Buton>
  )
}
