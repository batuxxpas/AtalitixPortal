'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Buton, Kart, Rozet } from '@/components/arayuz'
import { createBrowserClient } from '@/lib/supabase'
import type { Degerlendirme, DegerlendirmeCevabi } from '@/types'

import { getHiddenQuestionIds } from '@/lib/akisMotoru'
import { 
  Building2, Wallet, Laptop, Settings, Wrench, Calculator, 
  ShoppingCart, Package, Factory, Cpu, ShieldCheck, 
  BarChart3, PlugZap, ClipboardList 
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  '🏢': Building2,
  '💰': Wallet,
  '💻': Laptop,
  '⚙️': Settings,
  '🔧': Wrench,
  '📊': Calculator,
  '🛒': ShoppingCart,
  '📦': Package,
  '🏭': Factory,
  '🔩': Cpu,
  '✅': ShieldCheck,
  '📈': BarChart3,
  '🔌': PlugZap,
  '📋': ClipboardList
}

// ─── Veritabanı şemasıyla birebir uyumlu tipler ───────────────────────────────
// soru_kategorileri: id, ad, slug, aciklama, ikon, sira, agirlik, aktif_mi
// sorular: id, kategori_id, metin, aciklama, tip, agirlik, zorunlu_mu, sira, aktif_mi
// soru_secenekleri: id, soru_id, metin, deger, sira

interface Category {
  id: string
  ad: string
  aciklama: string | null
  ikon: string | null
  sira: number
  agirlik: number
  sorular: Question[]
}

interface Question {
  id: string
  metin: string
  aciklama: string | null
  tip: string
  agirlik: number
  zorunlu_mu: boolean
  sira: number
  secenekler: Option[]
}

interface Option {
  id: string
  metin: string
  deger: number
  sira: number
}

interface WizardProps {
  degerlendirme: Degerlendirme
  kategoriler: Category[]
  onaylanmisCevaplar: DegerlendirmeCevabi[]
  kurallar: import('@/types').Kural[]
}

type AnswerMap = Record<string, string[]>

