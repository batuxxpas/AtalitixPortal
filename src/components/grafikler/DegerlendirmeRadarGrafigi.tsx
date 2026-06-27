'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { KategoriSkoru } from '@/types'

interface RadarGrafikProps {
  data: KategoriSkoru[]
  className?: string
}

export function DegerlendirmeRadarGrafigi({ data, className }: RadarGrafikProps) {
  const grafikVerisi = data.map((d) => ({
    kategori: d.kategori_adi,
    skor: d.yuzde,
    fullMark: 100,
  }))

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={grafikVerisi}>
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis
            dataKey="kategori"
            tick={{ fill: '#475569', fontSize: 11 }}
          />
          <Radar
            name="Skor"
            dataKey="skor"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              color: '#334155',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Skor']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
