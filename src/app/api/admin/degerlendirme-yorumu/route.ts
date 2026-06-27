import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açılmamış' }, { status: 401 })
    }

    // Kullanıcının profilini çekerek yetki kontrolü yapıyoruz
    const { data: rawProfil } = await supabase
      .from('profiller')
      .select('rol, yetkiler')
      .eq('id', user.id)
      .single() as unknown as { data: any }
      
    const profil = rawProfil

    if (!profil) {
      return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 403 })
    }

    // Yetki kontrolü: Superadmin VEYA yorum_yonetimi yetkisine sahip olmalı
    const yorumYetkisiVar = profil.rol === 'superadmin' || (profil.yetkiler as Record<string, boolean>)?.yorum_yonetimi === true

    if (!yorumYetkisiVar) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const { degerlendirmeId, yorum } = await req.json()

    if (!degerlendirmeId) {
      return NextResponse.json({ error: 'Değerlendirme ID gerekli' }, { status: 400 })
    }

    // Update atalitix_yorumu
    const { error: updateError } = await supabase
      .from('degerlendirme_sonuclari')
      .update({ atalitix_yorumu: yorum } as any)
      .eq('degerlendirme_id', degerlendirmeId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ basarili: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 })
  }
}
