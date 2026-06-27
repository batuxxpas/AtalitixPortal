-- ==============================================================================
-- Şirketler Tablosu ve Değerlendirmeler Güncelleme SQL Kodları
-- Bu kodları Supabase SQL Editörüne yapıştırıp "RUN" diyerek çalıştırabilirsiniz.
-- ==============================================================================

-- 1. Şirketler tablosunun oluşturulması
CREATE TABLE IF NOT EXISTS sirketler (
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

-- 2. Profiller tablosuna sirket_id alanının eklenmesi (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiller' AND column_name='sirket_id') THEN
        ALTER TABLE profiller ADD COLUMN sirket_id UUID REFERENCES sirketler(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Değerlendirmeler tablosuna sirket_id alanının eklenmesi (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='degerlendirmeler' AND column_name='sirket_id') THEN
        ALTER TABLE degerlendirmeler ADD COLUMN sirket_id UUID REFERENCES sirketler(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. RLS (Row Level Security) ayarları
ALTER TABLE sirketler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sirketler access" ON sirketler FOR ALL USING (true);

-- 5. Trigger ayarı (guncellenme_tarihi için)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_guncellenme_tarihi_sirketler') THEN
        CREATE TRIGGER set_guncellenme_tarihi_sirketler
        BEFORE UPDATE ON sirketler
        FOR EACH ROW
        EXECUTE FUNCTION update_guncellenme_tarihi();
    END IF;
END $$;
