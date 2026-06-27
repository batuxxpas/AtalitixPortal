import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DegerlendirmeSihirbazi } from '@/components/degerlendirme/DegerlendirmeSihirbazi'

export const metadata: Metadata = { title: 'Değerlendirme' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AssessmentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Load assessment
  const { data: assessment } = await supabase
    .from('degerlendirmeler')
    .select('*')
    .eq('id', id)
    .single() as unknown as { data: any } as unknown as { data: any }

  if (!assessment) notFound()
  if (assessment.durum === 'completed') redirect(`/sonuclar/${id}`)

  // Load sorular grouped by category
  const { data: kategoriler } = await supabase
    .from('soru_kategorileri')
    .select('*, sorular(*, secenekler:soru_secenekleri(*))')
    .eq('aktif_mi', true)
    .order('sira')

  // Load existing answers
  const { data: existingAnswers } = await supabase
    .from('degerlendirme_cevaplari')
    .select('*')
    .eq('degerlendirme_id', id)

  // Load kurallar
  const { data: kurallar } = await supabase
    .from('kurallar')
    .select('*')
    .eq('aktif_mi', true)

  // Normalize metadata type
  const normalizedAssessment = {
    ...assessment,
    metadata: assessment.metadata as Record<string, unknown> | null,
  }

  return (
    <DegerlendirmeSihirbazi
      degerlendirme={normalizedAssessment as import('@/types').Degerlendirme}
      kategoriler={kategoriler ?? []}
      onaylanmisCevaplar={existingAnswers ?? []}
      kurallar={(kurallar as unknown as import('@/types').Kural[]) ?? []}
    />
  )
}
