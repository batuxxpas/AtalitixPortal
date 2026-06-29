import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Kart, KartBasligi, KartIcerigi, Buton, Rozet } from '@/components/arayuz'
import { BosDurum } from '@/components/ortak'
import { DEGERLENDIRME_DURUM_ETIKETLERI, DEGERLENDIRME_DURUM_RENKLERI, DEGERLENDIRME_TIPLERI } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { DegerlendirmeBaslatClient } from './DegerlendirmeBaslatClient'
import { SirketFiltresi } from './SirketFiltresi'

export const metadata: Metadata = { title: 'Değerlendirmeler' }

export default async function DegerlendirmeListeSayfasi(props: { searchParams: Promise<{ sirket?: string }> }) {
  const searchParams = await props.searchParams
  const sirketFiltresi = searchParams.sirket

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiller')
    .select('rol, yetkiler')
    .eq('id', user.id)
    .single() as { data: { rol: string; yetkiler?: any } | null }

  const hasAccess = profile?.rol === 'superadmin' || profile?.yetkiler?.degerlendirme_yonetimi === true;

  if (!hasAccess) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Kart className="p-12 text-center border-dashed border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Erişim Reddedildi</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Bu sayfayı görüntülemek için "Değerlendirme Başlatabilir" yetkisine sahip olmanız gerekmektedir. Lütfen yöneticinizle iletişime geçin.
          </p>
        </Kart>
      </div>
    )
  }

  // Sadece superadmin erişebileceği için tüm şirketleri ve tüm değerlendirmeleri çekiyoruz
  const { data: sirketler } = await supabase
    .from('sirketler')
    .select('id, ad')
    .order('ad')

  let query = supabase
    .from('degerlendirmeler')
    .select('*, company:sirketler(ad)')
    .order('olusturulma_tarihi', { ascending: false })

  if (sirketFiltresi && sirketFiltresi !== 'hepsi') {
    query = query.eq('sirket_id', sirketFiltresi)
  }

  const { data: assessments } = await query as unknown as { data: any[] }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Değerlendirmeler</h1>
        <p className="text-slate-500 mt-1">Analiz ve değerlendirme araçlarınız</p>
      </div>

      {/* Degerlendirme Tipleri Kartlari */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(DEGERLENDIRME_TIPLERI).map(([tipAnahtari, tipBilgisi]) => (
          <Kart key={tipAnahtari} className="p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{tipBilgisi.etiket}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">{tipBilgisi.aciklama}</p>
                {tipBilgisi.aktif ? (
                  <DegerlendirmeBaslatClient
                    kullaniciId={user.id}
                    tip={tipAnahtari}
                    sirketler={sirketler || []}
                  />
                ) : (
                  <Rozet varyant="default" className="text-slate-500 bg-slate-100 border border-slate-200">
                    Geliştirme Aşamasında
                  </Rozet>
                )}
              </div>
            </div>
            {!tipBilgisi.aktif && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none rounded-2xl" />
            )}
          </Kart>
        ))}
      </div>

      {/* Mevcut Degerlendirmeler Tablosu */}
      <Kart>
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Tüm Değerlendirmeler</h2>
          <SirketFiltresi sirketler={sirketler || []} />
        </div>
        {!assessments || assessments.length === 0 ? (
          <BosDurum
            baslik="Henüz değerlendirme bulunmuyor"
            aciklama="Yeni bir değerlendirme başlatarak şirketinizi analiz etmeye başlayabilirsiniz."
          />
        ) : (
          <KartIcerigi className="p-0">
            <div className="overflow-x-auto w-full pb-2">
              <table className="portal-table">
              <thead>
                <tr>
                  <th>Şirket</th>
                  <th>Başlık</th>
                  <th>Tip</th>
                  <th>Durum</th>
                  <th>Başlangıç</th>
                  <th>Tamamlanma</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => {
                  const tipBilgisi = DEGERLENDIRME_TIPLERI[assessment.tip ?? 'erp']
                  return (
                    <tr key={assessment.id}>
                      <td className="font-semibold text-[#0a1945]">{assessment.company?.ad || 'Bilinmiyor'}</td>
                      <td className="font-medium text-slate-800">{assessment.baslik}</td>
                      <td>
                        <Rozet varyant="default" className="text-xs">
                          {tipBilgisi?.etiket ?? 'ERP'}
                        </Rozet>
                      </td>
                      <td>
                        <Rozet
                          varyant="default"
                          className={DEGERLENDIRME_DURUM_RENKLERI[assessment.durum]}
                          nokta
                          noktaRengi={assessment.durum === 'completed' ? 'bg-emerald-500' : assessment.durum === 'in_progress' ? 'bg-amber-500' : 'bg-slate-400'}
                        >
                          {DEGERLENDIRME_DURUM_ETIKETLERI[assessment.durum]}
                        </Rozet>
                      </td>
                      <td className="text-slate-500">
                        {assessment.olusturulma_tarihi ? formatDate(assessment.olusturulma_tarihi) : '—'}
                      </td>
                      <td className="text-slate-500">
                        {assessment.tamamlanma_tarihi ? formatDate(assessment.tamamlanma_tarihi) : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {assessment.durum === 'completed' ? (
                            <Link href={`/sonuclar/${assessment.id}`}>
                              <Buton varyant="outline" boyut="xs">Sonuçları Gör</Buton>
                            </Link>
                          ) : (
                            <Link href={`/degerlendirme/${assessment.id}`}>
                              <Buton varyant="primary" boyut="xs">Devam Et</Buton>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                </tbody>
              </table>
            </div>
          </KartIcerigi>
        )}
      </Kart>
    </div>
  )
}
