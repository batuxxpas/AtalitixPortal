import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalYanMenu } from '@/components/duzen/PortalYanMenu'
import { PortalUstBilgi } from '@/components/duzen/PortalUstBilgi'

import { KarsilamaEkrani } from '@/components/arayuz'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiller')
    .select('*, company:sirketler(*)')
    .eq('id', user.id)
    .single() as unknown as { data: any }

  return (
    <KarsilamaEkrani>
      <div className="min-h-screen bg-[#f8f9fc] flex">
        <PortalYanMenu profile={profile} />
        <div className="flex-1 flex flex-col min-w-0">
          <PortalUstBilgi profile={profile} />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </KarsilamaEkrani>
  )
}
