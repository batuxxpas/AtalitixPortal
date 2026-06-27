/**
 * Uygulama Tip Tanımları
 *
 * database.types.ts → Supabase'den otomatik üretilen ham tipler
 * Bu dosya   → Uygulama genelinde kullanılan iş mantığı tipleri
 *
 * Yeni tablo eklendiğinde:
 *   1. database.types.ts dosyasına ham tipleri ekle
 *   2. Bu dosyaya iş mantığı tipini ekle
 */

// Ham veritabanı tipleri (Supabase şemasından türetilir)
export type { Database, Json, UserRole, AssessmentStatus, QuestionType } from './database.types'
import type { UserRole, AssessmentStatus, QuestionType } from './database.types'

// ─── Profil ───────────────────────────────────────────────────────────────────

export type Profil = {
  id: string
  email: string
  tam_ad: string | null
  avatar_url: string | null
  rol: UserRole
  sirket_id: string | null
  olusturulma: string
  guncellenme: string
}

// ─── Şirket ───────────────────────────────────────────────────────────────────

export type Sirket = {
  id: string
  ad: string
  slug: string
  sektor: string | null
  buyukluk: string | null
  ulke: string | null
  sehir: string | null
  website: string | null
  logo_url: string | null
  aciklama: string | null
  aktif: boolean
  olusturulma: string
  guncellenme: string
}

// ─── Soru Kategorisi ──────────────────────────────────────────────────────────

export type SoruKategorisi = {
  id: string
  ad: string
  slug: string
  aciklama: string | null
  ikon: string | null
  sira: number
  agirlik: number
  aktif: boolean
  olusturulma: string
}

// ─── Soru ─────────────────────────────────────────────────────────────────────

export type Soru = {
  id: string
  kategori_id: string
  kod?: string
  metin: string
  aciklama: string | null
  tur: QuestionType
  agirlik: number
  sira: number
  zorunlu: boolean
  aktif: boolean
  meta: Record<string, unknown> | null
  olusturulma: string
  guncellenme: string
  secenekler?: SoruSecenegi[]
  kategori?: SoruKategorisi
}

// ─── Soru Seçeneği ────────────────────────────────────────────────────────────

export type SoruSecenegi = {
  id: string
  soru_id: string
  metin: string
  deger: number
  sira: number
  olusturulma: string
}

// ─── Değerlendirme ────────────────────────────────────────────────────────────

export type Degerlendirme = {
  id: string
  sirket_id: string
  olusturan: string
  baslik: string
  durum: AssessmentStatus
  baslangi: string | null
  tamamlanma: string | null
  meta: Record<string, unknown> | null
  olusturulma: string
  guncellenme: string
  sirket?: Sirket
  sonuc?: DegerlendirmeSonucu
}

// ─── Değerlendirme Cevabı ─────────────────────────────────────────────────────

export type DegerlendirmeCevabi = {
  id: string
  degerlendirme_id: string
  soru_id: string
  secilen_secenek_idleri: string[] | null
  metin_cevap: string | null
  sayisal_cevap: number | null
  olusturulma: string
  guncellenme: string
}

// ─── ERP Çözümü ──────────────────────────────────────────────────────────────

export type ErpCozumu = {
  id: string
  ad: string
  slug: string
  firma: string
  aciklama: string | null
  logo_url: string | null
  website: string | null
  katman: string | null       // tier1 | tier2 | tier3
  uygun_buyuklukler: string[] | null
  uygun_sektorler: string[] | null
  ozellikler: Record<string, unknown> | null
  fiyatlandirma: string | null
  aktif: boolean
  olusturulma: string
  guncellenme: string
}

export interface KuralKosul {
  soru_kodu?: string
  operator?: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
  deger?: any
  kural_tipi?: 'baslangic'
}

export interface KuralKosulGrubu {
  mantik?: 'AND' | 'OR'
  kosullar: KuralKosul[]
}

export interface Kural {
  id: string
  kural_kodu: string
  tetikleyici_kosullar: KuralKosulGrubu
  acilacak_sorular: string[]
  kapanacak_sorular: string[]
  oneri_etkisine_katkisi?: string
  platform_notu?: string
  aktif_mi: boolean
}

// ─── Değerlendirme Sonucu ─────────────────────────────────────────────────────

/** Tek bir kategoriye ait skor bilgisi */
export type KategoriSkoru = {
  kategori_id: string
  kategori_adi: string
  skor: number
  maks_skor: number
  yuzde: number
  cevaplanan: number
  toplam_soru: number
  yorum: string
}

/** Önerilem ERP çözümü ve uyum bilgisi */
export type Onerilen = {
  cozum_id: string
  cozum_adi: string
  firma: string
  slug: string
  katman: string
  logo_url: string | null
  /** Uyum skoru (0–100) */
  uyum_skoru: number
  /** UI gösterimi için yüzde (uyum_skoru ile aynı) */
  uyum_yuzdesi: number
  /** Uyum gerekçeleri */
  gerekce_listesi: string[]
}

/** Bir değerlendirmenin tüm analiz sonuçları */
export type DegerlendirmeSonucu = {
  id: string
  degerlendirme_id: string
  toplam_skor: number
  kategori_skorlari: KategoriSkoru[]
  onerilen_cozumler: Onerilen[]
  fitscan_verisi?: {
    skor: number
    erpHazirlikSkoru: number
    cevaplanmaOrani: number
    anaYonlendirme: string
    bandYorumu: string
    isKritik: boolean
  } | null
  analiz_ozeti: string | null
  atalitix_yorumu: string | null
  uretilme_zamani: string
  olusturulma: string
}

// ─── UI Tipleri ───────────────────────────────────────────────────────────────

export type NavigasyonOgesi = {
  etiket: string
  hedef: string
  ikon?: string
  rozet?: string | number
  altOgeler?: NavigasyonOgesi[]
}

export type IcerikYoluOgesi = {
  etiket: string
  hedef?: string
}

export type TabloSutunu<T> = {
  anahtar: keyof T | string
  etiket: string
  siralanabilir?: boolean
  render?: (deger: unknown, satir: T) => React.ReactNode
  sinifAdi?: string
}

export type SayfalamaDurumu = {
  sayfa: number
  sayfaBoyutu: number
  toplam: number
}

export type SiralamaDurumu = {
  alan: string
  yon: 'asc' | 'desc'
}

export type FiltreDurumu = Record<string, string | number | boolean | null>

// ─── API Yanıt Tipleri ────────────────────────────────────────────────────────

export type ApiYaniti<T> = {
  veri: T | null
  hata: string | null
  basarili: boolean
}

export type SayfalamaYaniti<T> = {
  veri: T[]
  sayfalama: SayfalamaDurumu
  hata: string | null
  basarili: boolean
}
