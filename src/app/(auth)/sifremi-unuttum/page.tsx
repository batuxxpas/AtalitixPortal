'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Buton, Girdi } from '@/components/arayuz'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations'
import { createBrowserClient } from '@/lib/supabase'
import { UYGULAMA_URL } from '@/lib/constants'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null)
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${UYGULAMA_URL}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setServerError('Bir hata oluştu. Lütfen tekrar deneyin.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div>
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">E-posta gönderildi</h2>
          <p className="text-slate-400 mt-2">
            <span className="text-slate-200 font-medium">{getValues('email')}</span> adresine
            şifre sıfırlama bağlantısı gönderdik. Gelen kutunuzu ve spam klasörünüzü kontrol edin.
          </p>
        </div>

        <Link href="/giris">
          <Buton varyant="secondary" className="w-full">
            Giriş sayfasına dön
          </Buton>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Şifremi unuttum</h2>
        <p className="text-slate-400 mt-1">
          E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Girdi
          etiket="E-posta"
          type="email"
          placeholder="ahmet@sirket.com"
          hata={errors.email?.message}
          {...register('email')}
        />

        {serverError && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {serverError}
          </p>
        )}

        <Buton type="submit" yukleniyorMu={isSubmitting} className="w-full mt-2">
          Sıfırlama bağlantısı gönder
        </Buton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Şifrenizi hatırladınız mı?{' '}
        <Link href="/giris" className="text-blue-400 hover:text-blue-300 font-medium">
          Giriş yapın
        </Link>
      </p>
    </div>
  )
}
