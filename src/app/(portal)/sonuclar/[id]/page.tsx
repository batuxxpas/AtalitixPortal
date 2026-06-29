import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Kart, KartBasligi, KartIcerigi, Buton, Rozet, YazdirButonu } from '@/components/arayuz'
import { MailGonderButonu } from '@/components/arayuz/MailGonderButonu'
import { ErpUygunlukPaneli } from '@/components/degerlendirme/ErpUygunlukPaneli'
import { DegerlendirmeRadarGrafigi } from '@/components/grafikler/DegerlendirmeRadarGrafigi'
import { KategoriCubukGrafigi } from '@/components/grafikler/KategoriCubukGrafigi'
import { CozumPastaGrafigi } from '@/components/grafikler/CozumPastaGrafigi'
import { AtalitixYorumuPaneli } from '@/components/degerlendirme/AtalitixYorumuPaneli'
import { formatDate } from '@/lib/utils'
import { SKOR_ARALIKLARI } from '@/lib/constants'
import type { KategoriSkoru, Onerilen } from '@/types'

export const metadata: Metadata = { title: 'Değerlendirme Sonuçları' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  type DegerlendirmeRow = {
    id: string
    baslik: string
    durum: string
    tamamlanma_tarihi: string | null
    company: { ad: string; sektor: string | null; calisan_sayisi: string | null; yetkili_email: string | null } | null
  }

  const { data: rawAssessment } = await supabase
    .from('degerlendirmeler')
    .select('*, company:sirketler(*)')
    .eq('id', id)
    .single() as unknown as { data: any }

  const assessment = rawAssessment as DegerlendirmeRow | null
  if (!assessment) notFound()

  // Get user profile for permissions
  const { data: rawProfil } = await supabase
    .from('profiller')
    .select('rol, yetkiler')
    .eq('id', user.id)
    .single() as unknown as { data: any }
    
  const profil = rawProfil

  const isAuthorizedToComment = profil?.rol === 'superadmin' || (profil?.yetkiler as any)?.yorum_yonetimi === true

  const { data: result } = await supabase
    .from('degerlendirme_sonuclari')
    .select('*')
    .eq('degerlendirme_id', id)
    .single() as unknown as { data: any }

  const categoryScoresRaw = result?.kategori_puanlari as any[] ?? []
  const categoryScores: KategoriSkoru[] = categoryScoresRaw
    .map(c => ({
      kategori_id: c.kategori_id ?? c.category_id,
      kategori_adi: c.kategori_adi ?? c.category_name,
      skor: c.skor ?? c.score ?? 0,
      maks_skor: c.maks_skor ?? c.max_score ?? 0,
      yuzde: c.yuzde ?? c.percentage ?? 0,
      cevaplanan: c.cevaplanan ?? c.answered_questions ?? 0,
      toplam_soru: c.toplam_soru ?? c.total_questions ?? 0,
      yorum: c.yorum ?? c.comment ?? '',
    }))
    .filter(c => c.toplam_soru > 0) // Sadece sorusu olan (gizlenmemiş) kategorileri göster

  const recommendedSolutionsRaw = result?.onerilen_cozumler as any[] ?? []
  const recommendedSolutions: Onerilen[] = recommendedSolutionsRaw.map(s => ({
    cozum_id: s.cozum_id ?? s.solution_id,
    cozum_adi: s.cozum_adi ?? s.solution_name,
    firma: s.firma ?? s.vendor,
    slug: s.slug,
    katman: s.katman ?? s.tier,
    logo_url: s.logo_url,
    uyum_skoru: s.uyum_skoru ?? s.match_score ?? 0,
    uyum_yuzdesi: s.uyum_yuzdesi ?? s.match_percentage ?? 0,
    gerekce_listesi: s.gerekce_listesi ?? s.reasons ?? [],
  }))

  const scoreRange = SKOR_ARALIKLARI.find(
    (r) => (result?.toplam_puan ?? 0) >= r.min && (result?.toplam_puan ?? 0) <= r.max
  ) ?? SKOR_ARALIKLARI[0]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/degerlendirme">
              <Buton varyant="ghost" boyut="xs">← Değerlendirmeler</Buton>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{assessment.baslik} — Sonuçlar</h1>
          <p className="text-slate-500 mt-1">
            Tamamlanma: {assessment.tamamlanma_tarihi ? formatDate(assessment.tamamlanma_tarihi) : '—'}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <YazdirButonu />
          <MailGonderButonu 
            hedefMail={assessment.company?.yetkili_email || user.email || ''} 
            sirketAdi={assessment.company?.ad || ''} 
            raporId={id} 
          />
        </div>
      </div>

      {/* Overall score */}
      {result ? (
        <div id="rapor-alani" className="space-y-6">
          <ErpUygunlukPaneli result={result} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Score */}
            <Kart className="p-6 flex flex-col items-center justify-center text-center lg:col-span-1 h-full min-h-[300px]">
              <p className="text-sm text-slate-500 mb-6">Genel Uyum Skoru</p>
              <div className="relative inline-flex items-center justify-center w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke={scoreRange.renk}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.toplam_puan / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">{result.toplam_puan}</span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>
              <Rozet
                varyant="default"
                className="mt-6"
                style={{ color: scoreRange.renk, backgroundColor: `${scoreRange.renk}20` }}
              >
                {scoreRange.etiket}
              </Rozet>
            </Kart>

            {/* Radar chart */}
            <Kart className="lg:col-span-2">
              <KartBasligi baslik="Kategori Bazlı Analiz" />
              <KartIcerigi>
                <DegerlendirmeRadarGrafigi data={categoryScores} />
              </KartIcerigi>
            </Kart>
          </div>

          {/* Category scores detail */}
          <Kart>
            <KartBasligi baslik="Kategori Skorları" aciklama="Her kategorideki ağırlıklı performans analizi" />
            <KartIcerigi>
              <KategoriCubukGrafigi data={categoryScores} className="mb-6" />
              
              <div className="overflow-x-auto w-full pb-2">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 font-semibold text-center">Ağırlıklı Puan</th>
                      <th className="px-4 py-3 font-semibold text-center">Maks Puan</th>
                      <th className="px-4 py-3 font-semibold text-center">Skor /100</th>
                      <th className="px-4 py-3 font-semibold text-center">Cevaplanan</th>
                      <th className="px-4 py-3 font-semibold text-center">Toplam Soru</th>
                      <th className="px-4 py-3 font-semibold">Yorum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categoryScores.map((cat) => (
                      <tr key={cat.kategori_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{cat.kategori_adi}</td>
                        <td className="px-4 py-3 text-center text-amber-600 font-medium">{cat.skor}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{cat.maks_skor}</td>
                        <td className="px-4 py-3 text-center">
                          <Rozet varyant="outline" className={
                            cat.yuzde >= 67 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                            cat.yuzde >= 34 ? 'text-blue-600 border-blue-200 bg-blue-50' :
                            'text-rose-600 border-rose-200 bg-rose-50'
                          }>
                            {cat.yuzde}%
                          </Rozet>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{cat.cevaplanan}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{cat.toplam_soru}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{cat.yorum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </KartIcerigi>
          </Kart>

          {/* Recommended solutions */}
          {recommendedSolutions.length > 0 && (
            <Kart>
              <KartBasligi
                baslik="Önerilen ERP Çözümleri"
                aciklama="Analizinize göre en uygun ERP sistemleri"
              />
              <KartIcerigi>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <CozumPastaGrafigi solutions={recommendedSolutions} />
                  <div className="space-y-3">
                    {recommendedSolutions.map((solution, idx) => (
                      <div
                        key={solution.cozum_id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          idx === 0
                            ? 'border-blue-500 bg-blue-50/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900">{solution.cozum_adi}</h3>
                              <Rozet varyant="primary" boyut="sm">
                                {solution.uyum_yuzdesi.toFixed(0)}% Uyum
                              </Rozet>
                            </div>
                            <p className="text-sm text-slate-500 mb-3">{solution.firma}</p>
                            <div className="flex flex-wrap gap-2">
                              {solution.gerekce_listesi.slice(0, 2).map((reason, i) => (
                                <p key={i} className="text-xs text-slate-500 mt-1">• {reason}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </KartIcerigi>
            </Kart>
          )}

          {/* Analysis summary */}
          {result?.analiz_ozeti && (
            <Kart>
              <KartBasligi baslik="Analiz Özeti" />
              <KartIcerigi>
                <p className="text-slate-600 leading-relaxed">{result.analiz_ozeti}</p>
              </KartIcerigi>
            </Kart>
          )}

          {/* Atalitix Yorumu Paneli */}
          <AtalitixYorumuPaneli 
            degerlendirmeId={id} 
            mevcutYorum={result?.atalitix_yorumu || null} 
            isAuthorizedToComment={isAuthorizedToComment}
          />
        </div>
      ) : (
        /* Result not yet generated */
        <Kart className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Sonuçlar Hesaplanıyor</h3>
          <p className="text-slate-500 text-sm">
            Değerlendirme sonuçlarınız analiz ediliyor. Bu işlem birkaç dakika sürebilir.
          </p>
        </Kart>
      )}
    </div>
  )
}
