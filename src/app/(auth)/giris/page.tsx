'use client'

/**
 * Giriş Sayfası
 *
 * useSearchParams() kullandığından Suspense boundary içinde olması gerekir.
 * LoginFormu bileşeni asıl formu içerir, LoginPage ise Suspense wrapper'ıdır.
 */

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Buton, Girdi } from '@/components/arayuz'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { createBrowserClient } from '@/lib/supabase'

// ─── Form Bileşeni (useSearchParams kullanan kısım) ───────────────────────────

function GirisFormu() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const yonlendirilecekSayfa = searchParams.get('redirectTo') ?? '/dashboard'
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setSunucuHatasi(null)
    const supabase = createBrowserClient()

    // 1. Supabase Auth (Kimlik Doğrulama) Kontrolü
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setSunucuHatasi('E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
      return
    }

    // 2. Tablo (Veritabanı) Kontrolü - Güvenlik Açığı Kapatması
    // Supabase Auth'da kayıtlı olsa bile, bizim profiller tablomuzda yoksa içeri almıyoruz.
    if (authData.user) {
      const { data: profilData } = await supabase
        .from('profiller')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!profilData) {
        // Tabloda yoksa çıkış yaptır ve hata ver
        await supabase.auth.signOut()
        setSunucuHatasi('Veritabanında bu hesaba ait bir profil bulunamadı. Lütfen yeni kayıt oluşturun.')
        return
      }
    }

    router.push(yonlendirilecekSayfa)
    router.refresh()
  }

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_4px_24px_rgba(10,25,69,0.05)] border border-slate-100 max-w-md w-full mx-auto">
      <div className="mb-8 flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-[#0a1945]">Hoş Geldiniz</h2>
        <p className="text-slate-500 mt-2">Hesabınıza giriş yapın</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Girdi
          etiket="E-posta"
          type="email"
          placeholder="ahmet@sirket.com"
          hata={errors.email?.message}
          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
          {...register('email')}
        />
        <div>
          <Girdi
            etiket="Şifre"
            type="password"
            placeholder="••••••••"
            hata={errors.password?.message}
            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
            {...register('password')}
          />
          <div className="flex items-center justify-end mt-2">
            <Link href="/sifremi-unuttum" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Şifremi unuttum
            </Link>
          </div>
        </div>

        {sunucuHatasi && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {sunucuHatasi}
          </div>
        )}

        <Buton type="submit" yukleniyorMu={isSubmitting} className="w-full mt-2 bg-[#0a1945] hover:bg-[#152a6b] text-white rounded-xl py-6">
          Giriş Yap
        </Buton>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Hesabınız yok mu?{' '}
        <Link href="/kayit" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
          Kayıt Ol
        </Link>
      </p>
    </div>
  )
}

// ─── Sayfa — Suspense Wrapper ─────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse w-full max-w-md h-96 bg-white rounded-2xl shadow-sm" />}>
      <GirisFormu />
    </Suspense>
  )
}
