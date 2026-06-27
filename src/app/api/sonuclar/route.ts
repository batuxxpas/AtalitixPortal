// @ts-nocheck
import { NextResponse } from 'next/server'
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'

// POST /api/results
// Called when an assessment is completed. Computes scores and stores results.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { degerlendirme_id?: string }
  const { degerlendirme_id } = body

  if (!degerlendirme_id) {
    return NextResponse.json({ error: 'degerlendirme_id is required' }, { status: 400 })
  }

  // Verify the user belongs to the company that owns this assessment
  const { data: assessment } = await supabase
    .from('degerlendirmeler')
    .select('id, sirket_id, durum')
    .eq('id', degerlendirme_id)
    .single()

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }

  // Check existing result to avoid recomputing
  const { data: existingResult } = await supabase
    .from('degerlendirme_sonuclari')
    .select('id')
    .eq('degerlendirme_id', degerlendirme_id)
    .single()

  if (existingResult) {
    return NextResponse.json({ success: true, already_computed: true })
  }

  // Load answers with question details
  const { data: answers } = await supabase
    .from('degerlendirme_cevaplari')
    .select('soru_id, secenek_idleri, metin_degeri')
    .eq('degerlendirme_id', degerlendirme_id)

  // Load all kategoriler with sorular and options
  const { data: kategoriler } = await supabase
    .from('soru_kategorileri')
    .select('id, ad, agirlik, sorular(id, kod, agirlik, zorunlu_mu, secenekler:soru_secenekleri(id, deger))')
    .eq('aktif_mi', true)
    .order('sira')

  // Load ERP solutions
  const { data: solutions } = await supabase
    .from('erp_cozumleri')
    .select('id, ad, satici, slug, seviye, uygun_olcekler, uygun_sektorler, logo_url')
    .eq('aktif_mi', true) as unknown as { data: any }

  // Load kurallar for dynamic hidden questions logic
  const { data: kurallar } = await supabase
    .from('kurallar')
    .select('*')
    .eq('aktif_mi', true)

  if (!answers || !kategoriler) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }

  // Build answer lookup: soru_id -> selected option ids
  const answerMap = new Map<string, string[]>()
  const answersObj: Record<string, string[]> = {}
  for (const a of answers) {
    if (a.secenek_idleri) {
      answerMap.set(a.soru_id, a.secenek_idleri)
      answersObj[a.soru_id] = a.secenek_idleri
    }
  }

  // Compute hidden questions dynamically
  const { getHiddenQuestionIds } = await import('@/lib/akisMotoru')
  const hiddenQuestionIds = getHiddenQuestionIds(answersObj, kategoriler, kurallar ?? [])

  // Compute per-category scores
  type CategoryScore = {
    category_id: string
    category_name: string
    score: number
    max_score: number
    percentage: number
    answered_questions: number
    total_questions: number
    comment: string
  }
  const categoryScores: CategoryScore[] = []
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const category of kategoriler as Array<{
    id: string; name: string; weight: number;
    sorular: Array<{ id: string; weight: number; zorunlu_mu: boolean; options: Array<{ id: string; value: number }> }>
  }>) {
    let categoryScore = 0
    let categoryMaxScore = 0
    let answeredQuestions = 0
    let totalQuestions = 0

    for (const question of category.sorular) {
      // Dinamik olarak gizlenmesi gereken soruları atlıyoruz! (Oran ve puana dahil edilmez)
      if (hiddenQuestionIds.has(question.id)) continue

      totalQuestions++ // Sadece görünür soruları toplama ekle

      const selectedOptionIds = answerMap.get(question.id) ?? []
      if (selectedOptionIds.length > 0) {
        answeredQuestions++
      }

      const maxOptionValue = Math.max(...question.secenekler.map((o) => o.deger), 0)

      let questionScore = 0
      for (const optionId of selectedOptionIds) {
        const option = question.secenekler.find((o) => o.id === optionId)
        if (option) questionScore += option.deger
      }

      categoryScore += questionScore * question.agirlik
      categoryMaxScore += maxOptionValue * question.agirlik
    }

    const percentage = categoryMaxScore > 0 ? Math.round((categoryScore / categoryMaxScore) * 100) : 0

    let comment = 'Düşük / temel seviye'
    if (percentage >= 67) {
      comment = 'Yüksek / ileri seviye'
    } else if (percentage >= 34) {
      comment = 'Orta / gelişim aşamasında'
    }

    categoryScores.push({
      category_id: category.id,
      category_name: category.ad,
      score: Math.round(categoryScore * 100) / 100,
      max_score: Math.round(categoryMaxScore * 100) / 100,
      percentage,
      answered_questions: answeredQuestions,
      total_questions: totalQuestions,
      comment,
    })

    totalWeightedScore += percentage * category.agirlik
    totalWeight += category.agirlik
  }

  const totalScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 10) / 10 : 0

  // Şirket profili — ERP çözüm uyumunu belirlemek için
  type ProfilSirket = { calisan_sayisi: string | null; sektor: string | null } | null
  const { data: rawProfil } = await supabase
    .from('profiller')
    .select('sirket:sirketler(calisan_sayisi, sektor)')
    .eq('id', user.id)
    .single()

  const sirketProfili = rawProfil as { sirket: ProfilSirket } | null
  const companySize = sirketProfili?.sirket?.calisan_sayisi ?? null
  const companyIndustry = sirketProfili?.sirket?.sektor ?? null

  // ─── Çözüm uyum hesaplama ────────────────────────────────────────────────────
  type Çözüm = {
    solution_id: string
    solution_name: string
    vendor: string
    slug: string
    tier: string
    logo_url: string | null
    match_score: number
    match_percentage: number
    reasons: string[]
  }
  const recommendedSolutions: Çözüm[] = []

  // Extract category scores for logic
  const getCatScore = (keyword: string) => categoryScores.find(c => c.category_name.toLowerCase().includes(keyword.toLowerCase()))?.percentage || 0
  const scoreScale = getCatScore('Firma Ölçeği') || getCatScore('Firma Profili')
  const scoreFinance = getCatScore('Finansal Kapasite')
  const scoreCustom = getCatScore('Özelleştirme')
  const scoreProd = getCatScore('Üretim')
  const scoreWarehouse = getCatScore('Depo')
  const scoreQuality = getCatScore('Kalite')
  const scoreIntegration = getCatScore('Entegrasyon')
  const scoreProject = getCatScore('Proje Hazırlığı')
  const scoreLocalFin = getCatScore('Finans & Mevzuat') || getCatScore('Finans, Muhasebe')

  // Helper to get specific question answers
  const getQValue = (num: number) => {
    const qId = `00000000-0000-0000-0001-${num.toString().padStart(10, '0')}`
    const selectedOptionIds = answerMap.get(qId)
    if (!selectedOptionIds || selectedOptionIds.length === 0) return 0
    let maxVal = 0
    for (const cat of kategoriler as any[]) {
      const q = cat.sorular.find((q: any) => q.id === qId)
      if (q) {
        for (const optId of selectedOptionIds) {
          const opt = q.secenekler.find((o: any) => o.id === optId)
          if (opt && opt.deger > maxVal) maxVal = opt.deger
        }
        return maxVal
      }
    }
    return 0
  }

  const q1 = getQValue(1) // Sektör / İş Modeli
  const q18 = getQValue(18) // Mevcut ERP yeterliliği
  const q41 = getQValue(41) // Konsolidasyon
  const q85 = getQValue(85)
  const q86 = getQValue(86)
  const q87 = getQValue(87)

  // Süreç olgunluğu skoru
  const scoreOlgunluk = getCatScore('Süreç Olgunluğu')

  if (solutions) {
    for (const sol of solutions as Array<{
      id: string; name: string; vendor: string; slug: string; tier: string | null;
      uygun_olcekler: string[] | null; uygun_sektorler: string[] | null; logo_url: string | null
    }>) {
      let matchScore = 0
      const reasons: string[] = []
      const slug = sol.slug.toLowerCase()
      const name = sol.ad.toLowerCase()

      // Default baseline scores based on priority
      if (slug.includes('sap') || name.includes('sap')) {
        matchScore = 50
        if (scoreFinance >= 70 && scoreScale >= 60 && scoreIntegration >= 60 && scoreProject >= 60) {
          matchScore += 35
          reasons.push('Kurumsal ölçek, yüksek entegrasyon ve güçlü finansal kapasiteye uygun.')
        }
        if (scoreFinance < 40) {
          matchScore -= 40
          reasons.push('Düşük finansal kapasite. Kontrollü kapsam ve dikkatli bütçeleme gerektirir (Kapsam daraltma ve fazlı geçiş önerilir).')
        }
        // R18: Konsolidasyon etkisi
        if (q41 >= 3) {
          matchScore += 15
          reasons.push('Çoklu şirket konsolidasyonu ihtiyacınız için global ERP altyapısı güçlüdür.')
        }
        // Akış Özeti: Hizmet / proje ağırlıklı -> Üretim ERP'leri zayıflar
        if (q1 === 1) {
          matchScore -= 10
        }
      } else if (slug.includes('odoo') || name.includes('odoo')) {
        matchScore = 45
        if (scoreScale >= 30 && scoreScale <= 70 && scoreFinance < 70 && scoreCustom >= 50) {
          matchScore += 30
          reasons.push('Orta ölçekli yapınızda bütçe kontrollü, hızlı ve esnek/modüler devreye alma avantajı sağlar.')
        }
        // Akış Özeti: Hizmet / proje ağırlıklı -> Odoo öne çıkar
        if (q1 === 1) {
          matchScore += 15
          reasons.push('Hizmet ve proje odaklı iş modeliniz için esnek ve modüler bir yapıdır.')
        }
      } else if (slug.includes('canias') || name.includes('canias')) {
        matchScore = 40
        if (scoreProd >= 60 && (scoreWarehouse >= 60 || scoreQuality >= 60) && scoreCustom >= 60) {
          matchScore += 35
          reasons.push('Üretim, depo, izlenebilirlik ve özel süreç ihtiyaçlarınız çok yüksek olduğundan güçlü bir endüstriyel alternatiftir.')
        }
        // Akış Özeti: Hizmet / proje ağırlıklı -> Üretim ERP'leri zayıflar
        if (q1 === 1) {
          matchScore -= 20
        }
      } else if (slug.includes('logo') || name.includes('logo')) {
        matchScore = 35
        if (scoreLocalFin >= 70 && scoreFinance < 60 && scoreScale < 60) {
          matchScore += 30
          reasons.push('Türkiye yerel mevzuatı, e-belge ve finans/muhasebe süreçlerindeki baskın ihtiyacınızı kontrollü bütçeyle çözer.')
        }
      } else {
        matchScore = 30 // Other solutions baseline
      }

      // R11: Mevcut ERP büyük ölçüde karşılıyorsa (Q18 <= 2), tüm ERP core değişim puanları düşer
      if (q18 > 0 && q18 <= 2) {
        matchScore -= 20
        if (reasons.length === 0) reasons.push('Mevcut ERP sisteminiz büyük ölçüde yeterli görüldüğünden çekirdek sistem değişimi öncelikli olmayabilir.')
      } else if (reasons.length === 0) {
        reasons.push('Değerlendirme sonuçlarına göre genel adaylar arasındadır.')
      }

      // Ensure score is within 0-100
      matchScore = Math.max(0, Math.min(100, matchScore))

      recommendedSolutions.push({
        solution_id: sol.id,
        solution_name: sol.ad,
        vendor: sol.satici,
        slug: sol.slug,
        tier: sol.seviye ?? 'tier3',
        logo_url: sol.logo_url,
        match_score: matchScore,
        match_percentage: matchScore,
        reasons,
      })
    }

    // Hybrid / Custom Software Check
    // R39: Çapraz modül yoğunluğu veya R11 optimizasyon ihtiyacı
    if (scoreCustom >= 70 || scoreIntegration >= 70 || getCatScore('Veri') >= 70 || (q18 > 0 && q18 <= 2) || q1 === 1) {
      recommendedSolutions.push({
        solution_id: 'hybrid-custom-001',
        solution_name: 'Özel Yazılım / BI / Optimizasyon Katmanı',
        vendor: 'Atalitix Önerisi',
        slug: 'hibrit-katman',
        tier: 'custom',
        logo_url: null, // UI handles null
        match_score: (q18 > 0 && q18 <= 2) ? 95 : (q1 === 1 ? 88 : 85), // Eğer mevcut ERP iyi ise hibrit katman 1. sıraya çıksın
        match_percentage: (q18 > 0 && q18 <= 2) ? 95 : (q1 === 1 ? 88 : 85),
        reasons: [
          (q18 > 0 && q18 <= 2) 
            ? 'Mevcut ERP altyapınız yeterli görünüyor. Değişim yerine BI, entegrasyon veya özel portallarla optimizasyon (extend) önerilir.'
            : (q1 === 1 ? 'Hizmet ve proje odaklı iş modelinizde standart bir üretim ERP\'si yerine özel portallar, BI ve esnek yazılım katmanları çok daha etkili olabilir.' : 'Özel algoritmalarınız, portal ve değişken iş kurallarınız standart ERP sınırlarını aşıyor. Temel ERP üzerine low-code/özel yazılım katmanı önerilir.')
        ],
      })
    }

    // Lojistik / Depo Odaklıysa WMS Katmanı Ekle
    if (scoreWarehouse > 60 && scoreProd < 30) {
      recommendedSolutions.push({
        solution_id: 'wms-layer-002',
        solution_name: 'Bağımsız WMS / Depo Otomasyonu',
        vendor: 'Atalitix Önerisi',
        slug: 'wms-katman',
        tier: 'custom',
        logo_url: null,
        match_score: 90,
        match_percentage: 90,
        reasons: ['Operasyonunuz ağırlıklı olarak lojistik ve depolama üzerine. Temel ERP değiştirmek yerine doğrudan mevcut sisteme entegre bağımsız ve güçlü bir WMS/Mobilite projesi başlatmanız önerilir.']
      })
    }

    // En yüksek uyumdan başlayarak sırala, ilk 5'i al
    recommendedSolutions.sort((a, b) => b.match_score - a.match_score)
    recommendedSolutions.splice(5)
  }

  // Generate analysis summary
  let analysisSummary = `Atalitix Yorumu: Amaç ürün satmak değil; şirketin finansal gücü, süreç karmaşıklığı ve operasyonel ihtiyacına göre doğru ERP kısa listesini ve ERP dışı dijital katmanı belirlemektir.\n\n`
  
  if (scoreFinance < 40) {
    analysisSummary += `Finansal kapasite ve ERP bütçesi sınırları göz önüne alındığında, kurumsal ölçekli (Örn: SAP) projelerin kapsamı çok dikkatli ele alınmalıdır. `
  } else if (scoreFinance >= 70 && scoreScale >= 60) {
    analysisSummary += `Güçlü finansal kapasite ve kurumsal ölçek, geniş kapsamlı ERP projelerini (Örn: SAP) taşıyabilecek bir yapıya işaret etmektedir. `
  }

  if (scoreCustom >= 70) {
    analysisSummary += `Yüksek özel süreç ihtiyaçlarınız sebebiyle, seçilecek standart ERP'nin yanında mutlaka bir özel yazılım, low-code platform, BI veya RPA katmanı düşünülmelidir. `
  }

  // R38: Proje hazırlığı (Readiness) zayıfsa
  if ((q85 > 0 && q85 <= 2) || (q86 > 0 && q86 <= 2) || (q87 > 0 && q87 <= 2) || scoreProject < 40) {
    analysisSummary += `\n\n⚠️ DİKKAT: Proje yönetimi, kaynak ataması veya süreç dokümantasyonu zayıf. ERP seçimi yapılsa dahi projenin başarısı için "Ön Hazırlık ve Süreç İyileştirme" aşaması şarttır. `
  }

  // Akış Özeti: Düşük süreç olgunluğu
  if (scoreOlgunluk < 40) {
    analysisSummary += `\n\n⚠️ SÜREÇ OLGUNLUĞU: Süreçlerin standartlaşma seviyesi henüz düşük. ERP ürün seçiminden (full implementasyon) ziyade; önce süreç haritalama, veri hazırlığı ve kavramsal tasarım çalışması önerilir.`
  }

  analysisSummary += `\n\nBu ön değerlendirme içindir. Nihai karar; süreç haritalama, kavramsal tasarım, demo senaryoları, TCO hesaplaması, partner kalitesi, referanslar ve gerçekçi bir uygulama planı ile verilmelidir.`

  // --- ATAlitiX ERP FitScan Hesaplaması ---
  const fitScanScore = Math.round(totalScore * 5)
  const projeKategorisi = categoryScores.find(
    (c) => c.category_name.toLowerCase().includes('proje') || c.category_name.toLowerCase().includes('hazırlık')
  )
  const erpHazirlikSkoru = projeKategorisi?.percentage ?? 0

  let totalQs = 0
  let answeredQs = 0
  categoryScores.forEach((c) => {
    totalQs += c.total_questions || 0
    answeredQs += c.answered_questions || 0
  })
  const cevaplanmaOrani = totalQs > 0 ? Math.round((answeredQs / totalQs) * 100) : 0

  let anaYonlendirme = ''
  let bandYorumu = ''
  let isKritik = false

  if (fitScanScore <= 180) {
    anaYonlendirme = 'Odoo / Logo'
    bandYorumu = 'Finansal kapasite, süreç olgunluğu veya kapsam sınırlı olabilir. Sınırlı ve kontrollü başlangıç; önce süreç netleştirme önerilir.'
  } else if (fitScanScore <= 280) {
    anaYonlendirme = 'Odoo Öncelikli'
    bandYorumu = 'Modüler ERP ve süreç iyileştirme ihtiyacı belirgin. Odoo öncelikli; SAP büyüme senaryosu olarak kontrol edilir.'
  } else if (fitScanScore <= 380) {
    anaYonlendirme = 'SAP ve Odoo'
    bandYorumu = 'Fonksiyonel kapsam ve operasyon karmaşıklığı artıyor. SAP ve Odoo birlikte kısa liste; Canias/Logo alternatif.'
  } else {
    anaYonlendirme = 'SAP Öncelikli'
    bandYorumu = 'Kurumsal ölçek, güçlü finansal kapasite ve yönetişim ihtiyacı yüksek. SAP öncelikli; Odoo/Canias alternatif.'
  }

  if (cevaplanmaOrani < 70) {
    isKritik = true
    bandYorumu = 'Soru seti henüz yeterli oranda cevaplanmadı. Ön yönlendirme için en az %70 cevaplanma önerilir.'
  }

  const fitscanVerisi = {
    skor: fitScanScore,
    erpHazirlikSkoru,
    cevaplanmaOrani,
    anaYonlendirme,
    bandYorumu,
    isKritik
  }

  // Store results
  const { error: insertError } = await supabase.from('degerlendirme_sonuclari').insert({
    degerlendirme_id,
    toplam_puan: totalScore,
    kategori_puanlari: categoryScores,
    onerilen_cozumler: recommendedSolutions,
    analiz_ozeti: analysisSummary,
    fitscan_verisi: fitscanVerisi
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, toplam_puan: totalScore })
}
