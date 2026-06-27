-- 1. Yetkiler kolonunu profiller tablosuna ekle
ALTER TABLE profiller 
ADD COLUMN IF NOT EXISTS  yetkiler JSONB DEFAULT '{"superadmin": false, "sirket_yonetimi": false, "rapor_goruntuleme": true, "soru_yonetimi": false, "yorum_yonetimi": false}'::jsonb;

-- 2. handle_new_user trigger'ını güncelle
-- Eğer kullanıcı "iç çalışan" olarak işaretlendiyse şirket oluşturma
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_sirket_id UUID := NULL;
BEGIN
  -- Eğer iç çalışan (admin panelinden kullanıcı olarak eklendiyse), şirket atama (NULL kalır)
  IF NEW.raw_user_meta_data->>'is_internal' = 'true' THEN
    new_sirket_id := NULL;
  
  -- Yoksa, belirli bir şirkete ait müşteri hesabıdır
  ELSIF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    new_sirket_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
  
  -- Siteden kendi kendine kayıt olan fallback
  ELSE
    INSERT INTO public.sirketler (ad, yetkili_isim, yetkili_email)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Bilinmeyen Şirket'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Yetkili'),
      NEW.email
    )
    RETURNING id INTO new_sirket_id;
  END IF;

  -- Profili oluştur
  INSERT INTO public.profiller (id, sirket_id, tam_ad, rol, yetkiler)
  VALUES (
    NEW.id,
    new_sirket_id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.raw_user_meta_data->>'yetkiler')::jsonb, '{"sirket_yonetimi": false, "degerlendirme_yonetimi": false, "soru_yonetimi": false}'::jsonb)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Batuhan Gökçe'yi (mevcut admini) tam yetkili yap (İsteğe bağlı, zaten rol = superadmin ise yetki her türlü tamdır ama metadata'ya da atalım garanti olsun)
UPDATE profiller 
SET yetkiler = '{"sirket_yonetimi": true, "degerlendirme_yonetimi": true, "soru_yonetimi": true}'::jsonb,
    rol = 'superadmin'
WHERE rol = 'superadmin';
