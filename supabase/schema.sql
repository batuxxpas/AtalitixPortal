-- ─── EXTENSIONS ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Şirketler ──────────────────────────────
CREATE TABLE sirketler (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad TEXT NOT NULL,
  sektor TEXT,
  calisan_sayisi TEXT,
  yillik_ciro TEXT,
  vkn TEXT,
  yetkili_isim TEXT,
  yetkili_email TEXT,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Profiller ──────────────────────────────
CREATE TABLE profiller (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  sirket_id UUID REFERENCES sirketler(id) ON DELETE SET NULL,
  tam_ad TEXT,
  rol TEXT,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Değerlendirmeler ───────────────────────
CREATE TABLE degerlendirmeler (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sirket_id UUID REFERENCES sirketler(id) ON DELETE CASCADE,
  olusturan_id UUID REFERENCES profiller(id) ON DELETE SET NULL,
  baslik TEXT NOT NULL,
  tip TEXT NOT NULL DEFAULT 'erp',  -- erp | yapay_zeka (ileride genisletilebilir)
  durum TEXT NOT NULL DEFAULT 'draft',
  guncel_kategori_sirasi INTEGER DEFAULT 0,
  tamamlanma_tarihi TIMESTAMPTZ,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Soru Kategorileri ──────────────────────
CREATE TABLE soru_kategorileri (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  aciklama TEXT,
  ikon TEXT,
  sira INTEGER NOT NULL,
  agirlik DECIMAL(3,2) DEFAULT 1.0,
  aktif_mi BOOLEAN DEFAULT true
);

-- ─── Sorular ────────────────────────────────
CREATE TABLE sorular (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kategori_id UUID REFERENCES soru_kategorileri(id) ON DELETE CASCADE,
  kod TEXT UNIQUE,
  metin TEXT NOT NULL,
  aciklama TEXT,
  tip TEXT NOT NULL DEFAULT 'single_choice',
  agirlik INTEGER DEFAULT 1,
  zorunlu_mu BOOLEAN DEFAULT true,
  sira INTEGER NOT NULL,
  aktif_mi BOOLEAN DEFAULT true
);

-- ─── Soru Seçenekleri ───────────────────────
CREATE TABLE soru_secenekleri (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  soru_id UUID REFERENCES sorular(id) ON DELETE CASCADE,
  metin TEXT NOT NULL,
  deger INTEGER NOT NULL,
  sira INTEGER NOT NULL
);

-- ─── Değerlendirme Cevapları ────────────────
CREATE TABLE degerlendirme_cevaplari (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  degerlendirme_id UUID REFERENCES degerlendirmeler(id) ON DELETE CASCADE,
  soru_id UUID REFERENCES sorular(id) ON DELETE CASCADE,
  secenek_idleri UUID[],
  metin_degeri TEXT,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(degerlendirme_id, soru_id)
);

-- ─── ERP Çözümleri ──────────────────────────
CREATE TABLE erp_cozumleri (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad TEXT NOT NULL,
  satici TEXT,
  slug TEXT NOT NULL UNIQUE,
  aciklama TEXT,
  logo_url TEXT,
  websitesi TEXT,
  seviye TEXT,
  uygun_olcekler TEXT[],
  uygun_sektorler TEXT[],
  ozellikler JSONB,
  fiyatlandirma_modeli TEXT,
  aktif_mi BOOLEAN DEFAULT true,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Değerlendirme Sonuçları ────────────────
CREATE TABLE degerlendirme_sonuclari (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  degerlendirme_id UUID NOT NULL REFERENCES degerlendirmeler(id) ON DELETE CASCADE UNIQUE,
  toplam_puan DECIMAL(5,2) NOT NULL DEFAULT 0,
  kategori_puanlari JSONB NOT NULL DEFAULT '[]',
  onerilen_cozumler jsonb NOT NULL,
  fitscan_verisi jsonb,
  analiz_ozeti text,
  atalitix_yorumu text,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Kurallar ───────────────────────────────
CREATE TABLE kurallar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kural_kodu TEXT UNIQUE NOT NULL,
  tetikleyici_kosullar JSONB,
  acilacak_sorular TEXT[],
  kapanacak_sorular TEXT[],
  oneri_etkisine_katkisi TEXT,
  platform_notu TEXT,
  aktif_mi BOOLEAN DEFAULT true,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- ─── İndeksler ──────────────────────────────
CREATE INDEX idx_profiller_sirket_id ON profiller(sirket_id);
CREATE INDEX idx_degerlendirmeler_sirket_id ON degerlendirmeler(sirket_id);
CREATE INDEX idx_degerlendirmeler_olusturan_id ON degerlendirmeler(olusturan_id);
CREATE INDEX idx_degerlendirmeler_durum ON degerlendirmeler(durum);
CREATE INDEX idx_sorular_kategori_id ON sorular(kategori_id);
CREATE INDEX idx_degerlendirme_cevaplari_degerlendirme_id ON degerlendirme_cevaplari(degerlendirme_id);

-- ─── Triggers: guncellenme_tarihi ───────────
CREATE OR REPLACE FUNCTION update_guncellenme_tarihi()
RETURNS TRIGGER AS $$
BEGIN NEW.guncellenme_tarihi = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_guncellenme_tarihi_sirketler BEFORE UPDATE ON sirketler FOR EACH ROW EXECUTE FUNCTION update_guncellenme_tarihi();
CREATE TRIGGER set_guncellenme_tarihi_profiller BEFORE UPDATE ON profiller FOR EACH ROW EXECUTE FUNCTION update_guncellenme_tarihi();
CREATE TRIGGER set_guncellenme_tarihi_degerlendirmeler BEFORE UPDATE ON degerlendirmeler FOR EACH ROW EXECUTE FUNCTION update_guncellenme_tarihi();
CREATE TRIGGER set_guncellenme_tarihi_degerlendirme_cevaplari BEFORE UPDATE ON degerlendirme_cevaplari FOR EACH ROW EXECUTE FUNCTION update_guncellenme_tarihi();
CREATE TRIGGER set_guncellenme_tarihi_erp_cozumleri BEFORE UPDATE ON erp_cozumleri FOR EACH ROW EXECUTE FUNCTION update_guncellenme_tarihi();
CREATE TRIGGER set_guncellenme_tarihi_kurallar BEFORE UPDATE ON kurallar FOR EACH ROW EXECUTE FUNCTION update_guncellenme_tarihi();

-- ─── Triggers: Otomatik Profil ve Şirket Oluşturma ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_sirket_id UUID;
BEGIN
  IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    -- Admin panelinden oluşturulan müşteri (var olan şirkete atanıyor)
    new_sirket_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
  ELSE
    -- Eskiden kalan veya farklı yolla oluşturulan hesaplar için (fallback)
    INSERT INTO public.sirketler (ad, yetkili_isim, yetkili_email)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Bilinmeyen Şirket'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Yetkili'),
      NEW.email
    )
    RETURNING id INTO new_sirket_id;
  END IF;

  -- Sonra profili oluştur ve auth.users id'sine bağla
  INSERT INTO public.profiller (id, sirket_id, tam_ad, rol)
  VALUES (
    NEW.id,
    new_sirket_id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user') -- Müşteriler 'user' olacak
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ─── RLS (Row Level Security) ────────────────
ALTER TABLE sirketler ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiller ENABLE ROW LEVEL SECURITY;
ALTER TABLE degerlendirmeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE soru_kategorileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorular ENABLE ROW LEVEL SECURITY;
ALTER TABLE soru_secenekleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE degerlendirme_cevaplari ENABLE ROW LEVEL SECURITY;
ALTER TABLE degerlendirme_sonuclari ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cozumleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurallar ENABLE ROW LEVEL SECURITY;

-- ─── Policy'ler (Geliştirme için geçici açık)
CREATE POLICY "Public sirketler access" ON sirketler FOR ALL USING (true);
CREATE POLICY "Public profiller access" ON profiller FOR ALL USING (true);
CREATE POLICY "Public degerlendirmeler access" ON degerlendirmeler FOR ALL USING (true);
CREATE POLICY "Public soru_kategorileri access" ON soru_kategorileri FOR ALL USING (true);
CREATE POLICY "Public sorular access" ON sorular FOR ALL USING (true);
CREATE POLICY "Public soru_secenekleri access" ON soru_secenekleri FOR ALL USING (true);
CREATE POLICY "Public degerlendirme_cevaplari access" ON degerlendirme_cevaplari FOR ALL USING (true);
CREATE POLICY "Public degerlendirme_sonuclari access" ON degerlendirme_sonuclari FOR ALL USING (true);
CREATE POLICY "Public erp_cozumleri access" ON erp_cozumleri FOR ALL USING (true);
CREATE POLICY "Public kurallar access" ON kurallar FOR ALL USING (true);

