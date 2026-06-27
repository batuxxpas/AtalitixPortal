import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

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

    // 2. Şirketi sil (veritabanı constraints on delete cascade ayarlıyse ilgili veriler de silinir)
    const { error: sirketError } = await supabase
      .from('sirketler')
      .delete()
      .eq('id', id)

    if (sirketError) throw sirketError

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Şirket silme hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Şirket silinirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
