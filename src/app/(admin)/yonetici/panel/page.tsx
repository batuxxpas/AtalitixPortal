import { createClient } from '@/lib/supabase/server'
import { IstatistikKarti, Kart, KartBasligi, KartIcerigi } from '@/components/arayuz'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: companyCount },
    { count: assessmentCount },
    { count: userCount },
    { data: rawAssessments },
  ] = await Promise.all([
    supabase.from('sirketler').select('*', { count: 'exact', head: true }),
    supabase.from('degerlendirmeler').select('*', { count: 'exact', head: true }),
    supabase.from('profiller').select('*', { count: 'exact', head: true }),
    supabase
      .from('degerlendirmeler')
      .select('id, baslik, durum, olusturulma_tarihi, sirket_id')
      .order('olusturulma_tarihi', { ascending: false })
      .limit(8),
  ])

  type RecentAssessment = { id: string; baslik: string; durum: string; olusturulma_tarihi: string; company_name: string }
  const recentAssessments: RecentAssessment[] = await Promise.all(
    ((rawAssessments ?? []) as Array<{ id: string; baslik: string; durum: string; olusturulma_tarihi: string; sirket_id: string }>).map(async (a) => {
      const { data: company } = await supabase.from('sirketler').select('ad').eq('id', a.sirket_id).single() as unknown as { data: any }
      return { ...a, company_name: (company as { ad: string } | null)?.ad ?? '—' }
    })
  )

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Genel platform istatistikleri</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <IstatistikKarti
          baslik="Toplam Şirket"
          deger={companyCount ?? 0}
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <IstatistikKarti
          baslik="Toplam Değerlendirme"
          deger={assessmentCount ?? 0}
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <IstatistikKarti
          baslik="Kullanıcı Sayısı"
          deger={userCount ?? 0}
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <IstatistikKarti
          baslik="Aktif Oturum"
          deger="—"
          aciklama="Gerçek zamanlı veri"
          ikon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      <Kart>
        <KartBasligi baslik="Son Değerlendirmeler" />
        <KartIcerigi className="p-0">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Şirket</th>
                <th>Başlık</th>
                <th>Durum</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {recentAssessments.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.company_name}</td>
                  <td>{a.baslik}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {a.durum}
                    </span>
                  </td>
                  <td className="text-slate-500">{formatDate(a.olusturulma_tarihi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </KartIcerigi>
      </Kart>
    </div>
  )
}
