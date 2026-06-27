'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SirketFiltresi({ sirketler }: { sirketler: { id: string; ad: string }[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seciliSirket = searchParams.get('sirket') || 'hepsi'

  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
      <span className="text-sm font-medium text-slate-500">Şirket:</span>
      <select
        value={seciliSirket}
        onChange={(e) => {
          const val = e.target.value
          if (val === 'hepsi') {
            router.push('/degerlendirme')
          } else {
            router.push(`/degerlendirme?sirket=${val}`)
          }
        }}
        className="text-sm border-none bg-transparent font-medium text-slate-900 focus:ring-0 cursor-pointer outline-none"
      >
        <option value="hepsi">Tümü</option>
        {sirketler.map(s => (
          <option key={s.id} value={s.id}>{s.ad}</option>
        ))}
      </select>
    </div>
  )
}
