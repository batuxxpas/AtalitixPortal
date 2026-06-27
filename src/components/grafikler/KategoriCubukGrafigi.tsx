'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { KategoriSkoru } from '@/types'

interface KategoriBarGrafikProps {
  data: KategoriSkoru[]
  className?: string
}

// Kurumsal kategori renk atama algoritması - Her kategoriye eşsiz bir renk
function getCategoryColor(name: string): string {
  if (name.startsWith('A.')) return '#334155' // Slate 700 (Firma Profili)
  if (name.startsWith('B.')) return '#0ea5e9' // Sky 500 (Finansal Kapasite)
  if (name.startsWith('C.')) return '#64748b' // Slate 500 (Mevcut Sistemler)
  if (name.startsWith('D.')) return '#8b5cf6' // Violet 500 (Süreç Olgunluğu)
  if (name.startsWith('E.')) return '#d946ef' // Fuchsia 500 (Özelleştirme)
  if (name.startsWith('F.')) return '#10b981' // Emerald 500 (Finans, Muhasebe)
  if (name.startsWith('G.')) return '#3b82f6' // Blue 500 (Satış, CRM)
  if (name.startsWith('H.')) return '#f59e0b' // Amber 500 (Satınalma, Tedarikçi)
  if (name.startsWith('I.')) return '#f97316' // Orange 500 (Stok, Depo)
  if (name.startsWith('J.')) return '#6366f1' // Indigo 500 (Üretim, Planlama)
  if (name.startsWith('K.')) return '#06b6d4' // Cyan 500 (Kalite, Regülasyon)
  if (name.startsWith('L.')) return '#0284c7' // Sky 600 (Veri, Raporlama)
  if (name.startsWith('M.')) return '#f43f5e' // Rose 500 (Entegrasyon)
  if (name.startsWith('N.')) return '#a855f7' // Purple 500 (Proje Yönetimi)

  return '#94a3b8' // Varsayılan yedek renk
}

export function KategoriCubukGrafigi({ data, className }: KategoriBarGrafikProps) {
  const grafikVerisi = data.map((d) => ({
    // X ekseninde rahat okunsun diye tam adı kullanıyoruz. Tooltip'te de yine tam adı gösteriyoruz.
    kisaAd: d.kategori_adi,
    tamAd: d.kategori_adi,
    skor: d.yuzde,
    renk: getCategoryColor(d.kategori_adi),
  }))

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={grafikVerisi} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="kisaAd"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={180}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              color: '#334155',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(value, _name, props) => [
              `${value}%`,
              ((props as { payload?: { tamAd: string } }).payload?.tamAd ?? String(_name)),
            ]}
            cursor={{ fill: 'rgba(59,130,246,0.06)' }}
          />
          <Bar dataKey="skor" radius={[6, 6, 0, 0]}>
            {grafikVerisi.map((entry, index) => (
              <Cell key={index} fill={entry.renk} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
