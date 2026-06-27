import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

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

    // 2. Service Role Client oluştur
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Kullanıcıyı auth.users'dan sil. cascade ile profiller tablosundan da silinir.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Kullanıcı silme hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Kullanıcı silinirken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
