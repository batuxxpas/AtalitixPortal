import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { IstatistikKarti, Kart, KartBasligi, KartIcerigi, Buton, Rozet } from '@/components/arayuz'
import { DEGERLENDIRME_DURUM_ETIKETLERI, DEGERLENDIRME_DURUM_RENKLERI, DEGERLENDIRME_TIPLERI } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: rawProfile } = await supabase
    .from('profiller')
    .select('id, tam_ad, rol, sirket_id, olusturulma_tarihi, guncellenme_tarihi')
    .eq('id', user.id)
    .single() as unknown as { data: any }

  type ProfileWithCompany = typeof rawProfile & { company: { ad: string } | null }
  let profileWithCompany: ProfileWithCompany = { ...(rawProfile as NonNullable<typeof rawProfile>), company: null }
  if (rawProfile?.sirket_id) {
    const { data: company } = await supabase.from('sirketler').select('ad').eq('id', rawProfile.sirket_id).single() as unknown as { data: any }
    profileWithCompany = { ...profileWithCompany, company: company as { ad: string } | null }
  }
  const profile = profileWithCompany

  const { count: totalCompanies } = await supabase
    .from('sirketler')
    .select('*', { count: 'exact', head: true })

  const { data: rawAssessments } = await supabase
    .from('degerlendirmeler')
    .select('id, baslik, durum, tamamlanma_tarihi, olusturulma_tarihi, sirket_id, company:sirketler(ad)')
    .order('olusturulma_tarihi', { ascending: false }) as unknown as { data: any[] }

  type AssessmentRow = { id: string; baslik: string; durum: string; tamamlanma_tarihi: string | null; olusturulma_tarihi: string; company?: { ad: string } | null }
  const allAssessments: AssessmentRow[] = (rawAssessments ?? []) as AssessmentRow[]

  const totalAssessments = allAssessments.length
  const completedAssessments = allAssessments.filter((a) => a.durum === 'completed').length
  const inProgressAssessments = allAssessments.filter((a) => a.durum === 'in_progress').length

  // Remove latestScore since we are showing global stats
  const latestScore = totalCompanies ?? 0

  const recentAssessments = allAssessments.slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hoş geldiniz, {profile?.tam_ad?.split(' ')[0] ?? 'Kullanıcı'}
        </h1>
        <p className="text-slate-500 mt-1">
          Sistem genel bakış ve tüm müşteri değerlendirmeleri
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <IstatistikKarti
          baslik="Toplam Değerlendirme"
          deger={totalAssessments}
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <IstatistikKarti
          baslik="Tamamlanan"
          deger={completedAssessments}
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <IstatistikKarti
          baslik="Devam Eden"
          deger={inProgressAssessments}
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <IstatistikKarti
          baslik="Kayıtlı Şirketler"
          deger={latestScore}
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Removed "İlk değerlendirmenizi başlatın" CTA since it's an admin dashboard now */}

      {/* Recent assessments */}
      {recentAssessments && recentAssessments.length > 0 && (
        <Kart>
          <KartBasligi
            baslik="Son Değerlendirmeler"
            aksiyon={
              <Link href="/degerlendirme">
                <Buton varyant="ghost" boyut="sm">Tümünü Gör</Buton>
              </Link>
            }
          />
          <KartIcerigi className="p-0">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Şirket</th>
                  <th>Başlık</th>
                  <th>Tip</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {recentAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td className="font-semibold text-[#0a1945]">{assessment.company?.ad || 'Bilinmiyor'}</td>
                    <td className="font-medium">{assessment.baslik}</td>
                    <td>
                      <Rozet varyant="default" className="text-xs">
                        {(DEGERLENDIRME_TIPLERI[(assessment as any).tip ?? 'erp'])?.etiket ?? 'ERP'}
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
                    <td className="text-slate-400">{formatDate(assessment.olusturulma_tarihi)}</td>
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
                ))}
              </tbody>
            </table>
          </KartIcerigi>
        </Kart>
      )}
    </div>
  )
}
