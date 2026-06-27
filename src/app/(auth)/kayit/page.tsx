'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Buton, Girdi } from '@/components/arayuz'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { createBrowserClient } from '@/lib/supabase'

export default function KayitPage() {
  const router = useRouter()
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null)
  const [basarili, setBasarili] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterInput) {
    setSunucuHatasi(null)
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          company_name: data.company_name,
          role: 'superadmin' // Yeni açılan ilk kayıtları yönetici olarak başlatıyoruz
        },
      },
    })

    if (error) {
      setSunucuHatasi(error.message)
      return
    }

    setBasarili(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  if (basarili) {
    return (
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_4px_24px_rgba(10,25,69,0.05)] border border-slate-100 max-w-md w-full mx-auto text-center">
        <h2 className="text-2xl font-bold text-emerald-600 mb-4">Kayıt Başarılı!</h2>
        <p className="text-slate-600">
          Hesabınız oluşturuldu. Sisteme yönlendiriliyorsunuz...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_4px_24px_rgba(10,25,69,0.05)] border border-slate-100 max-w-md w-full mx-auto">
      <div className="mb-8 flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-[#0a1945]">Hesap Oluşturun</h2>
        <p className="text-slate-500 mt-2">Sistemi kullanmaya başlamak için kayıt olun</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Girdi
          etiket="Ad Soyad"
          type="text"
          placeholder="Ad Soyad"
          hata={errors.full_name?.message}
          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
          {...register('full_name')}
        />
        <Girdi
          etiket="Şirket Adı"
          type="text"
          placeholder="Şirket Adı"
          hata={errors.company_name?.message}
          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
          {...register('company_name')}
        />
        <Girdi
          etiket="E-posta"
          type="email"
          placeholder="ahmet@sirket.com"
          hata={errors.email?.message}
          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
          {...register('email')}
        />
        <Girdi
          etiket="Şifre"
          type="password"
          placeholder="••••••••"
          hata={errors.password?.message}
          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
          {...register('password')}
        />
        <Girdi
          etiket="Şifre Tekrar"
          type="password"
          placeholder="••••••••"
          hata={errors.confirmPassword?.message}
          className="bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
          {...register('confirmPassword')}
        />

        {sunucuHatasi && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {sunucuHatasi}
          </div>
        )}

        <Buton type="submit" yukleniyorMu={isSubmitting} className="w-full mt-2 bg-[#0a1945] hover:bg-[#152a6b] text-white rounded-xl py-6">
          Kayıt Ol
        </Buton>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Zaten hesabınız var mı?{' '}
        <Link href="/giris" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
          Giriş Yap
        </Link>
      </p>
    </div>
  )
}
