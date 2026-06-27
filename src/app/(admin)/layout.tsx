import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { YoneticiYanMenu } from '@/components/duzen/YoneticiYanMenu'
import { PortalUstBilgi } from '@/components/duzen/PortalUstBilgi'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiller')
    .select('*')
    .eq('id', user.id)
    .single() as unknown as { data: any }

  if (profile?.rol !== 'admin') redirect('/panel')

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex">
      <YoneticiYanMenu profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalUstBilgi profile={profile} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
