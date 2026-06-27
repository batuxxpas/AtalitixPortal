'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Buton, Girdi } from '@/components/arayuz'
import { useRouter } from 'next/navigation'

export function SirketlerClient({ baslangicSirketleri }: { baslangicSirketleri: any[] }) {
  const [sirketler, setSirketler] = useState(baslangicSirketleri)
  
  const [modalAcik, setModalAcik] = useState(false)
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false)
  const [silModalAcik, setSilModalAcik] = useState(false)
  const [seciliSirket, setSeciliSirket] = useState<any>(null)
  
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  function modalAc(tip: 'ekle' | 'duzenle' | 'sil', sirket?: any) {
    setHata(null)
    setSeciliSirket(sirket || null)
    if (tip === 'ekle') setModalAcik(true)
    if (tip === 'duzenle') setDuzenleModalAcik(true)
    if (tip === 'sil') setSilModalAcik(true)
  }

  function modalKapat() {
    setModalAcik(false)
    setDuzenleModalAcik(false)
    setSilModalAcik(false)
    setSeciliSirket(null)
  }

  async function handleSirketEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      ad: formData.get('ad'),
      sektor: formData.get('sektor'),
      vkn: formData.get('vkn'),
      yetkili_isim: formData.get('yetkili_isim'),
      yetkili_email: formData.get('yetkili_email'),
    }

    try {
      const res = await fetch('/api/admin/sirket-ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (!res.ok) throw new Error(responseData.error || 'Bir hata oluştu')

      modalKapat()
      router.refresh()
      setSirketler([{...responseData.sirket, degerlendirmeler: [{count: 0}]}, ...sirketler])
      
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  async function handleSirketGuncelle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!seciliSirket) return

    setYukleniyor(true)
    setHata(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      id: seciliSirket.id,
      ad: formData.get('ad'),
      sektor: formData.get('sektor'),
      vkn: formData.get('vkn'),
      yetkili_isim: formData.get('yetkili_isim'),
      yetkili_email: formData.get('yetkili_email'),
    }

    try {
      const res = await fetch('/api/admin/sirket-guncelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || 'Bir hata oluştu')

      modalKapat()
      router.refresh()
      setSirketler(sirketler.map(s => s.id === seciliSirket.id ? { ...s, ...responseData.sirket } : s))
      
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  async function handleSirketSil() {
    if (!seciliSirket) return

    setYukleniyor(true)
    setHata(null)

    try {
      const res = await fetch(`/api/admin/sirket-sil?id=${seciliSirket.id}`, {
        method: 'DELETE',
      })

      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || 'Bir hata oluştu')

      modalKapat()
      router.refresh()
      setSirketler(sirketler.filter(s => s.id !== seciliSirket.id))
      
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Buton onClick={() => modalAc('ekle')}>+ Yeni Şirket Ekle</Buton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Şirket Adı</th>
              <th className="px-4 py-3 font-semibold">Sektör</th>
              <th className="px-4 py-3 font-semibold">VKN</th>
              <th className="px-4 py-3 font-semibold">Yetkili İsim</th>
              <th className="px-4 py-3 font-semibold">Yetkili E-posta</th>
              <th className="px-4 py-3 font-semibold text-center">Değerlendirmeler</th>
              <th className="px-4 py-3 font-semibold text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sirketler.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Henüz hiç şirket eklenmemiş.
                </td>
              </tr>
            ) : (
              sirketler.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.ad}</td>
                  <td className="px-4 py-3 text-slate-600">{s.sektor || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.vkn || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.yetkili_isim || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.yetkili_email || '-'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {s.degerlendirmeler?.[0]?.count || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Buton varyant="outline" boyut="sm" onClick={() => modalAc('duzenle', s)}>Düzenle</Buton>
                      <Buton varyant="secondary" boyut="sm" onClick={() => modalAc('sil', s)} className="text-red-600 hover:text-red-700 hover:bg-red-50">Sil</Buton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Şirket Ekle Modal */}
      {modalAcik && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Yeni Müşteri Şirket Ekle</h2>
            
            {hata && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {hata}
              </div>
            )}

            <form onSubmit={handleSirketEkle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Şirket Adı</label>
                <Girdi name="ad" required placeholder="Örn: X Lojistik A.Ş." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sektör</label>
                  <Girdi name="sektor" placeholder="Lojistik" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">VKN</label>
                  <Girdi name="vkn" placeholder="1234567890" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yetkili İsim Soyisim</label>
                <Girdi name="yetkili_isim" required placeholder="Ahmet Yılmaz" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yetkili E-posta</label>
                <Girdi name="yetkili_email" type="email" required placeholder="ahmet@xlojistik.com" />
              </div>

              <div className="flex gap-3 pt-4">
                <Buton type="button" varyant="secondary" onClick={modalKapat} className="flex-1">
                  İptal
                </Buton>
                <Buton type="submit" varyant="primary" yukleniyorMu={yukleniyor} className="flex-1">
                  Oluştur
                </Buton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Şirket Düzenle Modal */}
      {duzenleModalAcik && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Şirket Düzenle</h2>
            
            {hata && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {hata}
              </div>
            )}

            <form onSubmit={handleSirketGuncelle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Şirket Adı</label>
                <Girdi name="ad" required defaultValue={seciliSirket?.ad} placeholder="Örn: X Lojistik A.Ş." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sektör</label>
                  <Girdi name="sektor" defaultValue={seciliSirket?.sektor} placeholder="Lojistik" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">VKN</label>
                  <Girdi name="vkn" defaultValue={seciliSirket?.vkn} placeholder="1234567890" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yetkili İsim Soyisim</label>
                <Girdi name="yetkili_isim" required defaultValue={seciliSirket?.yetkili_isim} placeholder="Ahmet Yılmaz" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yetkili E-posta</label>
                <Girdi name="yetkili_email" type="email" required defaultValue={seciliSirket?.yetkili_email} placeholder="ahmet@xlojistik.com" />
              </div>

              <div className="flex gap-3 pt-4">
                <Buton type="button" varyant="secondary" onClick={modalKapat} className="flex-1">
                  İptal
                </Buton>
                <Buton type="submit" varyant="primary" yukleniyorMu={yukleniyor} className="flex-1">
                  Güncelle
                </Buton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Şirket Sil Modal */}
      {silModalAcik && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Şirketi Sil</h2>
            <p className="text-slate-500 mb-6 text-sm">
              <strong className="text-slate-900">{seciliSirket?.ad}</strong> adlı şirketi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            {hata && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {hata}
              </div>
            )}

            <div className="flex gap-3">
              <Buton type="button" varyant="secondary" onClick={modalKapat} className="flex-1">
                İptal
              </Buton>
              <Buton type="button" onClick={handleSirketSil} yukleniyorMu={yukleniyor} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Evet, Sil
              </Buton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
