import type { ElementType } from 'react'
import { cn } from '@/lib/utils'

interface KartProps {
  children: React.ReactNode
  className?: string
  parlama?: boolean
  as?: ElementType
  id?: string
}

export function Kart({ children, className, parlama = false, as: Tag = 'div', id }: KartProps) {
  return (
    <Tag
      id={id}
      className={cn(
        'bg-white border border-slate-100 shadow-sm rounded-2xl',
        parlama && 'card-glow',
        className
      )}
    >
      {children}
    </Tag>
  )
}

interface KartBasligiProps {
  baslik: string
  aciklama?: string
  aksiyon?: React.ReactNode
  ikon?: React.ReactNode
  className?: string
}

export function KartBasligi({ baslik, aciklama, aksiyon, ikon, className }: KartBasligiProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-6 border-b border-slate-100', className)}>
      <div className="flex items-center gap-3">
        {ikon && (
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            {ikon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-900">{baslik}</h3>
          {aciklama && <p className="text-sm text-slate-500 mt-0.5">{aciklama}</p>}
        </div>
      </div>
      {aksiyon && <div className="shrink-0">{aksiyon}</div>}
    </div>
  )
}

export function KartIcerigi({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function KartAltBilgisi({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4', className)}>
      {children}
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────
interface IstatistikKartiProps {
  baslik: string
  deger: string | number
  aciklama?: string
  ikon?: React.ReactNode
  egilim?: { deger: number; etiket: string }
  className?: string
}

export function IstatistikKarti({ baslik, deger, aciklama, ikon, egilim, className }: IstatistikKartiProps) {
  const isPositive = egilim && egilim.deger >= 0

  return (
    <Kart className={cn('p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium">{baslik}</p>
          <p className="text-3xl font-bold text-[#0a1945] mt-1">{deger}</p>
          {aciklama && <p className="text-sm text-slate-500 mt-1">{aciklama}</p>}
          {egilim && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-semibold', isPositive ? 'text-emerald-600' : 'text-red-500')}>
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(egilim.deger)}% {egilim.etiket}</span>
            </div>
          )}
        </div>
        {ikon && (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            {ikon}
          </div>
        )}
      </div>
    </Kart>
  )
}
