import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { id, tam_ad, rol, yetkiler } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Kullanıcı ID gerekli.' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiller')
      .select('rol')
      .eq('id', user.id)
      .single() as { data: { rol: string } | null }

    if (profile?.rol !== 'superadmin') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
    }

    // 2. Profili güncelle
    const { data: profilData, error: profilError } = await (supabase
      .from('profiller') as any)
      .update({
        tam_ad,
        rol,
        yetkiler
      })
      .eq('id', id)
      .select()
      .single()

    if (profilError) throw profilError

    return NextResponse.json({ success: true, profil: profilData })

  } catch (error: any) {
    console.error('Kullanıcı güncelleme hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Kullanıcı güncellenirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
