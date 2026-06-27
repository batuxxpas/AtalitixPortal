import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEGERLENDIRME_TIPLERI } from '@/lib/constants'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const company_id = formData.get('company_id') as string
  const created_by = formData.get('created_by') as string
  const tip = (formData.get('tip') as string) || 'erp'

  if (!company_id || !created_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Tip bilgisine gore dinamik baslik olustur
  const tipBilgisi = DEGERLENDIRME_TIPLERI[tip]
  const baslik = tipBilgisi
    ? `${tipBilgisi.etiket} — ${new Date().toLocaleDateString('tr-TR')}`
    : `Değerlendirme — ${new Date().toLocaleDateString('tr-TR')}`

  const { data: assessment, error } = await supabase
    .from('degerlendirmeler')
    .insert([{
      sirket_id: company_id,
      olusturan_id: created_by,
      baslik,
      tip,
      durum: 'in_progress',
          }] as any)
    .select()
    .single() as unknown as { data: any, error: any }

  if (error || !assessment) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  return NextResponse.redirect(
    new URL(`/degerlendirme/${assessment.id}`, request.url)
  )
}
