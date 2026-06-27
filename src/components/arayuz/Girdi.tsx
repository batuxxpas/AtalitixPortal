import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface GirdiProps extends InputHTMLAttributes<HTMLInputElement> {
  etiket?: string
  etiketClassName?: string
  hata?: string
  ipucu?: string
  solIkon?: React.ReactNode
  sagIkon?: React.ReactNode
}

export function Girdi({
  etiket,
  etiketClassName,
  hata,
  ipucu,
  solIkon,
  sagIkon,
  className,
  id,
  ...props
}: GirdiProps) {
  const girdiId = id ?? etiket?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {etiket && (
        <label htmlFor={girdiId} className={cn("text-sm font-medium text-slate-700", etiketClassName)}>
          {etiket}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {solIkon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            {solIkon}
          </div>
        )}
        <input
          id={girdiId}
          className={cn(
            'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 shadow-sm',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            solIkon && 'pl-10',
            sagIkon && 'pr-10',
            hata && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500',
            className
          )}
          {...props}
        />
        {sagIkon && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            {sagIkon}
          </div>
        )}
      </div>
      {hata && <p className="text-xs text-red-500">{hata}</p>}
      {ipucu && !hata && <p className="text-xs text-slate-500">{ipucu}</p>}
    </div>
  )
}

interface MetinAlaniProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiket?: string
  hata?: string
  ipucu?: string
}

export function MetinAlani({ etiket, hata, ipucu, className, id, ...props }: MetinAlaniProps) {
  const girdiId = id ?? etiket?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {etiket && (
        <label htmlFor={girdiId} className="text-sm font-medium text-slate-700">
          {etiket}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={girdiId}
        className={cn(
          'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 shadow-sm',
          'placeholder:text-slate-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hata && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500',
          className
        )}
        {...props}
      />
      {hata && <p className="text-xs text-red-500">{hata}</p>}
      {ipucu && !hata && <p className="text-xs text-slate-500">{ipucu}</p>}
    </div>
  )
}

interface SecimProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  etiket?: string
  hata?: string
  ipucu?: string
  secenekler: { value: string; label: string }[]
  yerTutucu?: string
}

export function Secim({ etiket, hata, ipucu, secenekler, yerTutucu, className, id, ...props }: SecimProps) {
  const girdiId = id ?? etiket?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {etiket && (
        <label htmlFor={girdiId} className="text-sm font-medium text-slate-700">
          {etiket}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={girdiId}
        className={cn(
          'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'transition-all duration-200 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hata && 'border-red-500/50',
          className
        )}
        {...props}
      >
        {yerTutucu && <option value="">{yerTutucu}</option>}
        {secenekler.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hata && <p className="text-xs text-red-500">{hata}</p>}
      {ipucu && !hata && <p className="text-xs text-slate-500">{ipucu}</p>}
    </div>
  )
}
