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
    COALESCE(NEW.raw_user_meta_data->>'role', 'user') -- Müşteriler 'user' olacak, biz admin atayacağız
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
