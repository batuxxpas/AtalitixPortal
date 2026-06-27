import re

with open('supabase/seed.sql', 'r') as f:
    seed = f.read()

# Update questions schema
seed = seed.replace('(id, kategori_id, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi)', '(id, kategori_id, kod, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi)')

# Inject 'Qx' before metin
def replace_q(match):
    replace_q.q_index += 1
    kod = f"Q{replace_q.q_index}"
    return f"('{match.group(1)}', '{match.group(2)}', '{kod}',\n   '{match.group(3)}',"
replace_q.q_index = 0

pattern = re.compile(r"\('([0-9a-f-]{36})', '([0-9a-f-]{36})',\s*\n\s*'((?:[^']|'')*)',")
seed = pattern.sub(replace_q, seed)

# Replace Q1 options using exact string
old_q1 = """  -- ── Q1: Ana faaliyet modeli
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','Tek faaliyet / basit ticaret veya hizmet',1,1),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000001','Karma yapı: üretim + ticaret veya proje + hizmet',3,2),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001','Çoklu iş modeli: üretim, servis, satış, proje, lojistik birlikte',5,3),"""

new_q1 = """  -- ── Q1: Ana faaliyet modeli
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','Hizmet / proje ağırlıklı, fiziksel stok ve üretim yok',1,1),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000001','Ticaret / dağıtım / bayi yapısı',2,2),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001','Üretim / montaj / proses / sanayi',3,3),
  ('00000000-0000-0000-0002-000000000262','00000000-0000-0000-0001-000000000001','Lojistik / depo operasyonu ağırlıklı',4,4),
  ('00000000-0000-0000-0002-000000000263','00000000-0000-0000-0001-000000000001','Karma yapı: üretim + ticaret + servis + proje',5,5),"""

seed = seed.replace(old_q1, new_q1)

