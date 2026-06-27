import type { Metadata } from 'next'
import { UYGULAMA_ADI, UYGULAMA_ACIKLAMASI } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: UYGULAMA_ADI,
    template: `%s | ${UYGULAMA_ADI}`,
  },
  description: UYGULAMA_ACIKLAMASI,
  keywords: ['ERP', 'danışmanlık', 'kurumsal yazılım', 'dijital dönüşüm', 'Atalitix'],
  authors: [{ name: 'Atalitix' }],
  openGraph: {
    title: UYGULAMA_ADI,
    description: UYGULAMA_ACIKLAMASI,
    type: 'website',
    locale: 'tr_TR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-900 antialiased">{children}</body>
    </html>
  )
}
