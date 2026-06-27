'use client'

import { useState } from 'react'
import { Buton, Kart, KartBasligi, KartIcerigi, Rozet, Girdi } from '@/components/arayuz'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

type TabType = 'sorular' | 'secenekler' | 'kurallar'

export function SorularClient({ 
  baslangicKategorileri, 
  baslangicSorulari, 
  baslangicSecenekleri, 
  baslangicKurallari 
}: { 
  baslangicKategorileri: any[], 
  baslangicSorulari: any[], 
  baslangicSecenekleri: any[], 
  baslangicKurallari: any[] 
}) {
  const router = useRouter()
  const [aktifTab, setAktifTab] = useState<TabType>('sorular')
  const [aramaMetni, setAramaMetni] = useState('')
  const [sorular, setSorular] = useState(baslangicSorulari)
  const [secenekler, setSecenekler] = useState(baslangicSecenekleri)
  const [kurallar, setKurallar] = useState(baslangicKurallari)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  // Modallar
  const [soruModalAcik, setSoruModalAcik] = useState(false)
  const [seciliSoru, setSeciliSoru] = useState<any>(null)

  const [secenekModalAcik, setSecenekModalAcik] = useState(false)
  const [seciliSecenek, setSeciliSecenek] = useState<any>(null)

  const [kuralModalAcik, setKuralModalAcik] = useState(false)
  const [seciliKural, setSeciliKural] = useState<any>(null)
  
  // UI Builder State for Rules
  const [kosullar, setKosullar] = useState<any[]>([])
  const [kuralMantigi, setKuralMantigi] = useState<'AND' | 'OR'>('AND')

  // --- SORU İŞLEMLERİ ---
  function soruModalAc(soru?: any) {
    setHata(null)
    setSeciliSoru(soru || null)
    setSoruModalAcik(true)
  }

  async function handleSoruKaydet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata(null)
    const formData = new FormData(e.currentTarget)
    
    const data = {
      id: seciliSoru?.id,
      metin: formData.get('metin'),
      aciklama: formData.get('aciklama'),
      kategori_id: formData.get('kategori_id'),
      kod: formData.get('kod') || null,
      tip: formData.get('tip'),
      agirlik: parseInt(formData.get('agirlik') as string) || 1,
      sira: parseInt(formData.get('sira') as string) || 99,
      zorunlu_mu: formData.get('zorunlu_mu') === 'on',
      aktif_mi: formData.get('aktif_mi') === 'on',
    }

    try {
      const res = await fetch('/api/admin/sorular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Hata oluştu')

      if (seciliSoru) {
        setSorular(sorular.map(s => s.id === seciliSoru.id ? resData.data : s))
      } else {
        setSorular([...sorular, resData.data])
      }
      setSoruModalAcik(false)
      router.refresh()
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  // --- SEÇENEK İŞLEMLERİ ---
  function secenekModalAc(secenek?: any) {
    setHata(null)
    setSeciliSecenek(secenek || null)
    setSecenekModalAcik(true)
  }

  async function handleSecenekKaydet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata(null)
    const formData = new FormData(e.currentTarget)
    
    const data = {
      id: seciliSecenek?.id,
      soru_id: formData.get('soru_id'),
      metin: formData.get('metin'),
      deger: parseInt(formData.get('deger') as string) || 0,
      sira: parseInt(formData.get('sira') as string) || 1,
    }

    try {
      const res = await fetch('/api/admin/secenekler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Hata oluştu')

      if (seciliSecenek) {
        setSecenekler(secenekler.map(s => s.id === seciliSecenek.id ? resData.data : s))
      } else {
        setSecenekler([...secenekler, resData.data])
      }
      setSecenekModalAcik(false)
      router.refresh()
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  // --- KURAL İŞLEMLERİ ---
  function kuralModalAc(kural?: any) {
    setHata(null)
    setSeciliKural(kural || null)
    
    // UI Builder State Doldur
    if (kural?.tetikleyici_kosullar) {
      setKuralMantigi(kural.tetikleyici_kosullar.mantik || 'AND')
      setKosullar(kural.tetikleyici_kosullar.kosullar || [])
    } else {
      setKuralMantigi('AND')
      setKosullar([])
    }
    
    setKuralModalAcik(true)
  }

  function kosulEkle() {
    setKosullar([...kosullar, { soru_kodu: '', operator: 'eq', deger: '' }])
  }

  function kosulGuncelle(index: number, alanlar: Record<string, any>) {
    const yeniKosullar = [...kosullar]
    yeniKosullar[index] = { ...yeniKosullar[index], ...alanlar }
    setKosullar(yeniKosullar)
  }

  function kosulSil(index: number) {
    setKosullar(kosullar.filter((_, i) => i !== index))
  }

  async function handleKuralKaydet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata(null)
    const formData = new FormData(e.currentTarget)
    
    const tetikleyici_kosullar = {
      mantik: kuralMantigi,
      kosullar: kosullar
    }

    const acilacak_sorular = (formData.get('acilacak_sorular') as string).split(',').map(s => s.trim()).filter(Boolean)
    const kapanacak_sorular = (formData.get('kapanacak_sorular') as string).split(',').map(s => s.trim()).filter(Boolean)

    const data = {
      id: seciliKural?.id,
      kural_kodu: seciliKural ? seciliKural.kural_kodu : `RULE_${Date.now()}`, // Kod otomatik oluşturulur, düzenlenemez
      tetikleyici_kosullar,
      acilacak_sorular,
      kapanacak_sorular,
      aktif_mi: formData.get('aktif_mi') === 'on',
    }

    try {
      const res = await fetch('/api/admin/kurallar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Hata oluştu')

      if (seciliKural) {
        setKurallar(kurallar.map(k => k.id === seciliKural.id ? resData.data : k))
      } else {
        setKurallar([resData.data, ...kurallar])
      }
      setKuralModalAcik(false)
      router.refresh()
    } catch (err: any) {
      setHata(err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  // Türkçe karaktere duyarlı küçük harfe çevirme fonksiyonu
  function trLower(text: string) {
    if (!text) return ''
    return text.toLocaleLowerCase('tr-TR')
  }

  // Arama metnini Türkçe karakter duyarlı şekilde metin içinde arayıp vurgulayan (highlight) bileşen
  function VurguluMetin({ metin, arama }: { metin: string, arama: string }) {
    if (!arama || !metin) return <>{metin}</>
    
    const textLower = trLower(metin)
    const searchLower = trLower(arama)
    
    if (!textLower.includes(searchLower)) return <>{metin}</>

    const parts = []
    let currentIdx = 0
    
    while(true) {
      const idx = textLower.indexOf(searchLower, currentIdx)
      if (idx === -1) {
        parts.push({ text: metin.substring(currentIdx), isMatch: false })
        break
      }
      parts.push({ text: metin.substring(currentIdx, idx), isMatch: false })
      parts.push({ text: metin.substring(idx, idx + searchLower.length), isMatch: true })
      currentIdx = idx + searchLower.length
    }
    
    return (
      <>
        {parts.map((p, i) => p.isMatch ? (
          <mark key={i} className="bg-blue-100 text-blue-800 rounded px-1 font-semibold">{p.text}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        ))}
      </>
    )
  }

  // Kural koşullarını okunabilir metne çeviren yardımcı fonksiyon
  function kosulOzeti(kosullarGrubu: any) {
    if (!kosullarGrubu || !kosullarGrubu.kosullar || kosullarGrubu.kosullar.length === 0) return 'Koşulsuz (Her zaman çalışır)'
    const kosulMetinleri = kosullarGrubu.kosullar.map((k: any) => {
      if (k.kural_tipi === 'baslangic') return 'Başlangıç Kuralı (Her zaman çalışır)'
      if (!k.soru_kodu || k.deger === undefined || k.deger === 'undefined') return 'Eksik veya tanımlanmamış koşul'
      
      const soru = sorular.find(s => s.kod === k.soru_kodu)
      const soruMetni = soru ? soru.metin : 'Bilinmeyen Soru'
      
      // Cevabın metnini bulmaya çalış
      let cevapMetni = k.deger
      if (soru && k.operator === 'eq') {
        const secenek = secenekler.find(opt => opt.soru_id === soru.id && opt.deger?.toString() === k.deger?.toString())
        if (secenek) cevapMetni = secenek.metin
      }

      if (k.operator === 'eq') return `Eğer "${soruMetni}" cevabı "${cevapMetni}" ise`
      if (k.operator === 'contains') return `Eğer "${soruMetni}" cevabı "${cevapMetni}" içeriyorsa`
      if (k.operator === 'gt') return `Eğer "${soruMetni}" cevabı ${cevapMetni}'den büyükse`
      if (k.operator === 'lt') return `Eğer "${soruMetni}" cevabı ${cevapMetni}'den küçükse`
      
      return `Eğer "${soruMetni}" ${k.operator} "${cevapMetni}"`
    })
    return kosulMetinleri.join(kosullarGrubu.mantik === 'OR' ? ' VEYA ' : ' VE ')
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Soru ve Algoritma Yönetimi</h1>
          <p className="text-slate-500 mt-1">Sistemdeki soruları, seçenekleri ve kuralları yönetin.</p>
        </div>
        <div className="flex gap-2">
          {aktifTab === 'sorular' && <Buton onClick={() => soruModalAc()}>+ Yeni Soru Ekle</Buton>}
          {aktifTab === 'secenekler' && <Buton onClick={() => secenekModalAc()}>+ Yeni Seçenek Ekle</Buton>}
          {aktifTab === 'kurallar' && <Buton onClick={() => kuralModalAc()}>+ Yeni Kural Ekle</Buton>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => { setAktifTab('sorular'); setAramaMetni(''); }}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${aktifTab === 'sorular' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Sorular ({sorular.length})
        </button>
        <button 
          onClick={() => { setAktifTab('secenekler'); setAramaMetni(''); }}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${aktifTab === 'secenekler' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Seçenekler ({secenekler.length})
        </button>
        <button 
          onClick={() => { setAktifTab('kurallar'); setAramaMetni(''); }}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${aktifTab === 'kurallar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Algoritma Kuralları ({kurallar.length})
        </button>
      </div>

      {/* Arama Çubuğu */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          placeholder={
            aktifTab === 'sorular' ? "Soru metni, kod veya kategori ara..." :
            aktifTab === 'secenekler' ? "Seçenek metni veya soru ara..." :
            "Kural koşulu veya açılan/kapanan soru ara..."
          }
          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Tab İçerikleri */}
      <Kart>
        <KartIcerigi className="p-0">
          
          {/* SORULAR TABI */}
          {aktifTab === 'sorular' && (
            <table className="portal-table w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Sıra</th>
                  <th className="px-4 py-3">Soru Metni</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sorular
                  .filter(s => {
                    const metinLower = trLower(aramaMetni)
                    const kategoriAdi = trLower(baslangicKategorileri.find(k => k.id === s.kategori_id)?.ad || '')
                    return (
                      trLower(s.metin).includes(metinLower) || 
                      (s.kod && trLower(s.kod).includes(metinLower)) ||
                      kategoriAdi.includes(metinLower)
                    )
                  })
                  .sort((a,b) => a.sira - b.sira)
                  .map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{s.sira}</td>
                    <td className="px-4 py-3 font-medium text-slate-800" title={s.metin}>
                      <VurguluMetin metin={s.metin} arama={aramaMetni} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <VurguluMetin metin={baslangicKategorileri.find(k => k.id === s.kategori_id)?.ad || ''} arama={aramaMetni} />
                    </td>
                    <td className="px-4 py-3">
                      <Rozet varyant={s.aktif_mi ? 'success' : 'default'}>{s.aktif_mi ? 'Aktif' : 'Pasif'}</Rozet>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Buton varyant="ghost" boyut="sm" onClick={() => soruModalAc(s)}>Düzenle</Buton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* SEÇENEKLER TABI */}
          {aktifTab === 'secenekler' && (
            <table className="portal-table w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Bağlı Olduğu Soru</th>
                  <th className="px-4 py-3">Seçenek Metni</th>
                  <th className="px-4 py-3">Puan (Değer)</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {secenekler
                  .filter(opt => {
                    const metinLower = trLower(aramaMetni)
                    const bagliSoru = trLower(sorular.find(s => s.id === opt.soru_id)?.metin || '')
                    return (
                      trLower(opt.metin).includes(metinLower) ||
                      bagliSoru.includes(metinLower)
                    )
                  })
                  .sort((a,b) => a.sira - b.sira)
                  .map((opt) => (
                  <tr key={opt.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500" title={sorular.find(s => s.id === opt.soru_id)?.metin}>
                      <VurguluMetin metin={sorular.find(s => s.id === opt.soru_id)?.metin || 'Bilinmiyor'} arama={aramaMetni} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <VurguluMetin metin={opt.metin} arama={aramaMetni} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <Rozet varyant="info">{opt.deger}</Rozet>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Buton varyant="ghost" boyut="sm" onClick={() => secenekModalAc(opt)}>Düzenle</Buton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* KURALLAR TABI */}
          {aktifTab === 'kurallar' && (
            <table className="portal-table w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tetikleyici Koşul (Eğer...)</th>
                  <th className="px-4 py-3">Açılacak Sorular (...O Zaman)</th>
                  <th className="px-4 py-3">Kapanacak Sorular</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {kurallar
                  .filter(k => {
                    const metinLower = trLower(aramaMetni)
                    const kosulMetni = trLower(kosulOzeti(k.tetikleyici_kosullar))
                    const acilanSorular = trLower(k.acilacak_sorular?.join(', ') || '')
                    const kapananSorular = trLower(k.kapanacak_sorular?.join(', ') || '')
                    return (
                      kosulMetni.includes(metinLower) ||
                      acilanSorular.includes(metinLower) ||
                      kapananSorular.includes(metinLower)
                    )
                  }).length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Kural bulunamadı</td></tr>
                ) : kurallar
                  .filter(k => {
                    const metinLower = trLower(aramaMetni)
                    const kosulMetni = trLower(kosulOzeti(k.tetikleyici_kosullar))
                    const acilanSorular = trLower(k.acilacak_sorular?.join(', ') || '')
                    const kapananSorular = trLower(k.kapanacak_sorular?.join(', ') || '')
                    return (
                      kosulMetni.includes(metinLower) ||
                      acilanSorular.includes(metinLower) ||
                      kapananSorular.includes(metinLower)
                    )
                  })
                  .map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700" title={kosulOzeti(k.tetikleyici_kosullar)}>
                      <VurguluMetin metin={kosulOzeti(k.tetikleyici_kosullar)} arama={aramaMetni} />
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-mono text-xs">
                      <VurguluMetin metin={k.acilacak_sorular?.join(', ') || '-'} arama={aramaMetni} />
                    </td>
                    <td className="px-4 py-3 text-red-600 font-mono text-xs">
                      <VurguluMetin metin={k.kapanacak_sorular?.join(', ') || '-'} arama={aramaMetni} />
                    </td>
                    <td className="px-4 py-3"><Rozet varyant={k.aktif_mi ? 'success' : 'default'}>{k.aktif_mi ? 'Aktif' : 'Pasif'}</Rozet></td>
                    <td className="px-4 py-3 text-right">
                      <Buton varyant="ghost" boyut="sm" onClick={() => kuralModalAc(k)}>Koşulları Düzenle</Buton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </KartIcerigi>
      </Kart>

      {/* SORU MODAL */}
      {soruModalAcik && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{seciliSoru ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h2>
            {hata && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{hata}</div>}

            <form onSubmit={handleSoruKaydet} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Soru Metni</label>
                  <Girdi name="metin" required defaultValue={seciliSoru?.metin} placeholder="Soruyu yazın..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama (Opsiyonel)</label>
                  <Girdi name="aciklama" defaultValue={seciliSoru?.aciklama} placeholder="Alt başlık veya ipucu..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select name="kategori_id" required defaultValue={seciliSoru?.kategori_id} className="w-full rounded-xl border-slate-200 bg-slate-50 p-2 text-sm">
                    {baslangicKategorileri.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Soru Kodu (İç Algoritma İçin)</label>
                  <Girdi name="kod" defaultValue={seciliSoru?.kod} placeholder="Örn: Q1_ERP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sıra No</label>
                  <Girdi name="sira" type="number" defaultValue={seciliSoru?.sira || 99} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Soru Tipi</label>
                  <select name="tip" defaultValue={seciliSoru?.tip || 'single_choice'} className="w-full rounded-xl border-slate-200 bg-slate-50 p-2 text-sm">
                    <option value="single_choice">Tekli Seçim</option>
                    <option value="multiple_choice">Çoklu Seçim</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="zorunlu_mu" defaultChecked={seciliSoru ? seciliSoru.zorunlu_mu : true} className="rounded text-blue-600 border-slate-300" />
                  <span className="text-sm text-slate-700">Zorunlu Soru</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="aktif_mi" defaultChecked={seciliSoru ? seciliSoru.aktif_mi : true} className="rounded text-blue-600 border-slate-300" />
                  <span className="text-sm text-slate-700">Aktif</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Buton type="button" varyant="secondary" onClick={() => setSoruModalAcik(false)} className="flex-1">İptal</Buton>
                <Buton type="submit" varyant="primary" yukleniyorMu={yukleniyor} className="flex-1">Kaydet</Buton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* SEÇENEK MODAL */}
      {secenekModalAcik && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{seciliSecenek ? 'Seçeneği Düzenle' : 'Yeni Seçenek Ekle'}</h2>
            {hata && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{hata}</div>}

            <form onSubmit={handleSecenekKaydet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bağlı Olduğu Soru</label>
                <select name="soru_id" required defaultValue={seciliSecenek?.soru_id} className="w-full rounded-xl border-slate-200 bg-slate-50 p-2 text-sm">
                  <option value="" disabled>Soru Seçin</option>
                  {sorular.sort((a,b) => a.sira - b.sira).map(s => <option key={s.id} value={s.id}>{s.metin}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seçenek Metni (Kullanıcıya Görünen)</label>
                <Girdi name="metin" required defaultValue={seciliSecenek?.metin} placeholder="Örn: 10-50 Milyon TL" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Puan (Değer)</label>
                  <Girdi name="deger" type="number" defaultValue={seciliSecenek?.deger || 0} placeholder="10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sıra No</label>
                  <Girdi name="sira" type="number" defaultValue={seciliSecenek?.sira || 1} required />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Buton type="button" varyant="secondary" onClick={() => setSecenekModalAcik(false)} className="flex-1">İptal</Buton>
                <Buton type="submit" varyant="primary" yukleniyorMu={yukleniyor} className="flex-1">Kaydet</Buton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* KURAL MODAL (UI BUILDER) */}
      {kuralModalAcik && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{seciliKural ? 'Algoritma Koşullarını Düzenle' : 'Yeni Kural Ekle'}</h2>
            {hata && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{hata}</div>}

            <form onSubmit={handleKuralKaydet} className="space-y-6">
              
              {/* EĞER KOŞULU (Tetikleyiciler) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Eğer şu koşullar sağlanırsa (Tetikleyiciler)</h3>
                  <select 
                    value={kuralMantigi} 
                    onChange={(e) => setKuralMantigi(e.target.value as 'AND' | 'OR')}
                    className="rounded-lg border-slate-300 text-sm p-1"
                  >
                    <option value="AND">Hepsini Sağlamalı (VE)</option>
                    <option value="OR">Herhangi Birini Sağlamalı (VEYA)</option>
                  </select>
                </div>

                {kosullar.map((kosul, i) => {
                  const seciliSoru = sorular.find(s => s.kod === kosul.soru_kodu)
                  const soruSecenekleri = seciliSoru ? secenekler.filter(opt => opt.soru_id === seciliSoru.id) : []

                  // Başlangıç kuralıysa farklı gösterelim
                  if (kosul.kural_tipi === 'baslangic') {
                    return (
                      <div key={i} className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <span className="flex-1 text-sm font-medium text-blue-800">Başlangıç Kuralı (Bu eylemler doğrudan çalışır)</span>
                        <button type="button" onClick={() => kosulSil(i)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
                      <select 
                        value={kosul.soru_kodu || ''} 
                        onChange={(e) => {
                          kosulGuncelle(i, { soru_kodu: e.target.value, deger: '', operator: 'eq' })
                        }}
                        className="flex-1 border-slate-300 rounded-lg p-2 text-sm bg-slate-50 w-full"
                      >
                        <option value="" disabled>1. Soruyu Seçin...</option>
                        {sorular.filter(s => s.kod).sort((a,b) => a.sira - b.sira).map(s => (
                          <option key={s.id} value={s.kod}>{s.metin}</option>
                        ))}
                      </select>
                      
                      <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-sm text-slate-600 font-medium whitespace-nowrap text-center">
                        Cevabı Şuyysa →
                      </div>
                      
                      {soruSecenekleri.length > 0 ? (
                        <select
                          value={kosul.deger || ''} 
                          onChange={(e) => kosulGuncelle(i, { deger: e.target.value })}
                          className="flex-1 border-slate-300 rounded-lg p-2 text-sm bg-slate-50 w-full"
                        >
                          <option value="" disabled>2. Cevabı Seçin...</option>
                          {soruSecenekleri.sort((a,b) => a.sira - b.sira).map(opt => (
                            <option key={opt.id} value={opt.deger}>{opt.metin} (Puan: {opt.deger})</option>
                          ))}
                        </select>
                      ) : (
                        <Girdi 
                          placeholder={seciliSoru ? "Değer girin..." : "Önce soru seçin"} 
                          value={kosul.deger || ''} 
                          onChange={(e) => kosulGuncelle(i, { deger: e.target.value })}
                          className="flex-1 !py-2 text-sm w-full"
                          disabled={!seciliSoru}
                        />
                      )}
                      
                      <button type="button" onClick={() => kosulSil(i)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg self-end md:self-auto" title="Koşulu Sil">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )
                })}
                <Buton type="button" varyant="outline" boyut="sm" onClick={kosulEkle} className="w-full border-dashed">
                  + Yeni Koşul Ekle
                </Buton>
              </div>

              {/* O ZAMAN EYLEMLERİ */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-blue-900">O Zaman Şu Eylemleri Gerçekleştir</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Açılacak / Gösterilecek Sorular</label>
                    <Girdi name="acilacak_sorular" defaultValue={seciliKural?.acilacak_sorular?.join(', ')} placeholder="Soru kodlarını virgülle ayırın (Örn: Q10, Q11)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kapanacak / Gizlenecek Sorular</label>
                    <Girdi name="kapanacak_sorular" defaultValue={seciliKural?.kapanacak_sorular?.join(', ')} placeholder="Soru kodlarını virgülle ayırın (Örn: Q15)" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="aktif_mi" defaultChecked={seciliKural ? seciliKural.aktif_mi : true} className="rounded text-blue-600 border-slate-300" />
                  <span className="text-sm text-slate-700">Kural Aktif</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Buton type="button" varyant="secondary" onClick={() => setKuralModalAcik(false)} className="flex-1">İptal</Buton>
                <Buton type="submit" varyant="primary" yukleniyorMu={yukleniyor} className="flex-1">Kaydet</Buton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
