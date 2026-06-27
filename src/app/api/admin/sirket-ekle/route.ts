import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { ad, sektor, vkn, yetkili_isim, yetkili_email } = await request.json()

    // 1. Yetki Kontrolü: İsteği yapan kişi superadmin mi?
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiller')
      .select('rol, yetkiler')
      .eq('id', user.id)
      .single() as { data: { rol: string; yetkiler?: any } | null }

    const hasAccess = profile?.rol === 'superadmin' || profile?.yetkiler?.sirket_yonetimi === true;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }

    // 2. Service Role Client oluştur (Kullanıcı yaratmak için gerekli)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Şirketi oluştur
    const { data: sirketData, error: sirketError } = await supabaseAdmin
      .from('sirketler')
      .insert({
        ad,
        sektor,
        vkn,
        yetkili_isim,
        yetkili_email
      })
      .select()
      .single()

    if (sirketError) throw sirketError

    // Şirket eklerken eskiden auth kullanıcısı oluşturuyorduk. Artık şirketler sisteme giriş yapmayacağı için sadece kayıt ekliyoruz.

    return NextResponse.json({ success: true, sirket: sirketData })

  } catch (error: any) {
    console.error('Şirket oluşturma hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Şirket oluşturulurken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
