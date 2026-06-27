'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Onerilen } from '@/types'

interface CozumPastaGrafikProps {
  solutions: Onerilen[]
  className?: string
}

const PASTA_RENKLERI = ['#3b82f6', '#6366f1', '#22c55e', '#f97316', '#ef4444']

export function CozumPastaGrafigi({ solutions, className }: CozumPastaGrafikProps) {
  const veri = solutions.slice(0, 5).map((s) => ({
    name: s.cozum_adi,
    value: s.uyum_yuzdesi,
  }))

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={veri}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {veri.map((_, index) => (
              <Cell key={index} fill={PASTA_RENKLERI[index % PASTA_RENKLERI.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              color: '#334155',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Uyum Skoru']}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#475569', fontSize: '12px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
