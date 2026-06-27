/**
 * Uygulama Sabitleri
 *
 * Tüm magic string'ler ve sabit değerler bu dosyada tanımlanır.
 * Yeni tablo / özellik eklendikçe ilgili sabitin buraya eklenmesi gerekir.
 */

// ─── Uygulama Bilgileri ───────────────────────────────────────────────────────

export const UYGULAMA_ADI = 'Atalitix Portal'
export const UYGULAMA_ACIKLAMASI = 'Şirketinize en uygun ERP çözümünü keşfedin'
export const UYGULAMA_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.atalitix.com'

// ─── Rotalar ──────────────────────────────────────────────────────────────────

export const ROTALAR = {
  // Genel
  anasayfa: '/',
  // Auth
  giris: '/giris',
  kayit: '/kayit',
  sifremiUnuttum: '/sifremi-unuttum',
  authCallback: '/auth/callback',
  // Portal (kullanıcı)
  panel: '/dashboard',
  degerlendirme: (id: string) => `/degerlendirme/${id}`,
  sonuclar: (id: string) => `/results/${id}`,
  // Admin
  adminPanel: '/yonetici/panel',
  adminSirketler: '/yonetici/sirketler',
  adminDegerlendirmeler: '/yonetici/degerlendirmeler',
  adminSorular: '/yonetici/sorular',
  adminKullanicilar: '/yonetici/kullanicilar',
} as const

// ─── Değerlendirme Tipleri ────────────────────────────────────────────────────

/** Desteklenen degerlendirme tipleri ve UI bilgileri */
export const DEGERLENDIRME_TIPLERI: Record<string, { etiket: string; aciklama: string; aktif: boolean }> = {
  erp: {
    etiket: 'ERP Değerlendirmesi',
    aciklama: 'Şirketinize en uygun ERP çözümünü belirleyin',
    aktif: true,
  },
  yapay_zeka: {
    etiket: 'Yapay Zeka Entegrasyonu',
    aciklama: 'AI entegrasyon olgunluğunuzu ölçün',
    aktif: false,
  },
}

// ─── Değerlendirme Durumu ─────────────────────────────────────────────────────

/** Değerlendirme durumu Türkçe etiketleri */
export const DEGERLENDIRME_DURUM_ETIKETLERI: Record<string, string> = {
  draft: 'Taslak',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  archived: 'Arşivlendi',
}

/** Değerlendirme durumu Tailwind renk sınıfları */
export const DEGERLENDIRME_DURUM_RENKLERI: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-400/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  completed: 'text-emerald-400 bg-emerald-400/10',
  archived: 'text-amber-400 bg-amber-400/10',
}

// ─── Şirket Büyüklüğü ────────────────────────────────────────────────────────

/** Şirket büyüklüğü seçenekleri (dropdown için) */
export const SIRKET_BUYUKLUKLERI = [
  { deger: 'micro',      etiket: 'Mikro (1–10 çalışan)' },
  { deger: 'small',      etiket: 'Küçük (11–50 çalışan)' },
  { deger: 'medium',     etiket: 'Orta (51–250 çalışan)' },
  { deger: 'large',      etiket: 'Büyük (251–1.000 çalışan)' },
  { deger: 'enterprise', etiket: 'Kurumsal (1.000+ çalışan)' },
] as const

// ─── Sektörler ────────────────────────────────────────────────────────────────

/** Sektör seçenekleri (dropdown için) */
export const SEKTORLER = [
  { deger: 'manufacturing',  etiket: 'Üretim' },
  { deger: 'retail',         etiket: 'Perakende' },
  { deger: 'wholesale',      etiket: 'Toptan Ticaret' },
  { deger: 'logistics',      etiket: 'Lojistik ve Taşımacılık' },
  { deger: 'construction',   etiket: 'İnşaat' },
  { deger: 'healthcare',     etiket: 'Sağlık' },
  { deger: 'education',      etiket: 'Eğitim' },
  { deger: 'finance',        etiket: 'Finans ve Bankacılık' },
  { deger: 'it_services',    etiket: 'BT Hizmetleri' },
  { deger: 'food_beverage',  etiket: 'Gıda ve İçecek' },
  { deger: 'textile',        etiket: 'Tekstil' },
  { deger: 'other',          etiket: 'Diğer' },
] as const

// ─── ERP Katmanları ───────────────────────────────────────────────────────────

/**
 * ERP çözüm katmanları.
 * Tier 1: Kurumsal (SAP, Oracle)
 * Tier 2: Orta ölçekli (Microsoft Dynamics, IFS)
 * Tier 3: KOBİ (Logo, Mikro)
 */
export const ERP_KATMANLARI = {
  tier1: { etiket: 'Tier 1 — Kurumsal',   renk: 'text-purple-400 bg-purple-400/10' },
  tier2: { etiket: 'Tier 2 — Orta Ölçek', renk: 'text-blue-400 bg-blue-400/10' },
  tier3: { etiket: 'Tier 3 — KOBİ',       renk: 'text-emerald-400 bg-emerald-400/10' },
} as const

// ─── Sayfalama ────────────────────────────────────────────────────────────────

export const VARSAYILAN_SAYFA_BOYUTU = 20
export const SAYFA_BOYUTU_SECENEKLERI = [10, 20, 50, 100]

// ─── Skor Aralıkları ──────────────────────────────────────────────────────────

/**
 * ERP Hazırlık Skoru aralıkları.
 * Toplam skor 0–100 arasındadır.
 */
export const SKOR_ARALIKLARI = [
  { min: 0,  max: 25,  etiket: 'Başlangıç Seviyesi', renk: '#ef4444' },
  { min: 25, max: 50,  etiket: 'Gelişmekte',          renk: '#f97316' },
  { min: 50, max: 75,  etiket: 'Orta Seviye',          renk: '#eab308' },
  { min: 75, max: 90,  etiket: 'İleri Seviye',         renk: '#22c55e' },
  { min: 90, max: 100, etiket: 'Uzman Seviye',         renk: '#3b82f6' },
] as const
