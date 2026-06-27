import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Yetki kontrolü
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

    const { data: profil } = await supabase
      .from('profiller')
      .select('rol, yetkiler')
      .eq('id', userData.user.id)
      .single()

    if (!profil || (profil.rol !== 'superadmin' && !(profil.yetkiler as any)?.soru_yonetimi)) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const { id, kategori_id, kod, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi } = body

    if (id) {
      // Güncelleme
      const { data, error } = await supabase
        .from('sorular')
        .update({ kategori_id, kod, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    } else {
      // Ekleme
      const { data, error } = await supabase
        .from('sorular')
        .insert([{ kategori_id, kod, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi }])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }
  } catch (error: any) {
    console.error('Soru API Hatası:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

    const { data: profil } = await supabase
      .from('profiller')
      .select('rol, yetkiler')
      .eq('id', userData.user.id)
      .single()

    if (!profil || (profil.rol !== 'superadmin' && !(profil.yetkiler as any)?.soru_yonetimi)) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const { error } = await supabase
      .from('sorular')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
