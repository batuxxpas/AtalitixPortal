import { createClient } from '@/lib/supabase/server'
import { Kart, KartBasligi, KartIcerigi, Buton, Rozet } from '@/components/arayuz'
import { BosDurum } from '@/components/ortak'
import { formatDate } from '@/lib/utils'
import { DEGERLENDIRME_DURUM_ETIKETLERI, DEGERLENDIRME_DURUM_RENKLERI } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Değerlendirmeler — Admin' }

export default async function AdminAssessmentsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('degerlendirmeler')
    .select('id, baslik, durum, tamamlanma_tarihi, olusturulma_tarihi, sirket_id, olusturan_id')
    .order('olusturulma_tarihi', { ascending: false })

  type AssessmentRow = {
    id: string
    baslik: string
    durum: string
    tamamlanma_tarihi: string | null
    olusturulma_tarihi: string
    sirket_id: string
    olusturan_id: string
    company: { ad: string } | null
    creator: { tam_ad: string | null } | null
  }

  const rawRows = (data ?? []) as Array<{
    id: string; baslik: string; durum: string; tamamlanma_tarihi: string | null
    olusturulma_tarihi: string; sirket_id: string; olusturan_id: string
  }>

  const assessments: AssessmentRow[] = await Promise.all(
    rawRows.map(async (a) => {
      const [{ data: company }, { data: creator }] = await Promise.all([
        supabase.from('sirketler').select('ad').eq('id', a.sirket_id).single() as unknown as { data: any },
        supabase.from('profiller').select('tam_ad').eq('id', a.olusturan_id).single() as unknown as { data: any },
      ])
      return { ...a, company: company as { ad: string } | null, creator: creator as { tam_ad: string | null } | null }
    })
  )

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Değerlendirmeler</h1>
        <p className="text-slate-500 mt-1">Tüm şirket değerlendirmeleri</p>
      </div>

      <Kart>
        {!assessments || assessments.length === 0 ? (
          <BosDurum
            baslik="Henüz değerlendirme yok"
            aciklama="Sistemde henüz tamamlanmış veya devam eden bir değerlendirme bulunmuyor."
          />
        ) : (
          <KartIcerigi className="p-0">
            <div className="overflow-x-auto w-full pb-2">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Şirket</th>
                    <th>Başlık</th>
                    <th>Oluşturan</th>
                    <th>Durum</th>
                    <th>Tamamlanma</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium">{(a.company as { ad?: string } | null)?.ad ?? '—'}</td>
                      <td>{a.baslik}</td>
                      <td className="text-slate-500">
                        {(a.creator as { tam_ad?: string } | null)?.tam_ad ?? '—'}
                      </td>
                      <td>
                        <Rozet
                          varyant="default"
                          className={DEGERLENDIRME_DURUM_RENKLERI[a.durum]}
                          nokta
                        >
                          {DEGERLENDIRME_DURUM_ETIKETLERI[a.durum]}
                        </Rozet>
                      </td>
                      <td className="text-slate-500">
                        {a.tamamlanma_tarihi ? formatDate(a.tamamlanma_tarihi) : '—'}
                      </td>
                      <td>
                        <Buton varyant="ghost" boyut="sm">İncele</Buton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </KartIcerigi>
        )}
      </Kart>
    </div>
  )
}