export function DegerlendirmeSihirbazi({ degerlendirme, kategoriler, onaylanmisCevaplar, kurallar }: WizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const map: AnswerMap = {}
    onaylanmisCevaplar.forEach((a) => {
      if (a.secilen_secenek_idleri) map[a.soru_id] = a.secilen_secenek_idleri
    })
    return map
  })
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    onaylanmisCevaplar.forEach((a: any) => {
      if (a.metin_degeri) map[a.soru_id] = a.metin_degeri
    })
    return map
  })
  const [isSaving, setIsSaving] = useState(false)
  const [raporOlusturuluyor, setRaporOlusturuluyor] = useState(false)
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null)
  const [noteOpenState, setNoteOpenState] = useState<Record<string, boolean>>({})

  // -- DİNAMİK AKIŞ MOTORU BAĞLANTISI --
  const hiddenQuestionIds = getHiddenQuestionIds(answers, kategoriler, kurallar)

  // Aktif kategorileri hesapla (en az 1 görünür sorusu olanlar)
  const activeCategories = kategoriler.filter(cat => 
    cat.sorular.some(q => !hiddenQuestionIds.has(q.id))
  )
  
  // Bulunduğumuz kategorinin activeCategories içindeki sırasını bulalım
  const currentCatId = kategoriler[currentCategoryIndex]?.id
  let activeIndex = activeCategories.findIndex(c => c.id === currentCatId)
  
  // Eğer bulunduğumuz kategori bir kural sonucu gizlenmişse, otomatik olarak bir öncekine veya sonrakine geç
  if (activeIndex === -1 && activeCategories.length > 0) {
    activeIndex = 0
    setCurrentCategoryIndex(kategoriler.findIndex(c => c.id === activeCategories[0].id))
  }

  const totalCategories = activeCategories.length
  const currentCategory = activeCategories[activeIndex]
  const progress = totalCategories > 0 ? Math.round(((activeIndex + 1) / totalCategories) * 100) : 0

  const allQuestionsInCategory = (currentCategory?.sorular || [])
    .filter(q => !hiddenQuestionIds.has(q.id))
    .sort((a, b) => a.sira - b.sira)
  const answeredInCategory = allQuestionsInCategory.filter(
    (q) => answers[q.id] && answers[q.id].length > 0
  ).length
  const requiredInCategory = allQuestionsInCategory.filter((q) => q.zorunlu_mu).length
  const answeredRequiredInCategory = allQuestionsInCategory.filter(
    (q) => q.zorunlu_mu && answers[q.id] && answers[q.id].length > 0
  ).length

  const canProceed = answeredRequiredInCategory === requiredInCategory

  function handleOptionSelect(questionId: string, optionId: string, tip: string) {
    if (highlightedQuestionId === questionId) {
      setHighlightedQuestionId(null)
    }
    setAnswers((prev) => {
      if (tip === 'single_choice') {
        return { ...prev, [questionId]: [optionId] }
      }
      const current = prev[questionId] ?? []
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter((id) => id !== optionId) }
      }
      return { ...prev, [questionId]: [...current, optionId] }
    })
  }

  async function saveAnswers() {
    const supabase = createBrowserClient()
    const upserts = Object.entries(answers)
      .filter(([soru_id]) => !hiddenQuestionIds.has(soru_id))
      .map(([soru_id, secenek_idleri]) => ({
        degerlendirme_id: degerlendirme.id,
        soru_id,
        secenek_idleri,
        metin_degeri: notes[soru_id] || null
      }))

    if (upserts.length === 0) return

    // @ts-ignore
    await supabase.from('degerlendirme_cevaplari').upsert(upserts, {
      onConflict: 'degerlendirme_id,soru_id',
    })
  }

  async function handleNext() {
    if (!canProceed) {
      const unansweredRequired = allQuestionsInCategory.find(q => q.zorunlu_mu && (!answers[q.id] || answers[q.id].length === 0))
      if (unansweredRequired) {
        setHighlightedQuestionId(unansweredRequired.id)
        const el = document.getElementById(`question-${unansweredRequired.id}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      return
    }

    setIsSaving(true)
    await saveAnswers()
    setIsSaving(false)

    if (activeIndex < totalCategories - 1) {
      const nextCatId = activeCategories[activeIndex + 1].id
      setCurrentCategoryIndex(kategoriler.findIndex(c => c.id === nextCatId))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handlePrev() {
    if (activeIndex > 0) {
      const prevCatId = activeCategories[activeIndex - 1].id
      setCurrentCategoryIndex(kategoriler.findIndex(c => c.id === prevCatId))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleSubmit() {
    if (!canProceed) {
      const unansweredRequired = allQuestionsInCategory.find(q => q.zorunlu_mu && (!answers[q.id] || answers[q.id].length === 0))
      if (unansweredRequired) {
        setHighlightedQuestionId(unansweredRequired.id)
        const el = document.getElementById(`question-${unansweredRequired.id}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      return
    }

    setRaporOlusturuluyor(true)
    setIsSaving(true)
    await saveAnswers()

    const supabase = createBrowserClient()
    await supabase
      .from('degerlendirmeler')
      // @ts-ignore
      .update({ durum: 'completed', tamamlanma_tarihi: new Date().toISOString() })
      .eq('id', degerlendirme.id)

    // Compute and store results via API
    await fetch('/api/sonuclar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ degerlendirme_id: degerlendirme.id }),
    })

    // Rapor oluşturma ekranı için 10 saniyelik bekleme süresi
    await new Promise((resolve) => setTimeout(resolve, 10000))

    setIsSaving(false)
    startTransition(() => {
      router.push(`/sonuclar/${degerlendirme.id}?autoSend=true`)
    })
  }

  const isLastCategory = activeIndex === totalCategories - 1

  if (raporOlusturuluyor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
        <div className="relative w-48 h-16 mb-12">
          <img src="/Atalitixlogo.jpeg" alt="Atalitix Logo" className="object-contain w-full h-full animate-pulse" />
        </div>
        
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
          <svg className="w-8 h-8 text-blue-600 absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>

        <h2 className="mt-8 text-2xl font-bold text-slate-900 text-center animate-fade-up">
          Analiz Ediliyor...
        </h2>
        <p className="mt-3 text-slate-500 text-center max-w-md leading-relaxed animate-fade-up" style={{ animationDelay: '200ms' }}>
          Atalitix sizin için ERP uygunluğunuzu analiz ediyor. Verileriniz işlenirken ve size en uygun sistemler seçilirken lütfen bekleyin.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{(degerlendirme as any).baslik ?? 'Değerlendirme'}</h1>
        <p className="text-slate-500 mt-1">
          Kategori {activeIndex + 1} / {totalCategories}
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">İlerleme</span>
          <span className="text-slate-700 font-medium">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        {/* Category steps */}
        <div className="flex gap-1 mt-2">
          {activeCategories.map((cat, idx) => (
            <div
              key={cat.id}
              className={cn(
                'flex-1 h-1 rounded-full transition-all duration-300',
                idx < activeIndex
                  ? 'bg-blue-500'
                  : idx === activeIndex
                  ? 'bg-blue-400 animate-pulse-slow'
                  : 'bg-slate-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Category info */}
      <Kart className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            {currentCategory?.ikon ? (
              (() => {
                const IconComp = ICON_MAP[currentCategory.ikon]
                return IconComp ? <IconComp className="w-6 h-6" /> : <span className="text-2xl">{currentCategory.ikon}</span>
              })()
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{currentCategory?.ad}</h2>
            {currentCategory?.aciklama && (
              <p className="text-sm text-slate-500 mt-1">{currentCategory.aciklama}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Rozet varyant="default" boyut="sm">
                {answeredInCategory} / {allQuestionsInCategory.length} yanıtlandı
              </Rozet>
              <Rozet varyant="warning" boyut="sm">
                Ağırlık: {currentCategory?.agirlik}x
              </Rozet>
            </div>
          </div>
        </div>
      </Kart>

      {/* Questions */}
      <div className="space-y-4">
        {allQuestionsInCategory.map((question, qIdx) => (
          <Kart 
            key={question.id} 
            id={`question-${question.id}`}
            className={cn(
              "p-5 transition-all duration-500",
              highlightedQuestionId === question.id 
                ? "border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)] bg-red-50/30 transform scale-[1.01]" 
                : ""
            )}
          >
            <div className="mb-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-800">
                  <span className="text-slate-400 mr-2">{qIdx + 1}.</span>
                  {question.metin}
                  {question.zorunlu_mu && <span className="text-red-500 ml-1">*</span>}
                </p>
                <Rozet varyant="default" className="text-slate-500 shrink-0" boyut="sm">
                  Ağırlık: {question.agirlik}
                </Rozet>
              </div>
              {question.aciklama && (
                <p className={cn(
                  "text-sm mt-1 ml-5",
                  highlightedQuestionId === question.id ? "text-red-600/80 font-medium" : "text-slate-500"
                )}>
                  {highlightedQuestionId === question.id ? "Lütfen bu soruyu cevaplayınız. " : ""}{question.aciklama}
                </p>
              )}
              {!question.aciklama && highlightedQuestionId === question.id && (
                <p className="text-sm mt-1 ml-5 text-red-600/80 font-medium">Lütfen bu soruyu cevaplayınız.</p>
              )}
            </div>

            <div className="space-y-2 ml-5">
              {(question.secenekler ?? [])
                .sort((a, b) => a.sira - b.sira)
                .map((option) => {
                  const isSelected = answers[question.id]?.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(question.id, option.id, question.tip)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 text-sm',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                            question.tip === 'single_choice' ? 'rounded-full' : 'rounded-md',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                          )}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span>{option.metin}</span>
                      </div>
                    </button>
                  )
                })}
            </div>

            {/* Note Section */}
            <div className="mt-4 ml-5">
              {!noteOpenState[question.id] && !notes[question.id] ? (
                <button 
                  onClick={() => setNoteOpenState(prev => ({ ...prev, [question.id]: true }))}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Bu soruya not veya açıklama ekle
                </button>
              ) : (
                <div className="animate-fade-in space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600">Soru Notu (Opsiyonel)</label>
                    <button 
                      onClick={() => {
                        setNoteOpenState(prev => ({ ...prev, [question.id]: false }))
                        if (!notes[question.id]) {
                          setNotes(prev => { const n = {...prev}; delete n[question.id]; return n; })
                        }
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Kapat
                    </button>
                  </div>
                  <textarea
                    value={notes[question.id] || ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [question.id]: e.target.value }))}
                    placeholder="Bu soru için eklemek istediğiniz bağlam, detay veya durumu buraya yazabilirsiniz..."
                    className="w-full h-20 p-3 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all text-slate-700"
                  />
                </div>
              )}
            </div>
          </Kart>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <Buton
          varyant="secondary"
          onClick={handlePrev}
          disabled={activeIndex === 0}
        >
          ← Önceki
        </Buton>

        {isLastCategory ? (
          <Buton
            onClick={handleSubmit}
            yukleniyorMu={isSaving || isPending}
            boyut="lg"
            className={!canProceed ? "bg-slate-800 hover:bg-slate-700" : "bg-blue-600 hover:bg-blue-700"}
          >
            Değerlendirmeyi Tamamla ✓
          </Buton>
        ) : (
          <Buton
            onClick={handleNext}
            yukleniyorMu={isSaving}
            varyant="primary"
            className={!canProceed ? "bg-slate-800 hover:bg-slate-700" : ""}
          >
            Sonraki →
          </Buton>
        )}
      </div>
    </div>
  )
}
