import { cn } from '@/lib/utils'

type RozetVaryanti = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

interface RozetProps {
  children: React.ReactNode
  varyant?: RozetVaryanti
  boyut?: 'sm' | 'md'
  className?: string
  style?: React.CSSProperties
  nokta?: boolean
  noktaRengi?: string // e.g. "bg-emerald-500"
}

const varyantlar: Record<RozetVaryanti, string> = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-blue-50 text-blue-700 border border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  outline: 'border border-slate-300 text-slate-600',
}

const noktaRenkleri: Record<RozetVaryanti, string> = {
  default: 'bg-slate-400',
  primary: 'bg-blue-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-cyan-400',
  outline: 'bg-slate-400',
}

export function Rozet({ children, varyant = 'default', boyut = 'sm', nokta = false, noktaRengi, className, style }: RozetProps) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        boyut === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        varyantlar[varyant],
        className
      )}
    >
      {nokta && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', noktaRengi || noktaRenkleri[varyant])} />}
      {children}
    </span>
  )
}
