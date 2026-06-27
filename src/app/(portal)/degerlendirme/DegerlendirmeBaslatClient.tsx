'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Buton } from '@/components/arayuz'

interface Sirket {
  id: string
  ad: string
}

export function DegerlendirmeBaslatClient({
  tip,
  kullaniciId,
  sirketler
}: {
  tip: string
  kullaniciId: string
  sirketler: Sirket[]
}) {
  const [modalAcik, setModalAcik] = useState(false)
  const [seciliSirket, setSeciliSirket] = useState<string>('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <Buton onClick={() => setModalAcik(true)} boyut="sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Yeni Değerlendirme
      </Buton>

      {modalAcik && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Değerlendirme Başlat</h2>
            <p className="text-sm text-slate-500 mb-6">
              Hangi şirket adına değerlendirme başlatmak istiyorsunuz?
            </p>

            <form action={`/api/assessments`} method="POST" onSubmit={() => setYukleniyor(true)}>
              <input type="hidden" name="created_by" value={kullaniciId} />
              <input type="hidden" name="tip" value={tip} />
              
              <div className="mb-6">
                <select 
                  name="company_id" 
                  required 
                  value={seciliSirket}
                  onChange={(e) => setSeciliSirket(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
                >
                  <option value="" disabled>Şirket Seçin...</option>
                  {sirketler.map(s => (
                    <option key={s.id} value={s.id}>{s.ad}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Buton type="button" varyant="secondary" onClick={() => setModalAcik(false)} className="flex-1">
                  İptal
                </Buton>
                <Buton type="submit" varyant="primary" yukleniyorMu={yukleniyor} disabled={!seciliSirket} className="flex-1">
                  Başlat
                </Buton>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
