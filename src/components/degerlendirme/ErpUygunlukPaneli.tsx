import { Kart, Rozet } from '@/components/arayuz'
import type { DegerlendirmeSonucu } from '@/types'

interface ErpUygunlukPaneliProps {
  result: DegerlendirmeSonucu
}

export function ErpUygunlukPaneli({ result }: ErpUygunlukPaneliProps) {
  const fitscan = (result as any).fitscan_verisi

  // Eski kayıtlar için (fitscan_verisi boşsa) frontend üzerinde hesaplama yapıyoruz
  const totalScore100 = (result as any).toplam_puan ?? 0
  const fitScanScore = fitscan?.skor ?? Math.round(totalScore100 * 5)
  
  let erpHazirlikSkoru = fitscan?.erpHazirlikSkoru
  if (erpHazirlikSkoru === undefined) {
    const projeKategorisi = ((result as any).kategori_puanlari ?? []).find(
      (c: any) => c.category_name.toLowerCase().includes('proje') || c.category_name.toLowerCase().includes('hazırlık')
    )
    erpHazirlikSkoru = projeKategorisi?.percentage ?? 0
  }

  let cevaplanmaOrani = fitscan?.cevaplanmaOrani
  if (cevaplanmaOrani === undefined) {
    let totalQs = 0
    let answeredQs = 0
    ;((result as any).kategori_puanlari ?? []).forEach((c: any) => {
      totalQs += c.total_questions || 0
      answeredQs += c.answered_questions || 0
    })
    cevaplanmaOrani = totalQs > 0 ? Math.round((answeredQs / totalQs) * 100) : 0
  }

  let anaYonlendirme = fitscan?.anaYonlendirme
  let bandYorumu = fitscan?.bandYorumu
  let isKritik = fitscan?.isKritik

  if (anaYonlendirme === undefined) {
    if (fitScanScore <= 180) {
      anaYonlendirme = 'Odoo / Logo'
      bandYorumu = 'Finansal kapasite, süreç olgunluğu veya kapsam sınırlı olabilir. Sınırlı ve kontrollü başlangıç; önce süreç netleştirme önerilir.'
    } else if (fitScanScore <= 280) {
      anaYonlendirme = 'Odoo Öncelikli'
      bandYorumu = 'Modüler ERP ve süreç iyileştirme ihtiyacı belirgin. Odoo öncelikli; SAP büyüme senaryosu olarak kontrol edilir.'
    } else if (fitScanScore <= 380) {
      anaYonlendirme = 'SAP ve Odoo'
      bandYorumu = 'Fonksiyonel kapsam ve operasyon karmaşıklığı artıyor. SAP ve Odoo birlikte kısa liste; Canias/Logo alternatif.'
    } else {
      anaYonlendirme = 'SAP Öncelikli'
      bandYorumu = 'Kurumsal ölçek, güçlü finansal kapasite ve yönetişim ihtiyacı yüksek. SAP öncelikli; Odoo/Canias alternatif.'
    }

    isKritik = false
    if (cevaplanmaOrani < 70) {
      isKritik = true
      bandYorumu = 'Soru seti henüz yeterli oranda cevaplanmadı. Ön yönlendirme için en az %70 cevaplanma önerilir.'
    }
  }

  return (
    <Kart className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="border-b border-slate-100 bg-slate-50/50 p-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          ATAlitiX ERP FitScan
          <Rozet varyant="default" className="ml-2 font-medium text-xs text-slate-600 bg-slate-100">
            SAP/Odoo Öncelikli Model
          </Rozet>
        </h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium mb-1">Toplam Skor /500</span>
            <span className="text-4xl font-extrabold text-[#0a1945]">{fitScanScore}</span>
          </div>
          <div className="flex flex-col border-l border-slate-100 pl-6">
            <span className="text-sm text-slate-500 font-medium mb-1">ERP Hazırlık Skoru /100</span>
            <span className="text-4xl font-bold text-blue-600">{erpHazirlikSkoru}</span>
          </div>
          <div className="flex flex-col border-l border-slate-100 pl-6">
            <span className="text-sm text-slate-500 font-medium mb-1">Cevaplanma Oranı</span>
            <span className="text-4xl font-bold text-emerald-600">%{cevaplanmaOrani}</span>
          </div>
          <div className="flex flex-col border-l border-slate-100 pl-6">
            <span className="text-sm text-slate-500 font-medium mb-1">Ana Yönlendirme</span>
            <span className="text-2xl font-bold text-slate-800 leading-tight mt-1">{anaYonlendirme}</span>
          </div>
        </div>

        {isKritik ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-amber-800">Kritik Not</h4>
              <p className="text-sm text-amber-700 mt-1">{bandYorumu}</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Otomatik Yorum & Rapor Taslağı</h4>
              <p className="text-sm text-slate-600 mt-1">{bandYorumu}</p>
            </div>
          </div>
        )}
      </div>
    </Kart>
  )
}
