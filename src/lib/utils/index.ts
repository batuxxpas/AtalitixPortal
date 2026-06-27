/**
 * Yardımcı Fonksiyonlar
 *
 * Uygulama genelinde kullanılan küçük, saf (pure) fonksiyonlar.
 * Hiçbir dış bağımlılık yoktur — sadece standart JS API'leri kullanılır.
 */

import { type ClassValue, clsx } from 'clsx'

// ─── CSS Sınıfı Birleştirme ───────────────────────────────────────────────────

/**
 * CSS sınıflarını koşullu olarak birleştirir.
 * clsx tabanlıdır, Tailwind ile tam uyumludur.
 *
 * @example cn('text-sm', isActive && 'text-blue-400', 'font-medium')
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ─── Tarih Biçimlendirme ─────────────────────────────────────────────────────

/**
 * Tarihi Türkçe uzun biçimde gösterir.
 * @example formatDate('2024-01-15') → '15 Ocak 2024'
 */
export function formatDate(tarih: string | Date, dil = 'tr-TR'): string {
  return new Intl.DateTimeFormat(dil, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(tarih))
}

/**
 * Tarihi ve saati Türkçe biçimde gösterir.
 * @example formatDateTime('2024-01-15T14:30:00') → '15 Ocak 2024, 14:30'
 */
export function formatDateTime(tarih: string | Date, dil = 'tr-TR'): string {
  return new Intl.DateTimeFormat(dil, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(tarih))
}

/**
 * Göreceli zaman gösterir.
 * @example formatRelativeTime('2024-01-14') → '1 gün önce'
 */
export function formatRelativeTime(tarih: string | Date, dil = 'tr'): string {
  const rtf = new Intl.RelativeTimeFormat(dil, { numeric: 'auto' })
  const simdi = Date.now()
  const fark = new Date(tarih).getTime() - simdi

  const saniye = Math.round(fark / 1000)
  const dakika = Math.round(saniye / 60)
  const saat = Math.round(dakika / 60)
  const gun = Math.round(saat / 24)

  if (Math.abs(saniye) < 60) return rtf.format(saniye, 'second')
  if (Math.abs(dakika) < 60) return rtf.format(dakika, 'minute')
  if (Math.abs(saat) < 24) return rtf.format(saat, 'hour')
  return rtf.format(gun, 'day')
}

// ─── Metin İşleme ─────────────────────────────────────────────────────────────

/**
 * Metni URL-dostu slug'a dönüştürür. Türkçe karakterleri dönüştürür.
 * @example slugify('Üretim & Lojistik') → 'uretim-lojistik'
 */
export function slugify(metin: string): string {
  return metin
    .toLowerCase()
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[şŞ]/g, 's')
    .replace(/[üÜ]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Metni belirtilen uzunlukta keser ve '...' ekler.
 * @example truncate('Uzun bir metin', 10) → 'Uzun bir...'
 */
export function truncate(metin: string, uzunluk: number): string {
  if (metin.length <= uzunluk) return metin
  return `${metin.slice(0, uzunluk)}...`
}

// ─── Sayı Biçimlendirme ───────────────────────────────────────────────────────

/**
 * Sayıyı yüzde olarak biçimlendirir.
 * @example formatPercentage(85.5) → '%85.5'
 */
export function formatPercentage(deger: number, ondalik = 1): string {
  return `%${deger.toFixed(ondalik)}`
}

/**
 * Skoru 'X / Y' formatında gösterir.
 * @example formatScore(75, 100) → '75 / 100'
 */
export function formatScore(skor: number, maksimum: number): string {
  return `${skor} / ${maksimum}`
}

// ─── Ad / Avatar Yardımcıları ─────────────────────────────────────────────────

/**
 * Ad soyaddan baş harfleri çıkarır (maksimum 2 karakter).
 * @example getInitials('Ahmet Yılmaz') → 'AY'
 */
export function getInitials(ad: string): string {
  return ad
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Genel Yardımcılar ────────────────────────────────────────────────────────

/**
 * Basit benzersiz ID üretir (kriptografik değil, sadece UI için).
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Fonksiyon çağrısını geciktirir (debounce).
 * Arama kutusu, otomatik kaydetme gibi yerlerde kullanılır.
 *
 * @param fn      Geciktirilecek fonksiyon
 * @param gecikme Milisaniye cinsinden bekleme süresi
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  gecikme: number
): (...args: Parameters<T>) => void {
  let zamanlayici: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(zamanlayici)
    zamanlayici = setTimeout(() => fn(...args), gecikme)
  }
}
