const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  if (line && line.includes('=')) {
    const [k, v] = line.split('=');
    acc[k.trim()] = v.trim();
  }
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('degerlendirme_sonuclari')
    .select('id, degerlendirme_id, toplam_puan, olusturulma_tarihi')
    .order('olusturulma_tarihi', { ascending: false })
    .limit(5);

  if (error) console.error("Error:", error);
  else console.log("Data:", JSON.stringify(data, null, 2));
}
main();
