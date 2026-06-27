'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Buton, Girdi } from '@/components/arayuz'
import { useRouter } from 'next/navigation'

const CheckIcon = () => (
  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-sm border border-emerald-200">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
  </div>
)

const CrossIcon = () => (
  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto shadow-sm border border-slate-200">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
  </div>
)

export function KullanicilarClient({ baslangicKullanicilari }: { baslangicKullanicilari: any[] }) {
  const [kullanicilar, setKullanicilar] = useState(baslangicKullanicilari)
  
  const [modalAcik, setModalAcik] = useState(false)
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false)
  const [silModalAcik, setSilModalAcik] = useState(false)
  const [seciliKullanici, setSeciliKullanici] = useState<any>(null)
  const [secilenRol, setSecilenRol] = useState('user')
  
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  function modalAc(tip: 'ekle' | 'duzenle' | 'sil', kullanici?: any) {
    setHata(null)
    setSeciliKullanici(kullanici || null)
    setSecilenRol(kullanici?.rol || 'user')
    if (tip === 'ekle') setModalAcik(true)
    if (tip === 'duzenle') setDuzenleModalAcik(true)
    if (tip === 'sil') setSilModalAcik(true)
  }

  function modalKapat() {
    setModalAcik(false)
    setDuzenleModalAcik(false)
    setSilModalAcik(false)
    setSeciliKullanici(null)
  }

  async function handleKullaniciEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata(null)

    const formData = new FormData(e.currentTarget)
    const rol = formData.get('rol') || 'user'
    const yetkiler = {
      degerlendirme_yonetimi: rol === 'superadmin' || formData.get('degerlendirme_yonetimi') === 'on',
      sirket_yonetimi: rol === 'superadmin' || formData.get('sirket_yonetimi') === 'on',
      soru_yonetimi: rol === 'superadmin' || formData.get('soru_yonetimi') === 'on',
      yorum_yonetimi: rol === 'superadmin' || formData.get('yorum_yonetimi') === 'on',
    }

    const data = {
      tam_ad: formData.get('tam_ad'),
      email: formData.get('email'),
      sifre: formData.get('sifre'),
      rol,
      yetkiler
    }

    try {
      const res = await fetch('/api/admin/kullanici-ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (!res.ok) throw new Error(responseData.error || 'Bir hata oluştu')

      modalKapat()
      router.refresh()
      setKullanicilar([responseData.profil, ...kullanicilar])
      
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  async function handleKullaniciGuncelle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!seciliKullanici) return

    setYukleniyor(true)
    setHata(null)

    const formData = new FormData(e.currentTarget)
    const rol = formData.get('rol') || 'user'
    const yetkiler = {
      degerlendirme_yonetimi: rol === 'superadmin' || formData.get('degerlendirme_yonetimi') === 'on',
      sirket_yonetimi: rol === 'superadmin' || formData.get('sirket_yonetimi') === 'on',
      soru_yonetimi: rol === 'superadmin' || formData.get('soru_yonetimi') === 'on',
      yorum_yonetimi: rol === 'superadmin' || formData.get('yorum_yonetimi') === 'on',
    }

    const data = {
      id: seciliKullanici.id,
      tam_ad: formData.get('tam_ad'),
      rol,
      yetkiler
    }

    try {
      const res = await fetch('/api/admin/kullanici-guncelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || 'Bir hata oluştu')

      modalKapat()
      router.refresh()
      setKullanicilar(kullanicilar.map(k => k.id === seciliKullanici.id ? { ...k, ...responseData.profil } : k))
      
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  async function handleKullaniciSil() {
    if (!seciliKullanici) return

    setYukleniyor(true)
    setHata(null)

    try {
      const res = await fetch(`/api/admin/kullanici-sil?id=${seciliKullanici.id}`, {
        method: 'DELETE',
      })

      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || 'Bir hata oluştu')

      modalKapat()
      router.refresh()
      setKullanicilar(kullanicilar.filter(k => k.id !== seciliKullanici.id))
      
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Buton onClick={() => modalAc('ekle')}>+ Yeni Kullanıcı Ekle</Buton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">İsim Soyisim</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold">Şirket Yönetimi</th>
              <th className="px-4 py-3 font-semibold">Değerlendirme Yönetimi</th>
              <th className="px-4 py-3 font-semibold">Soru Yönetimi</th>
              <th className="px-4 py-3 font-semibold">Yorum Yönetimi</th>
              <th className="px-4 py-3 font-semibold text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {kullanicilar.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Henüz hiç kullanıcı eklenmemiş.
                </td>
              </tr>
            ) : (
              kullanicilar.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{k.tam_ad}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${k.rol === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                      {k.rol === 'superadmin' ? 'Süper Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    {(k.rol === 'superadmin' || k.yetkiler?.sirket_yonetimi) ? <CheckIcon /> : <CrossIcon />}
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    {(k.rol === 'superadmin' || k.yetkiler?.degerlendirme_yonetimi) ? <CheckIcon /> : <CrossIcon />}
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    {(k.rol === 'superadmin' || k.yetkiler?.soru_yonetimi) ? <CheckIcon /> : <CrossIcon />}
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    {(k.rol === 'superadmin' || k.yetkiler?.yorum_yonetimi) ? <CheckIcon /> : <CrossIcon />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Buton varyant="outline" boyut="sm" onClick={() => modalAc('duzenle', k)}>Düzenle</Buton>
                      <Buton varyant="secondary" boyut="sm" onClick={() => modalAc('sil', k)} disabled={k.rol === 'superadmin'} className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50">Sil</Buton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Kullanıcı Ekle Modal */}
      {modalAcik && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Yeni Kullanıcı Ekle</h2>
            
            {hata && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {hata}
              </div>
            )}

            <form onSubmit={handleKullaniciEkle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İsim Soyisim</label>
                <Girdi name="tam_ad" required placeholder="Örn: Ahmet Yılmaz" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                <Girdi name="email" type="email" required placeholder="ahmet@atalitix.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                <Girdi name="sifre" required placeholder="En az 6 karakter" type="password" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select 
                  name="rol" 
                  value={secilenRol}
                  onChange={(e) => setSecilenRol(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
                >
                  <option value="user">Standart Çalışan</option>
                  <option value="superadmin">Süper Admin (Tüm Yetkiler)</option>
                </select>
              </div>

              {secilenRol === 'user' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">Yetkiler</h3>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="sirket_yonetimi" className="rounded text-blue-600 border-slate-300" />
                    <span className="text-sm text-slate-700">Müşteri Şirketleri Yönetebilir (Ekle/Düzenle/Sil)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="degerlendirme_yonetimi" className="rounded text-blue-600 border-slate-300" />
                    <span className="text-sm text-slate-700">Değerlendirme Başlatabilir</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="soru_yonetimi" className="rounded text-blue-600 border-slate-300" />
                    <span className="text-sm text-slate-700">Soru ve Algoritma Yönetebilir</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="yorum_yonetimi" className="rounded text-blue-600 border-slate-300" />
                    <span className="text-sm text-slate-700">Rapor Yorumu Ekleyebilir/Düzenleyebilir</span>
                  </label>
                </div>
              )}

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

      {/* Kullanıcı Düzenle Modal */}
      {duzenleModalAcik && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kullanıcı Düzenle</h2>
            
            {hata && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {hata}
              </div>
            )}

            <form onSubmit={handleKullaniciGuncelle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İsim Soyisim</label>
                <Girdi name="tam_ad" required defaultValue={seciliKullanici?.tam_ad} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select 
                  name="rol" 
                  value={secilenRol}
                  onChange={(e) => setSecilenRol(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
                >
                  <option value="user">Standart Çalışan</option>
                  <option value="superadmin">Süper Admin (Tüm Yetkiler)</option>
                </select>
              </div>

              {secilenRol === 'user' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">Yetkiler</h3>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="sirket_yonetimi" defaultChecked={seciliKullanici?.yetkiler?.sirket_yonetimi} className="rounded text-blue-600 border-slate-300" />
                    <span className="text-sm text-slate-700">Müşteri Şirketleri Yönetebilir (Ekle/Düzenle/Sil)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="degerlendirme_yonetimi" 
                      defaultChecked={seciliKullanici?.yetkiler?.degerlendirme_yonetimi}
                      className="rounded text-blue-600 border-slate-300" 
                    />
                    <span className="text-sm text-slate-700">Değerlendirme Başlatabilir</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="soru_yonetimi" 
                      defaultChecked={seciliKullanici?.yetkiler?.soru_yonetimi}
                      className="rounded text-blue-600 border-slate-300" 
                    />
                    <span className="text-sm text-slate-700">Soru ve Algoritma Yönetebilir</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="yorum_yonetimi" 
                      defaultChecked={seciliKullanici?.yetkiler?.yorum_yonetimi}
                      className="rounded text-blue-600 border-slate-300" 
                    />
                    <span className="text-sm text-slate-700">Rapor Yorumu Ekleyebilir/Düzenleyebilir</span>
                  </label>
                </div>
              )}

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

      {/* Kullanıcı Sil Modal */}
      {silModalAcik && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Kullanıcıyı Sil</h2>
            <p className="text-slate-500 mb-6 text-sm">
              <strong className="text-slate-900">{seciliKullanici?.tam_ad}</strong> kullanıcısını silmek istediğinize emin misiniz? Sisteme erişimi engellenecektir.
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
              <Buton type="button" onClick={handleKullaniciSil} yukleniyorMu={yukleniyor} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
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
