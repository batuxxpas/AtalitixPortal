import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Buton, Kart, Rozet } from '@/components/arayuz'

export default async function DetaylarPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  // Kullanıcı ve yetki
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/giris')

  const { data: assessment } = await supabase
    .from('degerlendirmeler')
    .select('*, company:sirketler(ad)')
    .eq('id', id)
    .single()

  if (!assessment) return redirect('/degerlendirme')

  // Kategoriler, Sorular ve Seçenekler
  const { data: kategoriler } = await supabase
    .from('soru_kategorileri')
    .select('id, ad, sira, sorular(id, metin, sira, tip, secenekler:soru_secenekleri(id, metin, sira))')
    .eq('aktif_mi', true)
    .order('sira')

  // Cevaplar ve Notlar (metin_degeri)
  const { data: cevaplar } = await supabase
    .from('degerlendirme_cevaplari')
    .select('soru_id, secenek_idleri, metin_degeri')
    .eq('degerlendirme_id', id)

  const answerMap = new Map<string, { secenekler: string[], not: string | null }>()
  cevaplar?.forEach((c: any) => {
    answerMap.set(c.soru_id, {
      secenekler: c.secenek_idleri || [],
      not: c.metin_degeri || null
    })
  })

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/sonuclar/${id}`}>
              <Buton varyant="ghost" boyut="xs">← Sonuçlara Dön</Buton>
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{(assessment as any).baslik} — Soru & Cevap Dökümü</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            {(assessment as any).company?.ad ? `${(assessment as any).company.ad} tarafından ` : ''}verilen yanıtlar ve düşülen notlar
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {(kategoriler || [])
          .sort((a: any, b: any) => a.sira - b.sira)
          .map((kat: any) => {
          const catQuestions = (kat.sorular || [])
            .sort((a: any, b: any) => a.sira - b.sira)
            .filter((q: any) => answerMap.has(q.id))
          
          if (catQuestions.length === 0) return null;

          return (
            <div key={kat.id} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">{kat.ad}</h2>
              {catQuestions.map((q: any, idx: number) => {
                const ans = answerMap.get(q.id)
                const secilenMetinler = (q.secenekler || [])
                  .sort((a: any, b: any) => a.sira - b.sira)
                  .filter((opt: any) => ans?.secenekler.includes(opt.id))
                  .map((opt: any) => opt.metin)

                return (
                  <Kart key={q.id} className="p-5 hover:border-blue-200 transition-colors bg-white">
                    <div className="flex items-start gap-4">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-sm font-medium mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="font-medium text-slate-900 text-base">{q.metin}</p>
                        
                        <div className="flex flex-wrap gap-2 pt-1">
                          {secilenMetinler.length > 0 ? secilenMetinler.map((metin: string, i: number) => (
                            <Rozet key={i} varyant="default" className="bg-blue-50 text-blue-700 border-blue-200 text-sm py-1 px-3">
                              ✓ {metin}
                            </Rozet>
                          )) : (
                            <Rozet varyant="outline" className="text-slate-400">Yanıt Bırakılmadı</Rozet>
                          )}
                        </div>

                        {ans?.not && (
                          <div className="mt-4 bg-[#f8fafc] border border-slate-200 rounded-xl p-4 text-sm text-slate-700 flex gap-3 shadow-sm">
                            <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <div>
                              <strong className="block text-slate-800 text-xs font-bold uppercase tracking-wide mb-1 opacity-70">Müşteri Notu</strong>
                              <span className="leading-relaxed whitespace-pre-wrap">{ans.not}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Kart>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
