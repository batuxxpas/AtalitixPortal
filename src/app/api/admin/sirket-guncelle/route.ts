import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { id, ad, sektor, vkn, yetkili_isim, yetkili_email } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Şirket ID gerekli.' }, { status: 400 })
    }

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

    // 2. Şirketi güncelle
    const { data: sirketData, error: sirketError } = await (supabase
      .from('sirketler') as any)
      .update({
        ad,
        sektor,
        vkn,
        yetkili_isim,
        yetkili_email
      })
      .eq('id', id)
      .select()
      .single()

    if (sirketError) throw sirketError

    return NextResponse.json({ success: true, sirket: sirketData })

  } catch (error: any) {
    console.error('Şirket güncelleme hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Şirket güncellenirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
