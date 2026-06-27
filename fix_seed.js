const fs = require('fs');
let seed = fs.readFileSync('supabase/seed.sql', 'utf8');

// Update questions
// Change schema: (id, kategori_id, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi)
// To: (id, kategori_id, kod, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi)
seed = seed.replace(/\(id, kategori_id, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi\)/, '(id, kategori_id, kod, metin, aciklama, tip, agirlik, sira, zorunlu_mu, aktif_mi)');

// Update question rows
// Match: ('...', '...', \n   'metin',
// We need to inject 'Qx', before metin
let qIndex = 1;
seed = seed.replace(/\('([0-9a-f-]{36})', '([0-9a-f-]{36})',\s*\n\s*'((?:[^']|'')*)',/g, (match, id, kat_id, metin) => {
  const kod = `Q${qIndex++}`;
  return `('${id}', '${kat_id}', '${kod}',\n   '${metin}',`;
});

// Update Q1 options
// Current options:
// 1: Tek faaliyet / basit ticaret veya hizmet (deger: 1, sira: 1)
// 2: Karma yapı: üretim + ticaret veya proje + hizmet (deger: 3, sira: 2)
// 3: Çoklu iş modeli: üretim, servis, satış, proje, lojistik birlikte (deger: 5, sira: 3)
// We need to replace them with 5 options:
// 1: Hizmet / proje ağırlıklı, fiziksel stok ve üretim yok (deger: 1)
// 2: Ticaret / dağıtım / bayi yapısı (deger: 2)
// 3: Üretim / montaj / proses / sanayi (deger: 3)
// 4: Lojistik / depo operasyonu ağırlıklı (deger: 4)
// 5: Karma yapı: üretim + ticaret + servis + proje (deger: 5)
const q1_options = `
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001','Hizmet / proje ağırlıklı, fiziksel stok ve üretim yok',1,1),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000001','Ticaret / dağıtım / bayi yapısı',2,2),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001','Üretim / montaj / proses / sanayi',3,3),
  ('00000000-0000-0000-0002-000000000262','00000000-0000-0000-0001-000000000001','Lojistik / depo operasyonu ağırlıklı',4,4),
  ('00000000-0000-0000-0002-000000000263','00000000-0000-0000-0001-000000000001','Karma yapı: üretim + ticaret + servis + proje',5,5),
`;

const old_q1_options_regex = /-- ── Q1: Ana faaliyet modeli\n[^\n]+\n[^\n]+\n[^\n]+\n/g;
seed = seed.replace(old_q1_options_regex, `-- ── Q1: Ana faaliyet modeli\n${q1_options}`);

fs.writeFileSync('supabase/seed.sql', seed);
console.log('Seed updated.');
