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

-- ==========================================================================
-- ATALITIX PORTAL — ERP İHTİYAÇ ANALİZİ SORU SETİ
-- ==========================================================================
-- 14 Bölüm | 87 Soru | 261 Seçenek
-- Her soru: Tek seçimli, 3 seçenek (1 / 3 / 5 puan)
-- Ağırlık aralığı: 3 (düşük) | 4 (orta) | 5 (yüksek)
-- UUID şeması:
--   Kategoriler : 00000000-0000-0000-0000-0000000000XX  (01–14)
--   Sorular     : 00000000-0000-0000-0001-0000000000XX  (01–87)
--   Seçenekler  : 00000000-0000-0000-0002-000000000XXX  (001–261)
-- ==========================================================================

-- Yeniden çalıştırılabilir: mevcut veriyi temizle
TRUNCATE TABLE soru_secenekleri CASCADE;
TRUNCATE TABLE sorular       CASCADE;
TRUNCATE TABLE soru_kategorileri CASCADE;


-- ──────────────────────────────────────────────────────────────────────────────
-- 1. KATEGORİLER (14 adet)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO soru_kategorileri
  (id, ad, slug, aciklama, ikon, sira, agirlik, aktif_mi)
VALUES

  ('00000000-0000-0000-0000-000000000001',
   'A. Firma Profili & Ölçek',
   'firma-profili-olcek',
   'Firmanın yapısal büyüklüğü, lokasyon dağılımı ve büyüme planı; ERP segmentini belirleyen ilk filtre.',
   '🏢', 1, 3, true),

  ('00000000-0000-0000-0000-000000000002',
   'B. Finansal Kapasite & Yatırım Uygunluğu',
   'finansal-kapasite',
   'Ciro, kârlılık, ERP bütçesi ve yatırım toleransı; hangi ERP segmentine girilebileceğini belirler.',
   '💰', 2, 5, true),

  ('00000000-0000-0000-0000-000000000003',
   'C. Mevcut Sistemler & Temel Sorunlar',
   'mevcut-sistemler',
   'Excel bağımlılığı, veri tutarsızlığı ve mevcut sistem boşlukları; dijital dönüşüm önceliğini gösterir.',
   '💻', 3, 4, true),

  ('00000000-0000-0000-0000-000000000004',
   'D. Süreç Olgunluğu & Standartlaşma',
   'surec-olgunlugu',
   'Süreç dokümantasyonu, sahiplik ve standartlaşma; ERP projesinin hazırlık seviyesini gösterir.',
   '⚙️', 4, 4, true),

  ('00000000-0000-0000-0000-000000000005',
   'E. Özelleştirme & Özel Süreç İhtiyacı',
   'ozellestirme',
   'Standart ERP''de zor karşılanan özel süreç, algoritma ve portal ihtiyaçları.',
   '🔧', 5, 3, true),

  ('00000000-0000-0000-0000-000000000006',
   'F. Finans, Muhasebe & Mevzuat',
   'finans-mevzuat',
   'Muhasebe kapsamı, e-belge, maliyet muhasebesi ve Türkiye mevzuatı uyumluluğu.',
   '📊', 6, 5, true),

  ('00000000-0000-0000-0000-000000000007',
   'G. Satış, CRM & Müşteri Süreçleri',
   'satis-crm',
   'Tekliften siparişe, CRM, e-ticaret ve satış sonrası servis süreçlerinin karmaşıklığı.',
   '🛒', 7, 3, true),

  ('00000000-0000-0000-0000-000000000008',
   'H. Satınalma & Tedarikçi Süreçleri',
   'satinalma-tedarik',
   'Satın alma akışı, tedarikçi değerlendirme, dış ticaret ve MRP bağlantısı.',
   '📦', 8, 3, true),

  ('00000000-0000-0000-0000-000000000009',
   'I. Stok, Depo & Mobil Operasyon',
   'depo-mobil',
   'Depo sayısı, adresli depo, barkod, el terminali ve seri/lot takibi.',
   '🏭', 9, 4, true),

  ('00000000-0000-0000-0000-000000000010',
   'J. Üretim & Planlama',
   'uretim-planlama',
   'Üretim tipi, BOM, rota, MRP, kapasite planlama ve shopfloor veri toplama.',
   '🔩', 10, 5, true),

  ('00000000-0000-0000-0000-000000000011',
   'K. Kalite, İzlenebilirlik & Regülasyon',
   'kalite-izlenebilirlik',
   'Giriş/proses/final kalite, CAPA, kalibrasyon ve geriye dönük izlenebilirlik.',
   '✅', 11, 4, true),

  ('00000000-0000-0000-0000-000000000012',
   'L. Veri, Raporlama & Karar Destek',
   'veri-karar-destek',
   'Yönetim KPI''leri, operasyonel dashboard, gerçek zamanlı veri ve AI analiz ihtiyaçları.',
   '📈', 12, 3, true),

  ('00000000-0000-0000-0000-000000000013',
   'M. Entegrasyon & Teknoloji Mimarisi',
   'entegrasyon-teknoloji',
   'Dış sistem entegrasyonu, endüstriyel bağlantılar, bulut/on-premise ve güvenlik ihtiyaçları.',
   '🔌', 13, 4, true),

  ('00000000-0000-0000-0000-000000000014',
   'N. Proje Yönetimi & Değişim Hazırlığı',
   'proje-hazirligi',
   'Üst yönetim sponsorluğu, key user yapısı ve veri/eğitim hazırlığı; başarının temel taşları.',
   '📋', 14, 5, true);


-- ──────────────────────────────────────────────────────────────────────────────
-- 2. SORULAR (87 adet)
-- ──────────────────────────────────────────────────────────────────────────────
-- description alanı: "Alt Boyut | ERP Etkisi" formatında

INSERT INTO sorular
  (id, kategori_id, kod, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi)
