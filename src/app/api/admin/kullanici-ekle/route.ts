import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { tam_ad, email, sifre, rol, yetkiler } = await request.json()

    // 1. Yetki Kontrolü: İsteği yapan kişi superadmin mi?
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

    // 2. Service Role Client oluştur (Kullanıcı yaratmak için gerekli)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Kullanıcı oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: sifre,
      email_confirm: true,
      user_metadata: {
        full_name: tam_ad,
        role: rol,
        is_internal: 'true', // Şirket oluşturmasın diye işaret
        yetkiler: yetkiler
      }
    })

    if (authError) throw authError

    // Profil trigger sayesinde (veya veritabanında) oluşturulmuş olacak.
    // Ancak triggerın bitmesini beklemek için ufak bir bekleme veya manuel okuma yapabiliriz
    // Ya da direkt olarak yeni profilin bilgisini döndürebiliriz:
    const { data: profilData, error: profilError } = await supabaseAdmin
      .from('profiller')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    // Eğer trigger gecikirse hata fırlatmayalım, varsayılan bir data dönelim
    const safeProfil = profilData || { id: authData.user.id, tam_ad, rol, yetkiler }

    return NextResponse.json({ success: true, profil: safeProfil })

  } catch (error: any) {
    console.error('Kullanıcı oluşturma hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Kullanıcı oluşturulurken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
