import { cn } from '@/lib/utils'

interface YukleniyorProps {
  boyut?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const boyutlar = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}

export function Yukleniyor({ boyut = 'md', className }: YukleniyorProps) {
  return (
    <svg
      className={cn('animate-spin text-blue-500', boyutlar[boyut], className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function SayfaYukleniyor() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Yukleniyor boyut="lg" />
        <p className="text-sm text-slate-400">Yükleniyor...</p>
      </div>
    </div>
  )
}