# Append rules inserts
rules_insert = """

-- ──────────────────────────────────────────────────────────────────────────────
-- KURALLAR
-- ──────────────────────────────────────────────────────────────────────────────
TRUNCATE TABLE kurallar CASCADE;
INSERT INTO kurallar (kural_kodu, tetikleyici_kosullar, acilacak_sorular, kapanacak_sorular, oneri_etkisine_katkisi, platform_notu) VALUES
('R00', '{"kosullar": [{"kural_tipi": "baslangic"}]}'::jsonb, ARRAY['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16','Q17','Q18','Q19','Q20','Q21','Q22','Q23','Q24','Q25','Q26','Q27','Q28','Q29','Q30', 'Q36','Q37','Q38','Q39','Q40', 'Q75','Q76','Q77', 'Q80', 'Q83','Q84','Q85','Q86','Q87'], ARRAY[]::text[], 'Temel skor ölçülür.', 'Minimum MVP soru seti.'),
('R01', '{"kosullar": [{"soru_kodu": "Q1", "operator": "eq", "deger": 1}]}'::jsonb, ARRAY['Q31','Q32','Q33','Q34','Q35', 'Q36','Q37','Q38','Q39','Q40','Q41','Q42','Q43','Q44','Q45','Q46','Q47', 'Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84','Q85','Q86','Q87'], ARRAY['Q52','Q53','Q54','Q55','Q56','Q57','Q58','Q59','Q60','Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68','Q69','Q70','Q71','Q72','Q73','Q74'], 'Odoo/özel yazılım/BI/AI olasılığı artar; Üretim ERP skoru düşer.', 'Hizmet firmalarında üretim/depo soruları kullanıcıyı yormamalı.'),
('R02', '{"kosullar": [{"soru_kodu": "Q1", "operator": "eq", "deger": 2}]}'::jsonb, ARRAY['Q43','Q44','Q45','Q46','Q47','Q48','Q49','Q50','Q51','Q52','Q53','Q54','Q55','Q56','Q57','Q58','Q59', 'Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84','Q85','Q86','Q87', 'Q36','Q37','Q38','Q39','Q40','Q41','Q42'], ARRAY['Q60','Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68'], 'Logo/Odoo/Canias veya ERP+WMS/portal senaryoları öne çıkar.', 'Satış, stok, depo, fiyatlama ve e-ticaret soruları açılmalı.'),
('R03', '{"kosullar": [{"soru_kodu": "Q1", "operator": "eq", "deger": 3}]}'::jsonb, ARRAY['Q38', 'Q48','Q49','Q50','Q51','Q52','Q53','Q54','Q55','Q56','Q57','Q58','Q59','Q60','Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68','Q69','Q70','Q71','Q72','Q73','Q74', 'Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84','Q85','Q86','Q87'], ARRAY[]::text[], 'SAP/Canias güçlü aday olabilir; üretim, kalite, depo skoru yükselir.', 'Üretim firmalarında tam fonksiyonel derinlik gerekir.'),
('R04', '{"kosullar": [{"soru_kodu": "Q1", "operator": "eq", "deger": 4}]}'::jsonb, ARRAY['Q53','Q54','Q55','Q56','Q57','Q58','Q59', 'Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84', 'Q48','Q49','Q50','Q51'], ARRAY['Q60','Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68'], 'WMS, mobil depo, entegrasyon ve özel katman ihtimali yükselir.', 'Depo ve mobil operasyon modülü derin gösterilmeli.'),
('R05', '{"kosullar": [{"soru_kodu": "Q1", "operator": "eq", "deger": 5}]}'::jsonb, ARRAY['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16','Q17','Q18','Q19','Q20','Q21','Q22','Q23','Q24','Q25','Q26','Q27','Q28','Q29','Q30','Q31','Q32','Q33','Q34','Q35','Q36','Q37','Q38','Q39','Q40','Q41','Q42','Q43','Q44','Q45','Q46','Q47','Q48','Q49','Q50','Q51','Q52','Q53','Q54','Q55','Q56','Q57','Q58','Q59','Q60','Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68','Q69','Q70','Q71','Q72','Q73','Q74','Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84','Q85','Q86','Q87'], ARRAY[]::text[], 'SAP/Canias/hibrit mimari olasılığı yükselir.', 'Karma yapılarda tüm akış kontrollü açılmalı.'),
('R06', '{"mantik": "OR", "kosullar": [{"soru_kodu": "Q2", "operator": "gte", "deger": 3}, {"soru_kodu": "Q3", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q5','Q6', 'Q30', 'Q41', 'Q80','Q81','Q82','Q83','Q84', 'Q85','Q86','Q87'], ARRAY[]::text[], 'Kurumsal ölçek ve governance skoru yükselir; SAP/Canias değerlendirme listesine girer.', 'Büyük kullanıcı sayısı yetki, eğitim ve destek modelini zorunlu kılar.'),
('R07', '{"kosullar": [{"soru_kodu": "Q5", "operator": "eq", "deger": 1}]}'::jsonb, ARRAY['Q36','Q37','Q38','Q39','Q40'], ARRAY['Q41'], 'Tek şirketli yapı konsolidasyon ihtiyacını düşürür.', 'Q41 gereksizse kapatılarak akış kısaltılmalı.'),
('R08', '{"mantik": "OR", "kosullar": [{"soru_kodu": "Q5", "operator": "gte", "deger": 3}, {"soru_kodu": "Q6", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q41', 'Q51', 'Q80','Q81','Q82','Q83','Q84'], ARRAY[]::text[], 'Çok şirket/global yapı SAP ve kurumsal ERP ihtiyacını artırır.', 'IFRS, konsolidasyon yorumları açılmalı.'),
('R11', '{"kosullar": [{"soru_kodu": "Q18", "operator": "lte", "deger": 2}]}'::jsonb, ARRAY['Q22', 'Q75','Q76','Q77','Q78','Q79', 'Q80','Q81','Q82','Q83','Q84'], ARRAY[]::text[], 'ERP değişimi yerine optimizasyon, BI, entegrasyon veya otomasyon önerisi öne çıkar.', 'Mevcut ERP iyiyse öneri replace değil optimize & extend olmalı.'),
('R13', '{"mantik": "OR", "kosullar": [{"soru_kodu": "Q24", "operator": "gte", "deger": 3}, {"soru_kodu": "Q25", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q31','Q32','Q33','Q34','Q35', 'Q85','Q86','Q87'], ARRAY[]::text[], 'ERP seçimi öncesi süreç haritalama ve kavramsal tasarım ihtiyacı artar.', 'Düşük süreç olgunluğu varsa ERP önerisinden önce hazırlık öner.'),
('R14', '{"kosullar": [{"soru_kodu": "Q29", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q31','Q32','Q33','Q34','Q35'], ARRAY[]::text[], 'Canias/özel yazılım/hibrit mimari skoru artar.', 'Standart ERPye uymayan süreçler özel katman ihtiyacını doğurur.'),
('R15', '{"mantik": "AND", "kosullar": [{"soru_kodu": "Q31", "operator": "lte", "deger": 1}, {"soru_kodu": "Q29", "operator": "lte", "deger": 2}]}'::jsonb, ARRAY['Q36','Q37','Q38','Q39','Q40','Q41','Q42'], ARRAY['Q32','Q33','Q34','Q35'], 'Standart ERP paketleri güçlenir; özel yazılım ihtiyacı düşer.', 'Özel süreç yoksa dört alt soru kapatılmalı.'),
('R16', '{"kosullar": [{"soru_kodu": "Q31", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q32','Q33','Q34','Q35'], ARRAY[]::text[], 'Özel algoritma, portal, mobil ekran analiz edilir.', 'Özel süreç varsa hibrit değerlendirmesi zorunlu.'),
('R17', '{"kosullar": [{"soru_kodu": "Q36", "operator": "lte", "deger": 1}]}'::jsonb, ARRAY['Q37','Q38'], ARRAY['Q39','Q40','Q41','Q42'], 'Finans ERP kapsamı sınırlıysa derin finans soruları azalır.', 'Dış muhasebe veya basit finans kullanan firmalarda akış kısalır.'),
('R18', '{"kosullar": [{"soru_kodu": "Q41", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q5','Q6', 'Q80','Q81','Q82','Q83','Q84', 'Q85','Q86','Q87'], ARRAY[]::text[], 'SAP/kurumsal ERP puanı artar; proje yönetimi kritikleşir.', 'Konsolidasyon gerekçesi açık yazılmalı.'),
('R19', '{"kosullar": [{"soru_kodu": "Q43", "operator": "lte", "deger": 1}]}'::jsonb, ARRAY['Q36','Q37','Q38','Q39','Q40','Q41','Q42'], ARRAY['Q44','Q45','Q46','Q47'], 'CRM/satış modülü skoru düşer.', 'Satış akışı basitse satış alt soruları atlanmalı.'),
('R20', '{"kosullar": [{"soru_kodu": "Q43", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q44','Q45','Q46','Q47'], ARRAY[]::text[], 'CRM, fiyatlama, portal değerlendirilir.', 'Satış departmanı varsa derinleştirme açılır.'),
('R21', '{"kosullar": [{"soru_kodu": "Q46", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q33', 'Q81', 'Q80','Q81','Q82','Q83','Q84'], ARRAY[]::text[], 'Odoo/özel portal skoru artar.', 'E-ticaret varsa API entegrasyonları sorulmalı.'),
('R22', '{"kosullar": [{"soru_kodu": "Q48", "operator": "lte", "deger": 1}]}'::jsonb, ARRAY['Q36','Q37','Q38','Q39','Q40','Q41','Q42', 'Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84','Q85','Q86','Q87'], ARRAY['Q49','Q50','Q51','Q52'], 'Satınalma modülü skoru düşer.', 'Satınalma kapsam dışıysa alt sorular kapatılmalı.'),
('R23', '{"kosullar": [{"soru_kodu": "Q48", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q49','Q50','Q51','Q52'], ARRAY[]::text[], 'Satınalma, RFQ değerlendirilir.', 'Stoklu firmalarda detaylar kritik.'),
('R24', '{"kosullar": [{"soru_kodu": "Q53", "operator": "lte", "deger": 1}]}'::jsonb, ARRAY['Q36','Q37','Q38','Q39','Q40','Q41','Q42', 'Q43','Q44','Q45','Q46','Q47', 'Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84','Q85','Q86','Q87'], ARRAY['Q54','Q55','Q56','Q57','Q58','Q59'], 'WMS/mobil depo skoru düşer.', 'Fiziksel stok yoksa depo soruları gösterilmemeli.'),
('R25', '{"kosullar": [{"soru_kodu": "Q53", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q54','Q55','Q56','Q57','Q58','Q59'], ARRAY[]::text[], 'WMS, izlenebilirlik skoru yükselir.', 'Depo varsa el terminali sorulmalı.'),
('R26', '{"kosullar": [{"soru_kodu": "Q56", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q55', 'Q58','Q59', 'Q80','Q81','Q82','Q83','Q84'], ARRAY[]::text[], 'Mobil WMS ihtimali yükselir.', 'El terminali ihtiyacı önemli teknik filtredir.'),
('R27', '{"kosullar": [{"soru_kodu": "Q57", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q69','Q70','Q71','Q72','Q73','Q74'], ARRAY[]::text[], 'İzlenebilirlik skoru yükselir.', 'Lot/seri zorunluysa kalite açılmalı.'),
('R28', '{"kosullar": [{"soru_kodu": "Q60", "operator": "lte", "deger": 1}]}'::jsonb, ARRAY['Q36','Q37','Q38','Q39','Q40','Q41','Q42', 'Q43','Q44','Q45','Q46','Q47','Q48','Q49','Q50','Q51','Q52','Q53','Q54','Q55','Q56','Q57','Q58','Q59', 'Q75','Q76','Q77','Q78','Q79','Q80','Q81','Q82','Q83','Q84','Q85','Q86','Q87'], ARRAY['Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68', 'Q70','Q71','Q72','Q73','Q74'], 'Üretim ERP skoru düşer.', 'Üretim yoksa üretim modülü gösterilmemeli.'),
('R29', '{"kosullar": [{"soru_kodu": "Q60", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68', 'Q38', 'Q52', 'Q69','Q70','Q71','Q72','Q73','Q74'], ARRAY[]::text[], 'SAP/Canias skoru yükselir.', 'Üretimde BOM, rota ayrı ölçülmeli.'),
('R30', '{"kosullar": [{"soru_kodu": "Q63", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q31','Q32','Q33','Q34','Q35', 'Q80','Q81','Q82','Q83','Q84'], ARRAY[]::text[], 'SAP/Canias ihtimali artar.', 'Varyantlı yapı ERP seçimini zorlaştırabilir.'),
('R31', '{"kosullar": [{"soru_kodu": "Q66", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q82', 'Q75','Q76','Q77','Q78','Q79'], ARRAY[]::text[], 'MES, makine entegrasyonu ihtimali artar.', 'Gerçek zamanlı veri varsa entegrasyon derinleşmeli.'),
('R32', '{"mantik": "OR", "kosullar": [{"soru_kodu": "Q69", "operator": "gte", "deger": 3}, {"soru_kodu": "Q74", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q70','Q71','Q72','Q73','Q74'], ARRAY[]::text[], 'Kalite modülü ihtiyacı artar.', 'Kalite gerekmiyorsa alt sorular kapatılır.'),
('R33', '{"mantik": "OR", "kosullar": [{"soru_kodu": "Q75", "operator": "gte", "deger": 3}, {"soru_kodu": "Q76", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q77','Q78','Q79'], ARRAY[]::text[], 'BI, dashboard önerisi güçlenir.', 'Rapor ihtiyacı öncelikli çıktı olabilir.'),
('R35', '{"kosullar": [{"soru_kodu": "Q80", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q81','Q82','Q83','Q84'], ARRAY[]::text[], 'Entegrasyon yoğunluğu özel katman ihtiyacını artırır.', 'Çok entegrasyon varsa risk sorulmalı.'),
('R36', '{"kosullar": [{"soru_kodu": "Q82", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q53','Q54','Q55','Q56','Q57','Q58','Q59', 'Q60','Q61','Q62','Q63','Q64','Q65','Q66','Q67','Q68', 'Q75','Q76','Q77','Q78','Q79'], ARRAY[]::text[], 'Hibrit mimari güçlenir.', 'Üretim ve depo çapraz bağlanmalı.'),
('R37', '{"kosullar": [{"soru_kodu": "Q84", "operator": "gte", "deger": 3}]}'::jsonb, ARRAY['Q30', 'Q85','Q86','Q87'], ARRAY[]::text[], 'Kurumsal güvenlik skoru yükselir.', 'Denetime tabi firmalarda governance çıktısı gösterilmeli.');

"""

with open('supabase/seed.sql', 'w') as f:
    f.write(seed + rules_insert)

print("seed.sql updated successfully.")
