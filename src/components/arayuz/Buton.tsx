import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Varyant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type Boyut = 'xs' | 'sm' | 'md' | 'lg'

interface ButonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varyant?: Varyant
  boyut?: Boyut
  yukleniyorMu?: boolean
  solIkon?: React.ReactNode
  sagIkon?: React.ReactNode
}

const varyantlar: Record<Varyant, string> = {
  primary:
    'bg-[#0a1945] text-white hover:bg-[#152a6b] shadow-sm',
  secondary:
    'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm',
  outline:
    'border border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50',
  ghost:
    'text-slate-600 hover:text-[#0a1945] hover:bg-slate-50',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  success:
    'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
}

const boyutlar: Record<Boyut, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3.5 py-1.5 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-2xl',
}

export function Buton({
  varyant = 'primary',
  boyut = 'md',
  yukleniyorMu = false,
  solIkon,
  sagIkon,
  className,
  children,
  disabled,
  ...props
}: ButonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        varyantlar[varyant],
        boyutlar[boyut],
        className
      )}
      disabled={disabled || yukleniyorMu}
      {...props}
    >
      {yukleniyorMu ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : solIkon}
      {children}
      {!yukleniyorMu && sagIkon}
    </button>
  )
}
