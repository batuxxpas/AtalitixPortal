'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Buton } from '@/components/arayuz'

export function DegerlendirmeSilButonu({ id }: { id: string }) {
  const [siliniyor, setSiliniyor] = useState(false)
  const [modalAcik, setModalAcik] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSil = async () => {
    setSiliniyor(true)
    try {
      const res = await fetch(`/api/admin/degerlendirme-sil?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Silinirken bir hata oluştu')
      
      setModalAcik(false)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
      setSiliniyor(false)
      setModalAcik(false)
    }
  }

  return (
    <>
      <Buton 
        varyant="ghost" 
        boyut="xs" 
        onClick={() => setModalAcik(true)} 
        disabled={siliniyor}
        className="text-red-400 hover:text-red-600 hover:bg-red-50/50 px-2 flex items-center justify-center shrink-0"
        title="Değerlendirmeyi Sil"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </Buton>

      {mounted && modalAcik && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Değerlendirmeyi Sil</h3>
              <p className="text-sm text-slate-500">
                Bu değerlendirmeyi ve içindeki <b>tüm şirket cevaplarını</b> kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3 justify-end border-t border-slate-100">
              <Buton varyant="ghost" onClick={() => setModalAcik(false)} disabled={siliniyor}>
                İptal
              </Buton>
              <Buton 
                varyant="primary" 
                onClick={handleSil} 
                disabled={siliniyor}
                className="bg-red-500 hover:bg-red-600 border-red-500 shadow-sm"
              >
                {siliniyor ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
              </Buton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
