import { createClient } from '@/lib/supabase/server'
import { Kart, KartBasligi, KartIcerigi, Buton, Rozet } from '@/components/arayuz'
import { BosDurum } from '@/components/ortak'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Şirketler — Admin' }

export default async function AdminCompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('sirketler')
    .select('*')
    .order('olusturulma_tarihi', { ascending: false }) as unknown as { data: any[] }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Şirketler</h1>
          <p className="text-slate-400 mt-1">{companies?.length ?? 0} şirket kayıtlı</p>
        </div>
        <Buton>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Şirket Davet Et
        </Buton>
      </div>

      <Kart>
        {!companies || companies.length === 0 ? (
          <BosDurum
            baslik="Henüz şirket eklenmemiş"
            aciklama="Platforma yeni şirketler davet edin veya manuel olarak ekleyin."
          />
        ) : (
          <KartIcerigi className="p-0">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Şirket Adı</th>
                  <th>Sektör</th>
                  <th>Boyut</th>
                  <th>Durum</th>
                  <th>Kayıt Tarihi</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-200">{company.ad}</p>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            {company.website}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="text-slate-400">{company.industry ?? '—'}</td>
                    <td className="text-slate-400">{company.size ?? '—'}</td>
                    <td>
                      <Rozet varyant={company.is_active ? 'success' : 'default'} nokta>
                        {company.is_active ? 'Aktif' : 'Pasif'}
                      </Rozet>
                    </td>
                    <td className="text-slate-400">{formatDate(company.olusturulma_tarihi)}</td>
                    <td>
                      <Buton varyant="ghost" boyut="sm">Detaylar</Buton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </KartIcerigi>
        )}
      </Kart>
    </div>
  )
}
