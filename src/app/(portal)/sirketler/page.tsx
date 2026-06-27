import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Kart, KartBasligi, KartIcerigi, Rozet } from '@/components/arayuz'
import { SirketlerClient } from './SirketlerClient'

export const metadata: Metadata = { title: 'Şirket Yönetimi' }

export default async function SirketlerPage() {
  const supabase = await createClient()
  
  // Yetki Kontrolü
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiller')
    .select('rol, yetkiler')
    .eq('id', user.id)
    .single() as { data: { rol: string; yetkiler?: any } | null }

  const hasAccess = profile?.rol === 'superadmin' || profile?.yetkiler?.sirket_yonetimi === true;

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
            Bu sayfayı görüntülemek için "Müşteri Şirketleri Yönetebilir" yetkisine sahip olmanız gerekmektedir. Lütfen yöneticinizle iletişime geçin.
          </p>
        </Kart>
      </div>
    )
  }

  // Tüm şirketleri ve değerlendirme sayılarını çek
  const { data: sirketler } = await supabase
    .from('sirketler')
    .select(`
      *,
      degerlendirmeler (count)
    `)
    .order('olusturulma_tarihi', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Şirket Yönetimi</h1>
          <p className="text-slate-500 mt-1">Sisteme kayıtlı müşterileri ve yetkilileri yönetin.</p>
        </div>
      </div>

      <Kart>
        <KartIcerigi>
          <SirketlerClient baslangicSirketleri={sirketler || []} />
        </KartIcerigi>
      </Kart>
    </div>
  )
}
