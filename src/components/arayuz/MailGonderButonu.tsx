'use client'

import { useState, useEffect } from 'react'
import { Buton } from '@/components/arayuz'
import { useSearchParams } from 'next/navigation'
import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'

interface MailGonderButonuProps {
  hedefMail: string
  sirketAdi?: string
  raporId: string
}

export function MailGonderButonu({ hedefMail, sirketAdi, raporId }: MailGonderButonuProps) {
  const [yukleniyor, setYukleniyor] = useState(false)
  const [basarili, setBasarili] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const autoSend = searchParams.get('autoSend')

  useEffect(() => {
    if (autoSend === 'true' && hedefMail) {
      const sentKey = `rapor_gonderildi_${raporId}`
      if (!sessionStorage.getItem(sentKey)) {
        sessionStorage.setItem(sentKey, 'true')
        
        // Grafikler ve componentlerin render olması için kısa bir bekleme
        const timer = setTimeout(() => {
          handleMailGonder()
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [autoSend, hedefMail, raporId])

  async function generatePdf() {
    const element = document.getElementById('rapor-alani')
    if (!element) throw new Error('Rapor alanı bulunamadı.')

    // İhtiyaç halinde PDF modu class'ı eklenebilir
    element.classList.add('pdf-mode')
    
    try {
      const imgData = await toJpeg(element, { 
        quality: 0.95,
        backgroundColor: '#f8fafc',
        pixelRatio: 2
      })
      
      element.classList.remove('pdf-mode')
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      
      const elWidth = element.clientWidth
      const elHeight = element.clientHeight
      const pdfHeight = (elHeight * pdfWidth) / elWidth
      
      // Eğer boy A4'ten (297mm) çok uzunsa sayfalar halinde eklemek gerekir.
      let position = 0
      const pageHeight = pdf.internal.pageSize.getHeight()

      // İlk sayfayı ekle
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight)
      position -= pageHeight

      // Kalan kısımlar için sayfa ekle
      while (position > -pdfHeight) {
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight)
        position -= pageHeight
      }
      
      return pdf.output('datauristring')
    } catch (err) {
      element.classList.remove('pdf-mode')
      throw err
    }
  }

  async function handleMailGonder() {
    if (!hedefMail) {
      setHata('Geçerli bir mail adresi bulunamadı.')
      return
    }

    setYukleniyor(true)
    setHata(null)
    setBasarili(false)

    try {
      // 1. PDF Üret
      const pdfDataUrl = await generatePdf()

      // 2. API'ye gönder
      const res = await fetch('/api/mail-gonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hedefMail,
          sirketAdi: sirketAdi,
          pdfDataUrl
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Mail gönderilirken hata oluştu.')
      
      setBasarili(true)
      setTimeout(() => setBasarili(false), 5000)
    } catch (error: any) {
      console.error(error)
      setHata(error.message || 'Bilinmeyen bir hata oluştu.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Buton 
        varyant="primary" 
        boyut="sm" 
        onClick={handleMailGonder}
        yukleniyorMu={yukleniyor}
        className="print:hidden relative"
      >
        {!yukleniyor && (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
        {basarili ? 'Gönderildi!' : 'Mail Gönder'}
      </Buton>
      {hata && <span className="text-xs text-red-500 mt-1 max-w-[150px] text-right leading-tight">{hata}</span>}
      {basarili && <span className="text-xs text-emerald-500 mt-1">Gönderildi!</span>}
    </div>
  )
}
