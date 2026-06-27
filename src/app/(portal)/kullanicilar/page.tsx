import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Kart, KartIcerigi } from '@/components/arayuz'
import { KullanicilarClient } from './KullanicilarClient'

export const metadata: Metadata = { title: 'Kullanıcı Yönetimi' }

export default async function KullanicilarPage() {
  const supabase = await createClient()
  
  // Yetki Kontrolü
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiller')
    .select('rol')
    .eq('id', user.id)
    .single() as { data: { rol: string } | null }

  if (profile?.rol !== 'superadmin') {
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
            Kullanıcıları yönetmek için Sistem Yöneticisi (Süper Admin) yetkisine sahip olmanız gerekmektedir.
          </p>
        </Kart>
      </div>
    )
  }

  // Sadece iç çalışanları veya sirket_id'si olmayanları çekebiliriz, 
  // ya da tüm profilleri çekip sadece Atalitix yetkilisi olanları gösterebiliriz.
  // Müşterilerin rolü 'user' ve sirket_id'si var.
  // Superadminlerin ve iç çalışanların rolü 'superadmin' veya 'admin' / 'user' olabilir ama sirket_id'si NULL olur.
  // Şimdilik sirket_id IS NULL olanları "İç Çalışan" kabul edelim.
  const { data: kullanicilar } = await supabase
    .from('profiller')
    .select('*')
    .is('sirket_id', null)
    .order('olusturulma_tarihi', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi</h1>
          <p className="text-slate-500 mt-1">Sistem yetkililerini ve iç çalışanları yönetin.</p>
        </div>
      </div>

      <Kart>
        <KartIcerigi>
          <KullanicilarClient baslangicKullanicilari={kullanicilar || []} />
        </KartIcerigi>
      </Kart>
    </div>
  )
}
