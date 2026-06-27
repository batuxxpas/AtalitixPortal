'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Kart, KartBasligi, KartIcerigi, Buton } from '@/components/arayuz'

interface AtalitixYorumuPaneliProps {
  degerlendirmeId: string
  mevcutYorum: string | null
  isAuthorizedToComment: boolean
}

export function AtalitixYorumuPaneli({ degerlendirmeId, mevcutYorum, isAuthorizedToComment }: AtalitixYorumuPaneliProps) {
  const [duzenlemeModu, setDuzenlemeModu] = useState(false)
  const [yorum, setYorum] = useState(mevcutYorum || '')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const router = useRouter()

  // Sadece yetkili değilse ve yorum boşsa, bileşeni hiç render etme.
  if (!isAuthorizedToComment && !mevcutYorum) {
    return null
  }

  async function handleKaydet() {
    setYukleniyor(true)
    setHata(null)

    try {
      const res = await fetch('/api/admin/degerlendirme-yorumu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ degerlendirmeId, yorum })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Kaydetme sırasında bir hata oluştu.')
      }

      setDuzenlemeModu(false)
      router.refresh()
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Kart className="mt-6 border-blue-100 bg-blue-50/30">
      <KartBasligi 
        baslik="Atalitix Yorumu"
        aciklama="Uzmanlarımızın bu değerlendirme sonucu hakkındaki görüşleri."
      />
      
      <KartIcerigi>
        {hata && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {hata}
          </div>
        )}

        {isAuthorizedToComment && duzenlemeModu ? (
          <div className="space-y-4 animate-fade-in">
            <textarea
              className="w-full h-32 p-4 rounded-xl border border-blue-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
              placeholder="Değerlendirme sonucuna ilişkin Atalitix yorumunuzu buraya giriniz..."
              value={yorum}
              onChange={(e) => setYorum(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Buton 
                varyant="ghost" 
                onClick={() => {
                  setYorum(mevcutYorum || '')
                  setDuzenlemeModu(false)
                  setHata(null)
                }}
                disabled={yukleniyor}
              >
                İptal
              </Buton>
              <Buton 
                varyant="primary" 
                onClick={handleKaydet}
                yukleniyorMu={yukleniyor}
              >
                Kaydet
              </Buton>
            </div>
          </div>
        ) : (
          <div className="relative group">
            {yorum ? (
              <div className="p-4 rounded-xl bg-white border border-blue-100 text-slate-700 leading-relaxed whitespace-pre-wrap shadow-sm">
                {yorum}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                Henüz uzman yorumu eklenmemiş.
              </div>
            )}
            
            {isAuthorizedToComment && (
              <div className={`absolute top-2 right-2 transition-opacity ${yorum ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <Buton 
                  varyant={yorum ? "secondary" : "primary"} 
                  boyut="sm" 
                  className="shadow-sm"
                  onClick={() => setDuzenlemeModu(true)}
                >
                  {yorum ? 'Düzenle' : 'Ekle'}
                </Buton>
              </div>
            )}
          </div>
        )}
      </KartIcerigi>
    </Kart>
  )
}
