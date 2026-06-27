import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface ProfilResmiProps {
  src?: string | null
  isim?: string | null
  boyut?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const boyutlar = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function ProfilResmi({ src, isim, boyut = 'md', className }: ProfilResmiProps) {
  const basHarfler = isim ? getInitials(isim) : '?'

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 font-semibold overflow-hidden',
        'bg-gradient-to-br from-[#2d3a8c] to-[#3b82f6] text-white',
        boyutlar[boyut],
        className
      )}
    >
      {src ? (
        <img src={src} alt={isim ?? 'Profil Resmi'} className="w-full h-full object-cover" />
      ) : (
        <span>{basHarfler}</span>
      )}
    </div>
  )
}