VALUES

  -- ── A. Firma Profili & Ölçek ──────────────────────────────────────────────
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Q1',
   'Ana faaliyet modeliniz nedir?',
   'Sektör ve yapı | Karma yapı arttıkça kurumsal ERP ve modüler mimari ihtiyacı artar.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Q2',
   'Toplam çalışan sayınız hangi seviyede?',
   'Çalışan sayısı | Kullanıcı ve süreç sayısı arttıkça ölçeklenebilirlik ihtiyacı artar.',
   'single_choice', 4, 2, true, true),

  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Q3',
   'ERP kullanacak tahmini aktif kullanıcı sayısı nedir?',
   'ERP kullanıcı sayısı | Lisans, eğitim, yetki ve destek modeli seçimini etkiler.',
   'single_choice', 4, 3, true, true),

  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Q4',
   'Kaç lokasyon, fabrika, depo, mağaza veya saha noktası yönetilecek?',
   'Lokasyon | Çok lokasyonlu yapı SAP/Canias gibi kurumsal ölçekleri güçlendirir.',
   'single_choice', 5, 4, true, true),

  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Q5',
   'Kaç yasal şirket veya şube aynı yapı altında yönetilecek?',
   'Yasal şirket | Çok şirketli yapı konsolidasyon ve standart süreç ihtiyacını artırır.',
   'single_choice', 5, 5, true, true),

  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'Q6',
   'Çok ülke, çok dil, çok para birimi veya farklı vergi mevzuatı ihtiyacı var mı?',
   'Uluslararası yapı | Global yapı SAP veya güçlü kurumsal ERP ihtiyacını artırır.',
   'single_choice', 5, 6, true, true),

  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'Q7',
   'Önümüzdeki 3 yılda büyüme, yeni lokasyon, ihracat veya yeni iş modeli planı var mı?',
   'Büyüme planı | Ölçeklenebilir ve genişleyebilir mimari ihtiyacını artırır.',
   'single_choice', 3, 7, true, true),

  -- ── B. Finansal Kapasite & Yatırım Uygunluğu ─────────────────────────────
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000002', 'Q8',
   'Yıllık net ciro seviyeniz ERP yatırımı açısından hangi aralıkta?',
   'Ciro | Ciro seviyesi ERP segmenti, lisans bütçesi ve proje kapsamını doğrudan etkiler.',
   'single_choice', 5, 1, true, true),

  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000002', 'Q9',
   'Şirketin son 12–24 aydaki kârlılık / EBITDA / net marj durumu nedir?',
   'Kârlılık | Finansal dayanıklılık proje büyüklüğünü ve risk toleransını belirler.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000002', 'Q10',
   'Operasyonel gelir-gider dengesi ERP projesi için ne kadar sağlıklı?',
   'Gelir-gider dengesi | ERP kararında sadece ihtiyaç değil finansal taşıma gücü de belirleyicidir.',
   'single_choice', 5, 3, true, true),

  ('00000000-0000-0000-0001-000000000011', '00000000-0000-0000-0000-000000000002', 'Q11',
   'Lisans, danışmanlık, veri aktarımı, eğitim ve entegrasyon için ayrılabilir ERP bütçesi nedir?',
   'ERP bütçesi | Bütçe SAP/Odoo/Logo/Canias/hibrit ayrımında kritik filtredir.',
   'single_choice', 5, 4, true, true),

  ('00000000-0000-0000-0001-000000000012', '00000000-0000-0000-0000-000000000002', 'Q12',
   'Yıllık bakım, abonelik, destek ve geliştirme maliyetini taşıma isteğiniz nedir?',
   'Yıllık işletme maliyeti | SaaS/on-premise, destek ve partner modelini etkiler.',
   'single_choice', 4, 5, true, true),

  ('00000000-0000-0000-0001-000000000013', '00000000-0000-0000-0000-000000000002', 'Q13',
   'ERP yatırımının geri dönüş süresi için beklentiniz nedir?',
   'ROI beklentisi | Kısa ROI beklentisi kapsamı ve çözüm segmentini sınırlar.',
   'single_choice', 3, 6, true, true),

  ('00000000-0000-0000-0001-000000000014', '00000000-0000-0000-0000-000000000002', 'Q14',
   'Key user, proje ekibi ve veri temizliği için iç kaynak ayrılabilir mi?',
   'İç kaynak bütçesi | İç kaynak olmadan büyük ERP projesi yüksek risklidir.',
   'single_choice', 4, 7, true, true),

  ('00000000-0000-0000-0001-000000000015', '00000000-0000-0000-0000-000000000002', 'Q15',
   'Manuel işlerin, hataların ve rapor gecikmelerinin finansal etkisi ne kadar görünür?',
   'Mevcut verimsizlik maliyeti | İş değeri yüksekse ERP/otomasyon yatırım gerekçesi güçlenir.',
   'single_choice', 4, 8, true, true),

  ('00000000-0000-0000-0001-000000000016', '00000000-0000-0000-0000-000000000002', 'Q16',
   'ERP ve dijitalleşme, yönetim gündeminde ne kadar öncelikli?',
   'Yatırım önceliği | Yönetim sahipliği seçilen ERP kadar başarıyı etkiler.',
   'single_choice', 4, 9, true, true),

  ('00000000-0000-0000-0001-000000000017', '00000000-0000-0000-0000-000000000002', 'Q17',
   'Proje kapsamı büyüdükçe oluşabilecek maliyet ve süre riskini yönetme toleransınız nedir?',
   'Finansal risk toleransı | Büyük ERP projeleri için finansal risk toleransı gerekir.',
   'single_choice', 3, 10, true, true),

  -- ── C. Mevcut Sistemler & Temel Sorunlar ─────────────────────────────────
  ('00000000-0000-0000-0001-000000000018', '00000000-0000-0000-0000-000000000003', 'Q18',
   'Şu anda kullanılan ERP veya ana iş sistemi işinizi ne kadar karşılıyor?',
   'Mevcut ERP | Mevcut sistem boşlukları ERP değişimi veya iyileştirme ihtiyacını belirler.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000019', '00000000-0000-0000-0000-000000000003', 'Q19',
   'Kritik süreçler Excel, e-posta veya kişisel takiplerle mi yürütülüyor?',
   'Excel bağımlılığı | Yüksek Excel bağımlılığı dönüşüm önceliğini artırır.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000020', '00000000-0000-0000-0000-000000000003', 'Q20',
   'Aynı veri birden fazla sisteme veya dosyaya tekrar giriliyor mu?',
   'Çift veri girişi | Entegrasyon ve ana veri tasarımı ihtiyacını artırır.',
   'single_choice', 4, 3, true, true),

  ('00000000-0000-0000-0001-000000000021', '00000000-0000-0000-0000-000000000003', 'Q21',
   'Departmanlar arasında rakam, stok, sipariş veya maliyet tutarsızlığı yaşanıyor mu?',
   'Veri tutarsızlığı | Veri yönetişimi ve ortak ERP omurgası ihtiyacını artırır.',
   'single_choice', 5, 4, true, true),

  ('00000000-0000-0000-0001-000000000022', '00000000-0000-0000-0000-000000000003', 'Q22',
   'Yönetim raporları ne kadar manuel ve geç hazırlanıyor?',
   'Rapor gecikmesi | BI, dashboard ve standart veri modeli ihtiyacını artırır.',
   'single_choice', 4, 5, true, true),

  ('00000000-0000-0000-0001-000000000023', '00000000-0000-0000-0000-000000000003', 'Q23',
   'Kritik süreçler belli kişilerin bilgisine mi bağlı?',
   'Kişiye bağımlılık | Süreç dokümantasyonu ve ERP standardizasyonu ihtiyacını artırır.',
   'single_choice', 4, 6, true, true),

  -- ── D. Süreç Olgunluğu & Standartlaşma ───────────────────────────────────
  ('00000000-0000-0000-0001-000000000024', '00000000-0000-0000-0000-000000000004', 'Q24',
   'Ana süreçleriniz güncel şekilde dokümante edilmiş mi?',
   'Süreç dokümantasyonu | Düşük olgunlukta önce süreç haritalama gerekir.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000025', '00000000-0000-0000-0000-000000000004', 'Q25',
   'Her ana süreç için süreç sahibi ve karar sorumlusu net mi?',
   'Süreç sahipliği | Süreç sahibi yoksa ERP proje kararları yavaşlar.',
   'single_choice', 4, 2, true, true),

  ('00000000-0000-0000-0001-000000000026', '00000000-0000-0000-0000-000000000004', 'Q26',
   'Satın alma, satış, ödeme, stok ve üretim onayları standart mı?',
   'Onay akışları | Workflow ihtiyacını ve tasarım süresini etkiler.',
   'single_choice', 3, 3, true, true),

  ('00000000-0000-0000-0001-000000000027', '00000000-0000-0000-0000-000000000004', 'Q27',
   'Siparişten tahsilata, talepten ödemeye veya plandan sevkiyata uçtan uca görünürlük var mı?',
   'Uçtan uca görünürlük | Görünürlük eksikliği ERP kapsamını büyütür.',
   'single_choice', 5, 4, true, true),

  ('00000000-0000-0000-0001-000000000028', '00000000-0000-0000-0000-000000000004', 'Q28',
   'Ürün, müşteri, tedarikçi, fiyat ve stok kartlarının sahipliği net mi?',
   'Ana veri sorumluluğu | Master data kalitesi ERP başarısının temel riskidir.',
   'single_choice', 4, 5, true, true),

  ('00000000-0000-0000-0001-000000000029', '00000000-0000-0000-0000-000000000004', 'Q29',
   'Firma süreçleri standart ERP uygulamalarına uyum gösterebilir mi?',
   'Standart pakete uyum | Düşük uyum özelleştirme ve özel yazılım ihtiyacını artırır.',
   'single_choice', 4, 6, true, true),

  ('00000000-0000-0000-0001-000000000030', '00000000-0000-0000-0000-000000000004', 'Q30',
   'İç kontrol, yetki matrisi, görev ayrılığı ve audit trail ihtiyacı ne seviyede?',
   'Kontrol ihtiyacı | Kurumsal yönetişim gerektiren ERP adaylarını güçlendirir.',
   'single_choice', 4, 7, true, true),

  -- ── E. Özelleştirme & Özel Süreç İhtiyacı ────────────────────────────────
  ('00000000-0000-0000-0001-000000000031', '00000000-0000-0000-0000-000000000005', 'Q31',
   'Sizi farklılaştıran ve standart ERP''de zor karşılanan özel süreçler var mı?',
   'Rekabet avantajı | Yüksek özel süreç ihtiyacı Canias/özel yazılım/hibrit yaklaşımı güçlendirir.',
   'single_choice', 5, 1, true, true),

  ('00000000-0000-0000-0001-000000000032', '00000000-0000-0000-0000-000000000005', 'Q32',
   'Özel fiyatlama, planlama, kapasite, rota, maliyet veya tahmin algoritması gerekiyor mu?',
   'Özel algoritma | Özel algoritmalar ERP dışı dijital katman ihtiyacını artırır.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000033', '00000000-0000-0000-0000-000000000005', 'Q33',
   'Müşteri, bayi, tedarikçi, saha veya çalışan portalı gerekiyor mu?',
   'Portal ihtiyacı | Portal ihtiyacı ERP + özel yazılım mimarisini güçlendirebilir.',
   'single_choice', 3, 3, true, true),

  ('00000000-0000-0000-0001-000000000034', '00000000-0000-0000-0000-000000000005', 'Q34',
   'Standart ERP ekranları yerine özel kullanıcı ekranı veya mobil uygulama ihtiyacı var mı?',
   'Özel ekran ve mobilite | Kullanıcı deneyimi özel katman veya low-code ihtiyacını artırır.',
   'single_choice', 4, 4, true, true),

  ('00000000-0000-0000-0001-000000000035', '00000000-0000-0000-0000-000000000005', 'Q35',
   'İş kuralları, müşteri talepleri veya ürün yapısı sık değişiyor mu?',
   'Değişim sıklığı | Esnek ve uyarlanabilir sistem ihtiyacını artırır.',
   'single_choice', 4, 5, true, true),

  -- ── F. Finans, Muhasebe & Mevzuat ────────────────────────────────────────
  ('00000000-0000-0000-0001-000000000036', '00000000-0000-0000-0000-000000000006', 'Q36',
   'Genel muhasebe, cari, banka, çek/senet ve ödeme süreçleri ERP içinde yürütülecek mi?',
   'Muhasebe kapsamı | Finans çekirdeği ERP seçiminin ana filtresidir.',
   'single_choice', 5, 1, true, true),

  ('00000000-0000-0000-0001-000000000037', '00000000-0000-0000-0000-000000000006', 'Q37',
   'E-fatura, e-arşiv, e-irsaliye, e-defter ve lokal mevzuat süreçleri ne kadar kritik?',
   'E-belge ve lokal mevzuat | Türkiye lokalizasyonu Logo/yerel güçlü ERP adaylarını destekler.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000038', '00000000-0000-0000-0000-000000000006', 'Q38',
   'Maliyet muhasebesi, ürün maliyeti veya üretim maliyeti detaylı takip edilecek mi?',
   'Maliyet muhasebesi | Üretim ve finans derinliği olan ERP ihtiyacını artırır.',
   'single_choice', 5, 3, true, true),

  ('00000000-0000-0000-0001-000000000039', '00000000-0000-0000-0000-000000000006', 'Q39',
   'Ürün, müşteri, proje, lokasyon veya kanal bazlı kârlılık izlenecek mi?',
   'Kârlılık analizi | Karar destek ve maliyetlendirme ihtiyacını artırır.',
   'single_choice', 4, 4, true, true),

  ('00000000-0000-0000-0001-000000000040', '00000000-0000-0000-0000-000000000006', 'Q40',
   'Bütçe, nakit akışı, finansal planlama veya senaryo analizi gerekiyor mu?',
   'Bütçe ve nakit akışı | Finansal planlama ve dashboard ihtiyacını artırır.',
   'single_choice', 4, 5, true, true),

  ('00000000-0000-0000-0001-000000000041', '00000000-0000-0000-0000-000000000006', 'Q41',
   'Çok şirketli finansal konsolidasyon, grup raporlama veya IFRS ihtiyacı var mı?',
   'Konsolidasyon | Kurumsal ERP ve güçlü finansal yapı ihtiyacını artırır.',
   'single_choice', 5, 6, true, true),

  ('00000000-0000-0000-0001-000000000042', '00000000-0000-0000-0000-000000000006', 'Q42',
   'Banka entegrasyonu, otomatik mutabakat ve dönem kapanış otomasyonu gerekiyor mu?',
   'Banka/mutabakat | Entegrasyon ve otomasyon fırsatlarını artırır.',
   'single_choice', 3, 7, true, true),

  -- ── G. Satış, CRM & Müşteri Süreçleri ───────────────────────────────────
  ('00000000-0000-0000-0001-000000000043', '00000000-0000-0000-0000-000000000007', 'Q43',
   'Teklif, fiyat, sipariş ve sevkiyat süreçleri tek akışta yönetilmeli mi?',
   'Tekliften siparişe | Satış ve ERP entegrasyonu ihtiyacını artırır.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000044', '00000000-0000-0000-0000-000000000007', 'Q44',
   'Fiyat listeleri, iskonto, kampanya, sözleşme ve müşteri özel şartları karmaşık mı?',
   'Fiyatlama karmaşıklığı | Gelişmiş satış modülü veya özel fiyatlama ihtiyacı doğurur.',
   'single_choice', 4, 2, true, true),

  ('00000000-0000-0000-0001-000000000045', '00000000-0000-0000-0000-000000000007', 'Q45',
   'Aday müşteri, fırsat, müşteri ziyareti ve satış hunisi takip edilecek mi?',
   'CRM ihtiyacı | CRM modülü veya entegre CRM seçimini etkiler.',
   'single_choice', 3, 3, true, true),

  ('00000000-0000-0000-0001-000000000046', '00000000-0000-0000-0000-000000000007', 'Q46',
   'E-ticaret, B2B bayi portalı veya müşteri self-servis ihtiyacı var mı?',
   'E-ticaret/B2B | Odoo/özel yazılım/entegrasyon ihtiyacını güçlendirir.',
   'single_choice', 4, 4, true, true),

  ('00000000-0000-0000-0001-000000000047', '00000000-0000-0000-0000-000000000007', 'Q47',
   'Garanti, iade, servis, bakım veya müşteri şikâyet süreçleri yönetilecek mi?',
   'Satış sonrası servis | Servis modülü veya özel iş akışı ihtiyacını artırır.',
   'single_choice', 3, 5, true, true),

  -- ── H. Satınalma & Tedarikçi Süreçleri ──────────────────────────────────
  ('00000000-0000-0000-0001-000000000048', '00000000-0000-0000-0000-000000000008', 'Q48',
   'Satın alma talep, onay, teklif ve sipariş süreci ERP içinde yönetilecek mi?',
   'Talep-onay-sipariş | Satınalma workflow ve yetki yapısını etkiler.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000049', '00000000-0000-0000-0000-000000000008', 'Q49',
   'Tedarikçilerden teklif toplama, karşılaştırma ve seçim süreci gerekiyor mu?',
   'RFQ ve teklif toplama | Satınalma modülü derinliğini etkiler.',
   'single_choice', 3, 2, true, true),

  ('00000000-0000-0000-0001-000000000050', '00000000-0000-0000-0000-000000000008', 'Q50',
   'Tedarikçi performansı, kalite, teslimat ve fiyat değerlendirmesi yapılacak mı?',
   'Tedarikçi değerlendirme | Tedarikçi puanlama ve kalite bağlantısını güçlendirir.',
   'single_choice', 3, 3, true, true),

  ('00000000-0000-0000-0001-000000000051', '00000000-0000-0000-0000-000000000008', 'Q51',
   'İthalat, gümrük, navlun, dış ticaret veya maliyet dağıtımı süreçleri var mı?',
   'Dış ticaret/ithalat | Tedarik zinciri ve finans entegrasyonunu etkiler.',
   'single_choice', 4, 4, true, true),

  ('00000000-0000-0000-0001-000000000052', '00000000-0000-0000-0000-000000000008', 'Q52',
   'Satınalma süreçleri MRP, stok, üretim planlama ile entegre çalışmalı mı?',
   'MRP bağlantısı | Üretim odaklı ERP ve planlama ihtiyacını artırır.',
   'single_choice', 5, 5, true, true),

  -- ── I. Stok, Depo & Mobil Operasyon ──────────────────────────────────────
  ('00000000-0000-0000-0001-000000000053', '00000000-0000-0000-0000-000000000009', 'Q53',
   'Kaç depo, ambar, lokasyon veya stok noktası yönetilecek?',
   'Depo sayısı | Depo karmaşıklığı WMS ve mobil ihtiyacını artırır.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000054', '00000000-0000-0000-0000-000000000009', 'Q54',
   'Raf, göz, lokasyon, hücre veya adres bazlı stok takibi gerekiyor mu?',
   'Adresli depo | Adresli depo WMS veya güçlü depo modülü ihtiyacını doğurur.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000055', '00000000-0000-0000-0000-000000000009', 'Q55',
   'Barkod, QR kod veya etiket yönetimi kullanılacak mı?',
   'Barkod | Mobil depo ve etiket entegrasyonu ihtiyacını artırır.',
   'single_choice', 4, 3, true, true),

  ('00000000-0000-0000-0001-000000000056', '00000000-0000-0000-0000-000000000009', 'Q56',
   'El terminali, tablet veya mobil cihazla mal kabul, transfer, toplama ve sevkiyat yapılacak mı?',
   'El terminali | Canias/SAP/WMS/özel mobil katman değerlendirmesini etkiler.',
   'single_choice', 5, 4, true, true),

  ('00000000-0000-0000-0001-000000000057', '00000000-0000-0000-0000-000000000009', 'Q57',
   'Seri numarası, lot, parti veya raf ömrü takibi gerekiyor mu?',
   'Seri/lot takibi | İzlenebilirlik ve kalite modülü ihtiyacını artırır.',
   'single_choice', 5, 5, true, true),

  ('00000000-0000-0000-0001-000000000058', '00000000-0000-0000-0000-000000000009', 'Q58',
   'Sayım, paketleme, sevkiyat ve etiketleme süreçleri ne kadar karmaşık?',
   'Sayım ve sevkiyat | Operasyonel ERP/WMS yetkinliğini etkiler.',
   'single_choice', 4, 6, true, true),

  ('00000000-0000-0000-0001-000000000059', '00000000-0000-0000-0000-000000000009', 'Q59',
   'Kantar, barkod yazıcı, RFID, otomasyon hattı veya depo ekipmanı entegrasyonu gerekiyor mu?',
   'Cihaz entegrasyonu | Özel entegrasyon ve teknik mimari ihtiyacını artırır.',
   'single_choice', 4, 7, true, true),

  -- ── J. Üretim & Planlama ──────────────────────────────────────────────────
  ('00000000-0000-0000-0001-000000000060', '00000000-0000-0000-0000-000000000010', 'Q60',
   'Üretim tipiniz ERP açısından ne kadar karmaşık?',
   'Üretim tipi | Üretim tipi ERP adaylarını güçlü biçimde ayrıştırır.',
   'single_choice', 5, 1, true, true),

  ('00000000-0000-0000-0001-000000000061', '00000000-0000-0000-0000-000000000010', 'Q61',
   'Ürün ağacı, reçete, malzeme listesi veya çok seviyeli BOM yönetimi gerekiyor mu?',
   'BOM/ürün ağacı | Üretim ERP derinliğini belirler.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000062', '00000000-0000-0000-0000-000000000010', 'Q62',
   'Operasyon, rota, iş merkezi, makine veya işçilik takibi yapılacak mı?',
   'Rota/iş merkezi | Kapasite ve üretim maliyeti hesaplarını etkiler.',
   'single_choice', 5, 3, true, true),

  ('00000000-0000-0000-0001-000000000063', '00000000-0000-0000-0000-000000000010', 'Q63',
   'Varyantlı ürün, opsiyon yönetimi veya konfigürasyon ihtiyacı var mı?',
   'Varyant/konfigürasyon | SAP/Canias/özel çözüm ihtiyacını artırabilir.',
   'single_choice', 4, 4, true, true),

  ('00000000-0000-0000-0001-000000000064', '00000000-0000-0000-0000-000000000010', 'Q64',
   'Malzeme ihtiyaç planlama ve satınalma/üretim önerileri gerekiyor mu?',
   'MRP | MRP, üretim ERP seçiminde temel kriterdir.',
   'single_choice', 5, 5, true, true),

  ('00000000-0000-0000-0001-000000000065', '00000000-0000-0000-0000-000000000010', 'Q65',
   'Kapasite, darboğaz, vardiya ve iş merkezi yükü izlenecek mi?',
   'Kapasite planlama | Gelişmiş planlama ihtiyacını artırır.',
   'single_choice', 4, 6, true, true),

  ('00000000-0000-0000-0001-000000000066', '00000000-0000-0000-0000-000000000010', 'Q66',
   'Üretim sahasından duruş, fire, çevrim, miktar veya kalite verisi toplanacak mı?',
   'Shopfloor veri toplama | MES, terminal ve özel entegrasyon ihtiyacını artırır.',
   'single_choice', 5, 7, true, true),

  ('00000000-0000-0000-0001-000000000067', '00000000-0000-0000-0000-000000000010', 'Q67',
   'Fason veya taşeron üretim süreçleri ERP içinde yönetilecek mi?',
   'Fason/taşeron | Tedarik, stok ve kalite entegrasyonunu etkiler.',
   'single_choice', 3, 8, true, true),

  ('00000000-0000-0000-0001-000000000068', '00000000-0000-0000-0000-000000000010', 'Q68',
   'Revizyon, mühendislik değişikliği, ürün yaşam döngüsü veya teknik doküman takibi gerekiyor mu?',
   'Mühendislik değişikliği | PLM/ERP entegrasyonu veya özel modül ihtiyacını artırır.',
   'single_choice', 3, 9, true, true),

  -- ── K. Kalite, İzlenebilirlik & Regülasyon ───────────────────────────────
  ('00000000-0000-0000-0001-000000000069', '00000000-0000-0000-0000-000000000011', 'Q69',
   'Giriş kalite kontrol ve tedarikçi kalite süreçleri ERP içinde yürütülecek mi?',
   'Giriş kalite | Kalite modülü ihtiyacını artırır.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000070', '00000000-0000-0000-0000-000000000011', 'Q70',
   'Üretim içi kalite kontrol, ölçüm ve kontrol planları gerekiyor mu?',
   'Proses kalite | Üretim kalite entegrasyonu Canias/SAP gibi çözümleri güçlendirebilir.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000071', '00000000-0000-0000-0000-000000000011', 'Q71',
   'Final kalite, sevk onayı ve sertifika süreçleri gerekiyor mu?',
   'Final kalite | Kalite ve sevkiyat süreçlerini birbirine bağlar.',
   'single_choice', 3, 3, true, true),

  ('00000000-0000-0000-0001-000000000072', '00000000-0000-0000-0000-000000000011', 'Q72',
   'Uygunsuzluk, 8D, CAPA, düzeltici faaliyet veya aksiyon takibi gerekiyor mu?',
   'Uygunsuzluk/aksiyon | ERP yanında aksiyon takip/dijital kalite katmanı gerekebilir.',
   'single_choice', 4, 4, true, true),

  ('00000000-0000-0000-0001-000000000073', '00000000-0000-0000-0000-000000000011', 'Q73',
   'Kalibrasyon, ölçüm cihazı, bakım veya denetim kayıtları takip edilecek mi?',
   'Kalibrasyon | Kalite ve bakım modülü ihtiyacını etkiler.',
   'single_choice', 3, 5, true, true),

  ('00000000-0000-0000-0001-000000000074', '00000000-0000-0000-0000-000000000011', 'Q74',
   'Üründen hammaddeye veya hammaddeden müşteriye izlenebilirlik zorunlu mu?',
   'Geriye dönük izlenebilirlik | Lot/seri, kalite ve depo süreçlerini kritik hale getirir.',
   'single_choice', 5, 6, true, true),

  -- ── L. Veri, Raporlama & Karar Destek ────────────────────────────────────
  ('00000000-0000-0000-0001-000000000075', '00000000-0000-0000-0000-000000000012', 'Q75',
   'Yönetim için standart KPI panelleri ve yönetim kokpiti gerekiyor mu?',
   'Yönetim KPI | BI ve karar destek sistemlerini önceliklendirir.',
   'single_choice', 4, 1, true, true),

  ('00000000-0000-0000-0001-000000000076', '00000000-0000-0000-0000-000000000012', 'Q76',
   'Üretim, depo, satış, finans veya kalite için operasyonel dashboard gerekiyor mu?',
   'Operasyon dashboard | Dashboard tasarımı ve veri modeli ihtiyacını artırır.',
   'single_choice', 4, 2, true, true),

  ('00000000-0000-0000-0001-000000000077', '00000000-0000-0000-0000-000000000012', 'Q77',
   'Gerçek zamanlı veya günlük güncel veriyle karar alma ihtiyacı var mı?',
   'Gerçek zamanlı veri | Entegrasyon, veri ambarı ve dashboard mimarisini etkiler.',
   'single_choice', 4, 3, true, true),

  ('00000000-0000-0000-0001-000000000078', '00000000-0000-0000-0000-000000000012', 'Q78',
   'Tahminleme, anomali tespiti, rapor özetleme veya AI destekli analiz ihtiyacı var mı?',
   'AI destekli analiz | AI use case backlog ve veri hazırlığı ihtiyacını artırır.',
   'single_choice', 3, 4, true, true),

  ('00000000-0000-0000-0001-000000000079', '00000000-0000-0000-0000-000000000012', 'Q79',
   'KPI sapmalarından aksiyon açma, sorumlu atama ve takip ihtiyacı var mı?',
   'Aksiyon takibi | Karar destek sistemini rapordan aksiyona taşır.',
   'single_choice', 3, 5, true, true),

  -- ── M. Entegrasyon & Teknoloji Mimarisi ──────────────────────────────────
  ('00000000-0000-0000-0001-000000000080', '00000000-0000-0000-0000-000000000013', 'Q80',
   'ERP hangi dış sistemlerle entegre olacak?',
   'Entegrasyon sayısı | Entegrasyon yoğunluğu kurumsal ERP ve teknik mimariyi etkiler.',
   'single_choice', 5, 1, true, true),

  ('00000000-0000-0000-0001-000000000081', '00000000-0000-0000-0000-000000000013', 'Q81',
   'Banka, e-belge, kargo, e-ticaret, CRM veya EDI entegrasyonları gerekiyor mu?',
   'Standart entegrasyonlar | Yerel ve dış sistem entegrasyonu adayları ayrıştırır.',
   'single_choice', 4, 2, true, true),

  ('00000000-0000-0000-0001-000000000082', '00000000-0000-0000-0000-000000000013', 'Q82',
   'MES, WMS, PLM, CAD, makine, IoT veya üretim ekipmanı entegrasyonu gerekiyor mu?',
   'Endüstriyel entegrasyon | Canias/SAP/özel katman ihtiyacını artırabilir.',
   'single_choice', 5, 3, true, true),

  ('00000000-0000-0000-0001-000000000083', '00000000-0000-0000-0000-000000000013', 'Q83',
   'Bulut, on-premise veya hibrit mimari tercihinde teknik zorunluluk var mı?',
   'Bulut/on-premise | ERP adaylarının dağıtım modelini etkiler.',
   'single_choice', 3, 4, true, true),

  ('00000000-0000-0000-0001-000000000084', '00000000-0000-0000-0000-000000000013', 'Q84',
   'SSO, loglama, audit trail, rol bazlı yetki ve KVKK güvenliği ne kadar kritik?',
   'Güvenlik ve yetki | Kurumsal yönetişim ve güvenlik ihtiyacını artırır.',
   'single_choice', 5, 5, true, true),

  -- ── N. Proje Yönetimi & Değişim Hazırlığı ────────────────────────────────
  ('00000000-0000-0000-0001-000000000085', '00000000-0000-0000-0000-000000000014', 'Q85',
   'ERP/dijital dönüşüm için üst yönetim sponsorluğu ne kadar güçlü?',
   'Üst yönetim sponsorluğu | Güçlü sponsor proje başarısını doğrudan etkiler.',
   'single_choice', 5, 1, true, true),

  ('00000000-0000-0000-0001-000000000086', '00000000-0000-0000-0000-000000000014', 'Q86',
   'Departman bazlı süreç sahibi ve key user ekibi ayrılabilecek mi?',
   'Key user yapısı | Key user olmadan ERP projeleri yüksek risklidir.',
   'single_choice', 5, 2, true, true),

  ('00000000-0000-0000-0001-000000000087', '00000000-0000-0000-0000-000000000014', 'Q87',
   'Veri temizliği, kullanıcı eğitimi, test ve canlı geçiş hazırlığı için zaman ayrılacak mı?',
   'Veri hazırlığı ve eğitim | Hazırlık seviyesi canlı geçiş riskini belirler.',
   'single_choice', 5, 3, true, true);


