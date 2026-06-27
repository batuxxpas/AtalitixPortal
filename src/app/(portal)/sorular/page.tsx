import { createClient } from '@/lib/supabase/server'
import { SorularClient } from './SorularClient'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Soru ve Algoritma Yönetimi — Portal' }

export default async function SorularPage() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    redirect('/giris')
  }

  const { data: rawProfil } = await supabase
    .from('profiller')
    .select('rol, yetkiler')
    .eq('id', userData.user.id)
    .single() as unknown as { data: any }
    
  const profil = rawProfil

  if (!profil || (profil.rol !== 'superadmin' && !(profil.yetkiler as any)?.soru_yonetimi)) {
    redirect('/dashboard') // Yetkisiz erişim
  }

  // Kategorileri Çek
  const { data: kategoriler } = await supabase
    .from('soru_kategorileri')
    .select('*')
    .order('sira')

  // Soruları Çek
  const { data: sorular } = await supabase
    .from('sorular')
    .select('*')
    .order('sira')

  // Seçenekleri Çek
  const { data: secenekler } = await supabase
    .from('soru_secenekleri')
    .select('*')
    .order('sira')

  // Kuralları Çek
  const { data: kurallar } = await supabase
    .from('kurallar')
    .select('*')
    .order('olusturulma_tarihi', { ascending: false })

  return (
    <SorularClient 
      baslangicKategorileri={kategoriler || []} 
      baslangicSorulari={sorular || []} 
      baslangicSecenekleri={secenekler || []} 
      baslangicKurallari={kurallar || []} 
    />
  )
}
