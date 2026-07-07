import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

    const { data: rawProfil } = await supabase
      .from('profiller')
      .select('rol, yetkiler')
      .eq('id', userData.user.id)
      .single() as unknown as { data: any }
      
    const profil = rawProfil

    // Yalnızca superadmin veya değerlendirme silme yetkisi olanlar silebilir. (veya değerlendirmeyi başlatan kişi, ama şimdilik superadmin/yetkili)
    if (!profil || (profil.rol !== 'superadmin' && !(profil.yetkiler as any)?.degerlendirme_yonetimi)) {
      return NextResponse.json({ error: 'Bu değerlendirmeyi silmek için yetkiniz yok' }, { status: 403 })
    }

    // Cevaplar DB tarafindan cascade delete ile silinmiyorsa manuel silebiliriz. Ama degerlendirme silindiginde silinsin.
    // Yine de guvenceye almak icin degerlendirme_cevaplari once silebiliriz.
    await (supabase as any).from('degerlendirme_cevaplari').delete().eq('degerlendirme_id', id)
    await (supabase as any).from('degerlendirme_sonuclari').delete().eq('degerlendirme_id', id)
    
    const { error } = await (supabase as any)
      .from('degerlendirmeler')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