-- ──────────────────────────────────────────────────────────────────────────────
-- 3. SEÇENEKLER (261 adet — her soru için 3 seçenek)
-- ──────────────────────────────────────────────────────────────────────────────
-- Puanlama: 1 = düşük ihtiyaç/hazırlık  |  3 = orta  |  5 = yüksek ihtiyaç/hazırlık
-- Q{n} seçenekleri: opt (n-1)*3+1, (n-1)*3+2, (n-1)*3+3

INSERT INTO soru_secenekleri (id, soru_id, metin, deger, sira) VALUES

  -- ── Q1: Ana faaliyet modeli
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','Hizmet / proje ağırlıklı, fiziksel stok ve üretim yok',1,1),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000001','Ticaret / dağıtım / bayi yapısı',2,2),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001','Üretim / montaj / proses / sanayi',3,3),
  ('00000000-0000-0000-0002-000000000262','00000000-0000-0000-0001-000000000001','Lojistik / depo operasyonu ağırlıklı',4,4),
  ('00000000-0000-0000-0002-000000000263','00000000-0000-0000-0001-000000000001','Karma yapı: üretim + ticaret + servis + proje',5,5),

  -- ── Q2: Çalışan sayısı
  ('00000000-0000-0000-0002-000000000004','00000000-0000-0000-0001-000000000002','1–50 çalışan',1,1),
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000002','51–250 çalışan',3,2),
  ('00000000-0000-0000-0002-000000000006','00000000-0000-0000-0001-000000000002','250+ çalışan / çok departmanlı yapı',5,3),

  -- ── Q3: ERP kullanıcı sayısı
  ('00000000-0000-0000-0002-000000000007','00000000-0000-0000-0001-000000000003','1–10 kullanıcı',1,1),
  ('00000000-0000-0000-0002-000000000008','00000000-0000-0000-0001-000000000003','11–75 kullanıcı',3,2),
  ('00000000-0000-0000-0002-000000000009','00000000-0000-0000-0001-000000000003','75+ kullanıcı / yaygın kullanım',5,3),

  -- ── Q4: Lokasyon
  ('00000000-0000-0000-0002-000000000010','00000000-0000-0000-0001-000000000004','Tek lokasyon',1,1),
  ('00000000-0000-0000-0002-000000000011','00000000-0000-0000-0001-000000000004','2–3 lokasyon',3,2),
  ('00000000-0000-0000-0002-000000000012','00000000-0000-0000-0001-000000000004','Çok lokasyon / çok fabrika / yaygın saha',5,3),

  -- ── Q5: Yasal şirket
  ('00000000-0000-0000-0002-000000000013','00000000-0000-0000-0001-000000000005','Tek şirket',1,1),
  ('00000000-0000-0000-0002-000000000014','00000000-0000-0000-0001-000000000005','2–3 şirket / şube',3,2),
  ('00000000-0000-0000-0002-000000000015','00000000-0000-0000-0001-000000000005','Çok şirketli grup / konsolidasyon ihtiyacı',5,3),

  -- ── Q6: Uluslararası yapı
  ('00000000-0000-0000-0002-000000000016','00000000-0000-0000-0001-000000000006','Yok',1,1),
  ('00000000-0000-0000-0002-000000000017','00000000-0000-0000-0001-000000000006','Kısmi / yakın dönem ihtimali var',3,2),
  ('00000000-0000-0000-0002-000000000018','00000000-0000-0000-0001-000000000006','Kritik ve aktif ihtiyaç',5,3),

  -- ── Q7: Büyüme planı
  ('00000000-0000-0000-0002-000000000019','00000000-0000-0000-0001-000000000007','Sınırlı büyüme',1,1),
  ('00000000-0000-0000-0002-000000000020','00000000-0000-0000-0001-000000000007','Kontrollü büyüme / yeni modüller',3,2),
  ('00000000-0000-0000-0002-000000000021','00000000-0000-0000-0001-000000000007','Hızlı büyüme / yeni şirket veya yurt dışı operasyon',5,3),

  -- ── Q8: Ciro
  ('00000000-0000-0000-0002-000000000022','00000000-0000-0000-0001-000000000008','Düşük ölçek / sınırlı yatırım alanı',1,1),
  ('00000000-0000-0000-0002-000000000023','00000000-0000-0000-0001-000000000008','Orta ölçek / kontrollü yatırım alanı',3,2),
  ('00000000-0000-0000-0002-000000000024','00000000-0000-0000-0001-000000000008','Yüksek ölçek / kurumsal yatırım kapasitesi',5,3),

  -- ── Q9: Kârlılık
  ('00000000-0000-0000-0002-000000000025','00000000-0000-0000-0001-000000000009','Zayıf veya dalgalı',1,1),
  ('00000000-0000-0000-0002-000000000026','00000000-0000-0000-0001-000000000009','Dengeli ama dikkatli yatırım gerekli',3,2),
  ('00000000-0000-0000-0002-000000000027','00000000-0000-0000-0001-000000000009','Güçlü ve sürdürülebilir kârlılık',5,3),

  -- ── Q10: Gelir-gider dengesi
  ('00000000-0000-0000-0002-000000000028','00000000-0000-0000-0001-000000000010','Nakit akışı baskılı / gider kontrolü öncelikli',1,1),
  ('00000000-0000-0000-0002-000000000029','00000000-0000-0000-0001-000000000010','Dengeli ama yatırım seçici yapılmalı',3,2),
  ('00000000-0000-0000-0002-000000000030','00000000-0000-0000-0001-000000000010','Sağlam nakit akışı ve yatırım esnekliği var',5,3),

  -- ── Q11: ERP bütçesi
  ('00000000-0000-0000-0002-000000000031','00000000-0000-0000-0001-000000000011','Düşük / küçük paket ve hızlı devreye alma gerekir',1,1),
  ('00000000-0000-0000-0002-000000000032','00000000-0000-0000-0001-000000000011','Orta / kontrollü kapsam mümkün',3,2),
  ('00000000-0000-0000-0002-000000000033','00000000-0000-0000-0001-000000000011','Yüksek / kurumsal dönüşüm projesi mümkün',5,3),

  -- ── Q12: Yıllık işletme maliyeti
  ('00000000-0000-0000-0002-000000000034','00000000-0000-0000-0001-000000000012','Minimum maliyet beklentisi',1,1),
  ('00000000-0000-0000-0002-000000000035','00000000-0000-0000-0001-000000000012','Kontrollü sürdürülebilir maliyet',3,2),
  ('00000000-0000-0000-0002-000000000036','00000000-0000-0000-0001-000000000012','Yüksek servis seviyesi için bütçe ayrılabilir',5,3),

  -- ── Q13: ROI beklentisi
  ('00000000-0000-0000-0002-000000000037','00000000-0000-0000-0001-000000000013','Çok kısa geri dönüş bekleniyor',1,1),
  ('00000000-0000-0000-0002-000000000038','00000000-0000-0000-0001-000000000013','12–24 ay makul görülüyor',3,2),
  ('00000000-0000-0000-0002-000000000039','00000000-0000-0000-0001-000000000013','24+ ay stratejik yatırım kabul ediliyor',5,3),

  -- ── Q14: İç kaynak bütçesi
  ('00000000-0000-0000-0002-000000000040','00000000-0000-0000-0001-000000000014','Kaynak çok sınırlı',1,1),
  ('00000000-0000-0000-0002-000000000041','00000000-0000-0000-0001-000000000014','Kısmi kaynak ayrılabilir',3,2),
  ('00000000-0000-0000-0002-000000000042','00000000-0000-0000-0001-000000000014','Güçlü proje ekibi ayrılabilir',5,3),

  -- ── Q15: Mevcut verimsizlik maliyeti
  ('00000000-0000-0000-0002-000000000043','00000000-0000-0000-0001-000000000015','Ölçülmüyor veya düşük',1,1),
  ('00000000-0000-0000-0002-000000000044','00000000-0000-0000-0001-000000000015','Kısmen biliniyor',3,2),
  ('00000000-0000-0000-0002-000000000045','00000000-0000-0000-0001-000000000015','Yüksek ve ölçülebilir maliyet var',5,3),

  -- ── Q16: Yatırım önceliği
  ('00000000-0000-0000-0002-000000000046','00000000-0000-0000-0001-000000000016','Düşük öncelik',1,1),
  ('00000000-0000-0000-0002-000000000047','00000000-0000-0000-0001-000000000016','Orta öncelik',3,2),
  ('00000000-0000-0000-0002-000000000048','00000000-0000-0000-0001-000000000016','Stratejik öncelik / üst yönetim sahipliği',5,3),

  -- ── Q17: Finansal risk toleransı
  ('00000000-0000-0000-0002-000000000049','00000000-0000-0000-0001-000000000017','Düşük risk toleransı',1,1),
  ('00000000-0000-0000-0002-000000000050','00000000-0000-0000-0001-000000000017','Kontrollü risk alınabilir',3,2),
  ('00000000-0000-0000-0002-000000000051','00000000-0000-0000-0001-000000000017','Stratejik dönüşüm için yönetilebilir risk alınabilir',5,3),

  -- ── Q18: Mevcut ERP
  ('00000000-0000-0000-0002-000000000052','00000000-0000-0000-0001-000000000018','Büyük ölçüde karşılıyor',1,1),
  ('00000000-0000-0000-0002-000000000053','00000000-0000-0000-0001-000000000018','Kısmen karşılıyor / boşluklar var',3,2),
  ('00000000-0000-0000-0002-000000000054','00000000-0000-0000-0001-000000000018','Yetersiz / kritik süreçler dışarıda',5,3),

  -- ── Q19: Excel bağımlılığı
  ('00000000-0000-0000-0002-000000000055','00000000-0000-0000-0001-000000000019','Çok az',1,1),
  ('00000000-0000-0000-0002-000000000056','00000000-0000-0000-0001-000000000019','Bazı kritik alanlarda var',3,2),
  ('00000000-0000-0000-0002-000000000057','00000000-0000-0000-0001-000000000019','Yaygın ve operasyonu etkiliyor',5,3),

  -- ── Q20: Çift veri girişi
  ('00000000-0000-0000-0002-000000000058','00000000-0000-0000-0001-000000000020','Nadir',1,1),
  ('00000000-0000-0000-0002-000000000059','00000000-0000-0000-0001-000000000020','Bazı süreçlerde',3,2),
  ('00000000-0000-0000-0002-000000000060','00000000-0000-0000-0001-000000000020','Yaygın ve hataya açık',5,3),

  -- ── Q21: Veri tutarsızlığı
  ('00000000-0000-0000-0002-000000000061','00000000-0000-0000-0001-000000000021','Nadir',1,1),
  ('00000000-0000-0000-0002-000000000062','00000000-0000-0000-0001-000000000021','Bazen yaşanıyor',3,2),
  ('00000000-0000-0000-0002-000000000063','00000000-0000-0000-0001-000000000021','Sık ve kararları etkiliyor',5,3),

  -- ── Q22: Rapor gecikmesi
  ('00000000-0000-0000-0002-000000000064','00000000-0000-0000-0001-000000000022','Otomatik / zamanında',1,1),
  ('00000000-0000-0000-0002-000000000065','00000000-0000-0000-0001-000000000022','Kısmen manuel',3,2),
  ('00000000-0000-0000-0002-000000000066','00000000-0000-0000-0001-000000000022','Çok manuel ve geç',5,3),

  -- ── Q23: Kişiye bağımlılık
  ('00000000-0000-0000-0002-000000000067','00000000-0000-0000-0001-000000000023','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000068','00000000-0000-0000-0001-000000000023','Orta',3,2),
  ('00000000-0000-0000-0002-000000000069','00000000-0000-0000-0001-000000000023','Yüksek / ayrılma halinde riskli',5,3),

  -- ── Q24: Süreç dokümantasyonu
  ('00000000-0000-0000-0002-000000000070','00000000-0000-0000-0001-000000000024','Büyük ölçüde evet',1,1),
  ('00000000-0000-0000-0002-000000000071','00000000-0000-0000-0001-000000000024','Kısmen / bazı bölümler',3,2),
  ('00000000-0000-0000-0002-000000000072','00000000-0000-0000-0001-000000000024','Hayır / güncel değil',5,3),

  -- ── Q25: Süreç sahipliği
  ('00000000-0000-0000-0002-000000000073','00000000-0000-0000-0001-000000000025','Net',1,1),
  ('00000000-0000-0000-0002-000000000074','00000000-0000-0000-0001-000000000025','Kısmen net',3,2),
  ('00000000-0000-0000-0002-000000000075','00000000-0000-0000-0001-000000000025','Belirsiz',5,3),

  -- ── Q26: Onay akışları
  ('00000000-0000-0000-0002-000000000076','00000000-0000-0000-0001-000000000026','Standart',1,1),
  ('00000000-0000-0000-0002-000000000077','00000000-0000-0000-0001-000000000026','Kısmen standart',3,2),
  ('00000000-0000-0000-0002-000000000078','00000000-0000-0000-0001-000000000026','Kişiye/duruma bağlı',5,3),

  -- ── Q27: Uçtan uca görünürlük
  ('00000000-0000-0000-0002-000000000079','00000000-0000-0000-0001-000000000027','Var',1,1),
  ('00000000-0000-0000-0002-000000000080','00000000-0000-0000-0001-000000000027','Kısmen var',3,2),
  ('00000000-0000-0000-0002-000000000081','00000000-0000-0000-0001-000000000027','Yok / parçalı',5,3),

  -- ── Q28: Ana veri sorumluluğu
  ('00000000-0000-0000-0002-000000000082','00000000-0000-0000-0001-000000000028','Net ve kontrollü',1,1),
  ('00000000-0000-0000-0002-000000000083','00000000-0000-0000-0001-000000000028','Kısmen kontrollü',3,2),
  ('00000000-0000-0000-0002-000000000084','00000000-0000-0000-0001-000000000028','Belirsiz / düzensiz',5,3),

  -- ── Q29: Standart pakete uyum
  ('00000000-0000-0000-0002-000000000085','00000000-0000-0000-0001-000000000029','Yüksek uyum',1,1),
  ('00000000-0000-0000-0002-000000000086','00000000-0000-0000-0001-000000000029','Kısmi uyum',3,2),
  ('00000000-0000-0000-0002-000000000087','00000000-0000-0000-0001-000000000029','Düşük uyum / farklı işleyiş',5,3),

  -- ── Q30: Kontrol ihtiyacı
  ('00000000-0000-0000-0002-000000000088','00000000-0000-0000-0001-000000000030','Temel',1,1),
  ('00000000-0000-0000-0002-000000000089','00000000-0000-0000-0001-000000000030','Orta',3,2),
  ('00000000-0000-0000-0002-000000000090','00000000-0000-0000-0001-000000000030','Yüksek / kurumsal gereklilik',5,3),

  -- ── Q31: Rekabet avantajı
  ('00000000-0000-0000-0002-000000000091','00000000-0000-0000-0001-000000000031','Yok veya az',1,1),
  ('00000000-0000-0000-0002-000000000092','00000000-0000-0000-0001-000000000031','Bazı alanlarda',3,2),
  ('00000000-0000-0000-0002-000000000093','00000000-0000-0000-0001-000000000031','Kritik rekabet avantajı yaratıyor',5,3),

  -- ── Q32: Özel algoritma
  ('00000000-0000-0000-0002-000000000094','00000000-0000-0000-0001-000000000032','Hayır',1,1),
  ('00000000-0000-0000-0002-000000000095','00000000-0000-0000-0001-000000000032','Kısmen',3,2),
  ('00000000-0000-0000-0002-000000000096','00000000-0000-0000-0001-000000000032','Evet, kritik',5,3),

  -- ── Q33: Portal ihtiyacı
  ('00000000-0000-0000-0002-000000000097','00000000-0000-0000-0001-000000000033','Hayır',1,1),
  ('00000000-0000-0000-0002-000000000098','00000000-0000-0000-0001-000000000033','Kısmen',3,2),
  ('00000000-0000-0000-0002-000000000099','00000000-0000-0000-0001-000000000033','Kritik / yoğun kullanım',5,3),

  -- ── Q34: Özel ekran ve mobilite
  ('00000000-0000-0000-0002-000000000100','00000000-0000-0000-0001-000000000034','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000101','00000000-0000-0000-0001-000000000034','Orta',3,2),
  ('00000000-0000-0000-0002-000000000102','00000000-0000-0000-0001-000000000034','Yüksek / saha operasyonu kritik',5,3),

  -- ── Q35: Değişim sıklığı
  ('00000000-0000-0000-0002-000000000103','00000000-0000-0000-0001-000000000035','Nadir',1,1),
  ('00000000-0000-0000-0002-000000000104','00000000-0000-0000-0001-000000000035','Dönemsel',3,2),
  ('00000000-0000-0000-0002-000000000105','00000000-0000-0000-0001-000000000035','Sık ve hızlı uyum gerekiyor',5,3),

  -- ── Q36: Muhasebe kapsamı
  ('00000000-0000-0000-0002-000000000106','00000000-0000-0000-0001-000000000036','Temel kullanım',1,1),
  ('00000000-0000-0000-0002-000000000107','00000000-0000-0000-0001-000000000036','Orta kapsam',3,2),
  ('00000000-0000-0000-0002-000000000108','00000000-0000-0000-0001-000000000036','Tam kapsam / kritik',5,3),

  -- ── Q37: E-belge ve lokal mevzuat
  ('00000000-0000-0000-0002-000000000109','00000000-0000-0000-0001-000000000037','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000110','00000000-0000-0000-0001-000000000037','Orta',3,2),
  ('00000000-0000-0000-0002-000000000111','00000000-0000-0000-0001-000000000037','Kritik',5,3),

  -- ── Q38: Maliyet muhasebesi
  ('00000000-0000-0000-0002-000000000112','00000000-0000-0000-0001-000000000038','Basit',1,1),
  ('00000000-0000-0000-0002-000000000113','00000000-0000-0000-0001-000000000038','Orta',3,2),
  ('00000000-0000-0000-0002-000000000114','00000000-0000-0000-0001-000000000038','Detaylı ve kritik',5,3),

  -- ── Q39: Kârlılık analizi
  ('00000000-0000-0000-0002-000000000115','00000000-0000-0000-0001-000000000039','Hayır / temel',1,1),
  ('00000000-0000-0000-0002-000000000116','00000000-0000-0000-0001-000000000039','Kısmen',3,2),
  ('00000000-0000-0000-0002-000000000117','00000000-0000-0000-0001-000000000039','Kritik ve detaylı',5,3),

  -- ── Q40: Bütçe ve nakit akışı
  ('00000000-0000-0000-0002-000000000118','00000000-0000-0000-0001-000000000040','Temel',1,1),
  ('00000000-0000-0000-0002-000000000119','00000000-0000-0000-0001-000000000040','Orta',3,2),
  ('00000000-0000-0000-0002-000000000120','00000000-0000-0000-0001-000000000040','Kritik',5,3),

  -- ── Q41: Konsolidasyon
  ('00000000-0000-0000-0002-000000000121','00000000-0000-0000-0001-000000000041','Yok',1,1),
  ('00000000-0000-0000-0002-000000000122','00000000-0000-0000-0001-000000000041','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000123','00000000-0000-0000-0001-000000000041','Kritik',5,3),

  -- ── Q42: Banka/mutabakat
  ('00000000-0000-0000-0002-000000000124','00000000-0000-0000-0001-000000000042','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000125','00000000-0000-0000-0001-000000000042','Orta',3,2),
  ('00000000-0000-0000-0002-000000000126','00000000-0000-0000-0001-000000000042','Yüksek',5,3),

  -- ── Q43: Tekliften siparişe
  ('00000000-0000-0000-0002-000000000127','00000000-0000-0000-0001-000000000043','Basit',1,1),
  ('00000000-0000-0000-0002-000000000128','00000000-0000-0000-0001-000000000043','Orta',3,2),
  ('00000000-0000-0000-0002-000000000129','00000000-0000-0000-0001-000000000043','Kritik / yoğun işlem',5,3),

  -- ── Q44: Fiyatlama karmaşıklığı
  ('00000000-0000-0000-0002-000000000130','00000000-0000-0000-0001-000000000044','Basit',1,1),
  ('00000000-0000-0000-0002-000000000131','00000000-0000-0000-0001-000000000044','Orta',3,2),
  ('00000000-0000-0000-0002-000000000132','00000000-0000-0000-0001-000000000044','Çok karmaşık',5,3),

  -- ── Q45: CRM ihtiyacı
  ('00000000-0000-0000-0002-000000000133','00000000-0000-0000-0001-000000000045','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000134','00000000-0000-0000-0001-000000000045','Orta',3,2),
  ('00000000-0000-0000-0002-000000000135','00000000-0000-0000-0001-000000000045','Kritik',5,3),

  -- ── Q46: E-ticaret/B2B
  ('00000000-0000-0000-0002-000000000136','00000000-0000-0000-0001-000000000046','Yok',1,1),
  ('00000000-0000-0000-0002-000000000137','00000000-0000-0000-0001-000000000046','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000138','00000000-0000-0000-0001-000000000046','Kritik',5,3),

  -- ── Q47: Satış sonrası servis
  ('00000000-0000-0000-0002-000000000139','00000000-0000-0000-0001-000000000047','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000140','00000000-0000-0000-0001-000000000047','Orta',3,2),
  ('00000000-0000-0000-0002-000000000141','00000000-0000-0000-0001-000000000047','Kritik',5,3),

  -- ── Q48: Talep-onay-sipariş
  ('00000000-0000-0000-0002-000000000142','00000000-0000-0000-0001-000000000048','Basit',1,1),
  ('00000000-0000-0000-0002-000000000143','00000000-0000-0000-0001-000000000048','Orta',3,2),
  ('00000000-0000-0000-0002-000000000144','00000000-0000-0000-0001-000000000048','Kritik',5,3),

  -- ── Q49: RFQ ve teklif toplama
  ('00000000-0000-0000-0002-000000000145','00000000-0000-0000-0001-000000000049','Yok',1,1),
  ('00000000-0000-0000-0002-000000000146','00000000-0000-0000-0001-000000000049','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000147','00000000-0000-0000-0001-000000000049','Kritik',5,3),

  -- ── Q50: Tedarikçi değerlendirme
  ('00000000-0000-0000-0002-000000000148','00000000-0000-0000-0001-000000000050','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000149','00000000-0000-0000-0001-000000000050','Orta',3,2),
  ('00000000-0000-0000-0002-000000000150','00000000-0000-0000-0001-000000000050','Kritik',5,3),

  -- ── Q51: Dış ticaret/ithalat
  ('00000000-0000-0000-0002-000000000151','00000000-0000-0000-0001-000000000051','Yok',1,1),
  ('00000000-0000-0000-0002-000000000152','00000000-0000-0000-0001-000000000051','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000153','00000000-0000-0000-0001-000000000051','Yoğun ve kritik',5,3),

  -- ── Q52: MRP bağlantısı
  ('00000000-0000-0000-0002-000000000154','00000000-0000-0000-0001-000000000052','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000155','00000000-0000-0000-0001-000000000052','Orta',3,2),
  ('00000000-0000-0000-0002-000000000156','00000000-0000-0000-0001-000000000052','Kritik',5,3),

  -- ── Q53: Depo sayısı
  ('00000000-0000-0000-0002-000000000157','00000000-0000-0000-0001-000000000053','Tek / basit',1,1),
  ('00000000-0000-0000-0002-000000000158','00000000-0000-0000-0001-000000000053','2–3 depo',3,2),
  ('00000000-0000-0000-0002-000000000159','00000000-0000-0000-0001-000000000053','Çok depo / karmaşık yapı',5,3),

  -- ── Q54: Adresli depo
  ('00000000-0000-0000-0002-000000000160','00000000-0000-0000-0001-000000000054','Hayır',1,1),
  ('00000000-0000-0000-0002-000000000161','00000000-0000-0000-0001-000000000054','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000162','00000000-0000-0000-0001-000000000054','Kritik',5,3),

  -- ── Q55: Barkod
  ('00000000-0000-0000-0002-000000000163','00000000-0000-0000-0001-000000000055','Hayır',1,1),
  ('00000000-0000-0000-0002-000000000164','00000000-0000-0000-0001-000000000055','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000165','00000000-0000-0000-0001-000000000055','Kritik / tüm hareketlerde',5,3),

  -- ── Q56: El terminali
  ('00000000-0000-0000-0002-000000000166','00000000-0000-0000-0001-000000000056','Hayır',1,1),
  ('00000000-0000-0000-0002-000000000167','00000000-0000-0000-0001-000000000056','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000168','00000000-0000-0000-0001-000000000056','Kritik / günlük operasyon',5,3),

  -- ── Q57: Seri/lot takibi
  ('00000000-0000-0000-0002-000000000169','00000000-0000-0000-0001-000000000057','Yok',1,1),
  ('00000000-0000-0000-0002-000000000170','00000000-0000-0000-0001-000000000057','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000171','00000000-0000-0000-0001-000000000057','Zorunlu ve denetlenebilir',5,3),

  -- ── Q58: Sayım ve sevkiyat
  ('00000000-0000-0000-0002-000000000172','00000000-0000-0000-0001-000000000058','Basit',1,1),
  ('00000000-0000-0000-0002-000000000173','00000000-0000-0000-0001-000000000058','Orta',3,2),
  ('00000000-0000-0000-0002-000000000174','00000000-0000-0000-0001-000000000058','Karmaşık ve hacimli',5,3),

  -- ── Q59: Cihaz entegrasyonu
  ('00000000-0000-0000-0002-000000000175','00000000-0000-0000-0001-000000000059','Yok',1,1),
  ('00000000-0000-0000-0002-000000000176','00000000-0000-0000-0001-000000000059','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000177','00000000-0000-0000-0001-000000000059','Kritik',5,3),

  -- ── Q60: Üretim tipi
  ('00000000-0000-0000-0002-000000000178','00000000-0000-0000-0001-000000000060','Basit montaj / az rota',1,1),
  ('00000000-0000-0000-0002-000000000179','00000000-0000-0000-0001-000000000060','Kesikli veya seri üretim',3,2),
  ('00000000-0000-0000-0002-000000000180','00000000-0000-0000-0001-000000000060','Karma üretim / proses / proje / varyantlı yapı',5,3),

  -- ── Q61: BOM/ürün ağacı
  ('00000000-0000-0000-0002-000000000181','00000000-0000-0000-0001-000000000061','Basit',1,1),
  ('00000000-0000-0000-0002-000000000182','00000000-0000-0000-0001-000000000061','Orta',3,2),
  ('00000000-0000-0000-0002-000000000183','00000000-0000-0000-0001-000000000061','Çok seviyeli ve kritik',5,3),

  -- ── Q62: Rota/iş merkezi
  ('00000000-0000-0000-0002-000000000184','00000000-0000-0000-0001-000000000062','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000185','00000000-0000-0000-0001-000000000062','Orta',3,2),
  ('00000000-0000-0000-0002-000000000186','00000000-0000-0000-0001-000000000062','Kritik',5,3),

  -- ── Q63: Varyant/konfigürasyon
  ('00000000-0000-0000-0002-000000000187','00000000-0000-0000-0001-000000000063','Yok',1,1),
  ('00000000-0000-0000-0002-000000000188','00000000-0000-0000-0001-000000000063','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000189','00000000-0000-0000-0001-000000000063','Kritik ve karmaşık',5,3),

  -- ── Q64: MRP
  ('00000000-0000-0000-0002-000000000190','00000000-0000-0000-0001-000000000064','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000191','00000000-0000-0000-0001-000000000064','Orta',3,2),
  ('00000000-0000-0000-0002-000000000192','00000000-0000-0000-0001-000000000064','Kritik',5,3),

  -- ── Q65: Kapasite planlama
  ('00000000-0000-0000-0002-000000000193','00000000-0000-0000-0001-000000000065','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000194','00000000-0000-0000-0001-000000000065','Orta',3,2),
  ('00000000-0000-0000-0002-000000000195','00000000-0000-0000-0001-000000000065','Kritik',5,3),

  -- ── Q66: Shopfloor veri toplama
  ('00000000-0000-0000-0002-000000000196','00000000-0000-0000-0001-000000000066','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000197','00000000-0000-0000-0001-000000000066','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000198','00000000-0000-0000-0001-000000000066','Kritik / gerçek zamanlı',5,3),

  -- ── Q67: Fason/taşeron
  ('00000000-0000-0000-0002-000000000199','00000000-0000-0000-0001-000000000067','Yok',1,1),
  ('00000000-0000-0000-0002-000000000200','00000000-0000-0000-0001-000000000067','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000201','00000000-0000-0000-0001-000000000067','Yoğun ve kritik',5,3),

  -- ── Q68: Mühendislik değişikliği
  ('00000000-0000-0000-0002-000000000202','00000000-0000-0000-0001-000000000068','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000203','00000000-0000-0000-0001-000000000068','Orta',3,2),
  ('00000000-0000-0000-0002-000000000204','00000000-0000-0000-0001-000000000068','Kritik',5,3),

  -- ── Q69: Giriş kalite
  ('00000000-0000-0000-0002-000000000205','00000000-0000-0000-0001-000000000069','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000206','00000000-0000-0000-0001-000000000069','Orta',3,2),
  ('00000000-0000-0000-0002-000000000207','00000000-0000-0000-0001-000000000069','Kritik',5,3),

  -- ── Q70: Proses kalite
  ('00000000-0000-0000-0002-000000000208','00000000-0000-0000-0001-000000000070','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000209','00000000-0000-0000-0001-000000000070','Orta',3,2),
  ('00000000-0000-0000-0002-000000000210','00000000-0000-0000-0001-000000000070','Kritik',5,3),

  -- ── Q71: Final kalite
  ('00000000-0000-0000-0002-000000000211','00000000-0000-0000-0001-000000000071','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000212','00000000-0000-0000-0001-000000000071','Orta',3,2),
  ('00000000-0000-0000-0002-000000000213','00000000-0000-0000-0001-000000000071','Kritik',5,3),

  -- ── Q72: Uygunsuzluk/aksiyon
  ('00000000-0000-0000-0002-000000000214','00000000-0000-0000-0001-000000000072','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000215','00000000-0000-0000-0001-000000000072','Orta',3,2),
  ('00000000-0000-0000-0002-000000000216','00000000-0000-0000-0001-000000000072','Kritik',5,3),

  -- ── Q73: Kalibrasyon
  ('00000000-0000-0000-0002-000000000217','00000000-0000-0000-0001-000000000073','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000218','00000000-0000-0000-0001-000000000073','Orta',3,2),
  ('00000000-0000-0000-0002-000000000219','00000000-0000-0000-0001-000000000073','Kritik',5,3),

  -- ── Q74: Geriye dönük izlenebilirlik
  ('00000000-0000-0000-0002-000000000220','00000000-0000-0000-0001-000000000074','Yok',1,1),
  ('00000000-0000-0000-0002-000000000221','00000000-0000-0000-0001-000000000074','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000222','00000000-0000-0000-0001-000000000074','Zorunlu / regülasyon gereği',5,3),

  -- ── Q75: Yönetim KPI
  ('00000000-0000-0000-0002-000000000223','00000000-0000-0000-0001-000000000075','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000224','00000000-0000-0000-0001-000000000075','Orta',3,2),
  ('00000000-0000-0000-0002-000000000225','00000000-0000-0000-0001-000000000075','Kritik',5,3),

  -- ── Q76: Operasyon dashboard
  ('00000000-0000-0000-0002-000000000226','00000000-0000-0000-0001-000000000076','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000227','00000000-0000-0000-0001-000000000076','Orta',3,2),
  ('00000000-0000-0000-0002-000000000228','00000000-0000-0000-0001-000000000076','Kritik',5,3),

  -- ── Q77: Gerçek zamanlı veri
  ('00000000-0000-0000-0002-000000000229','00000000-0000-0000-0001-000000000077','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000230','00000000-0000-0000-0001-000000000077','Orta',3,2),
  ('00000000-0000-0000-0002-000000000231','00000000-0000-0000-0001-000000000077','Kritik',5,3),

  -- ── Q78: AI destekli analiz
  ('00000000-0000-0000-0002-000000000232','00000000-0000-0000-0001-000000000078','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000233','00000000-0000-0000-0001-000000000078','Orta',3,2),
  ('00000000-0000-0000-0002-000000000234','00000000-0000-0000-0001-000000000078','Kritik',5,3),

  -- ── Q79: Aksiyon takibi
  ('00000000-0000-0000-0002-000000000235','00000000-0000-0000-0001-000000000079','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000236','00000000-0000-0000-0001-000000000079','Orta',3,2),
  ('00000000-0000-0000-0002-000000000237','00000000-0000-0000-0001-000000000079','Kritik',5,3),

  -- ── Q80: Entegrasyon sayısı
  ('00000000-0000-0000-0002-000000000238','00000000-0000-0000-0001-000000000080','Az / temel',1,1),
  ('00000000-0000-0000-0002-000000000239','00000000-0000-0000-0001-000000000080','Orta sayıda sistem',3,2),
  ('00000000-0000-0000-0002-000000000240','00000000-0000-0000-0001-000000000080','Çok sayıda kritik sistem',5,3),

  -- ── Q81: Standart entegrasyonlar
  ('00000000-0000-0000-0002-000000000241','00000000-0000-0000-0001-000000000081','Düşük',1,1),
  ('00000000-0000-0000-0002-000000000242','00000000-0000-0000-0001-000000000081','Orta',3,2),
  ('00000000-0000-0000-0002-000000000243','00000000-0000-0000-0001-000000000081','Kritik',5,3),

  -- ── Q82: Endüstriyel entegrasyon
  ('00000000-0000-0000-0002-000000000244','00000000-0000-0000-0001-000000000082','Yok',1,1),
  ('00000000-0000-0000-0002-000000000245','00000000-0000-0000-0001-000000000082','Kısmi',3,2),
  ('00000000-0000-0000-0002-000000000246','00000000-0000-0000-0001-000000000082','Kritik',5,3),

  -- ── Q83: Bulut/on-premise
  ('00000000-0000-0000-0002-000000000247','00000000-0000-0000-0001-000000000083','Esnek',1,1),
  ('00000000-0000-0000-0002-000000000248','00000000-0000-0000-0001-000000000083','Bazı kısıtlar var',3,2),
  ('00000000-0000-0000-0002-000000000249','00000000-0000-0000-0001-000000000083','Kritik teknik zorunluluk',5,3),

  -- ── Q84: Güvenlik ve yetki
  ('00000000-0000-0000-0002-000000000250','00000000-0000-0000-0001-000000000084','Temel',1,1),
  ('00000000-0000-0000-0002-000000000251','00000000-0000-0000-0001-000000000084','Orta',3,2),
  ('00000000-0000-0000-0002-000000000252','00000000-0000-0000-0001-000000000084','Kritik / denetime tabi',5,3),

  -- ── Q85: Üst yönetim sponsorluğu
  ('00000000-0000-0000-0002-000000000253','00000000-0000-0000-0001-000000000085','Zayıf',1,1),
  ('00000000-0000-0000-0002-000000000254','00000000-0000-0000-0001-000000000085','Orta',3,2),
  ('00000000-0000-0000-0002-000000000255','00000000-0000-0000-0001-000000000085','Güçlü ve aktif',5,3),

  -- ── Q86: Key user yapısı
  ('00000000-0000-0000-0002-000000000256','00000000-0000-0000-0001-000000000086','Hayır / sınırlı',1,1),
  ('00000000-0000-0000-0002-000000000257','00000000-0000-0000-0001-000000000086','Kısmen',3,2),
  ('00000000-0000-0000-0002-000000000258','00000000-0000-0000-0001-000000000086','Evet, net ekip var',5,3),

  -- ── Q87: Veri hazırlığı ve eğitim
  ('00000000-0000-0000-0002-000000000259','00000000-0000-0000-0001-000000000087','Sınırlı',1,1),
  ('00000000-0000-0000-0002-000000000260','00000000-0000-0000-0001-000000000087','Kısmen',3,2),
  ('00000000-0000-0000-0002-000000000261','00000000-0000-0000-0001-000000000087','Planlı ve yeterli',5,3);


-- ==========================================================================
-- KONTROL SORGUSU — çalıştırdıktan sonra doğrulama için
-- ==========================================================================
-- SELECT
--   c.name                                      AS bolum,
--   COUNT(DISTINCT q.id)                        AS soru_sayisi,
--   COUNT(DISTINCT o.id)                        AS secenek_sayisi,
--   SUM(q.weight * 5)                           AS maks_ham_puan
-- FROM soru_kategorileri c
-- LEFT JOIN sorular q ON q.category_id = c.id
-- LEFT JOIN soru_secenekleri o ON o.question_id = q.id
-- GROUP BY c.name, c.order_index
-- ORDER BY c.order_index;


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

