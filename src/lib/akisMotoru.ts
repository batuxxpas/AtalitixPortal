import type { Kural, KuralKosulGrubu, KuralKosul } from '@/types'

export function getHiddenQuestionIds(
  answers: Record<string, string[]>,
  categories: any[],
  kurallar: Kural[]
): Set<string> {
  const visible = new Set<string>()
  const mustHide = new Set<string>()

  // Q kodundan ID'ye ve ID'den maksimum puana erişim
  const qCodeToId = new Map<string, string>()
  
  for (const cat of categories) {
    for (const q of (cat.sorular ?? [])) {
      if (q.kod) {
        qCodeToId.set(q.kod, q.id)
      }
    }
  }

  const getQValue = (qCode: string): number => {
    const qId = qCodeToId.get(qCode)
    if (!qId) return 0
    
    const selectedOptionIds = answers[qId]
    if (!selectedOptionIds || selectedOptionIds.length === 0) return 0

    for (const cat of categories) {
      const q = (cat.sorular ?? []).find((sq: any) => sq.id === qId)
      if (q) {
        let maxVal = 0
        for (const optId of selectedOptionIds) {
          const opt = (q.secenekler ?? []).find((o: any) => o.id === optId)
          if (opt && opt.deger > maxVal) maxVal = opt.deger
        }
        return maxVal
      }
    }
    return 0
  }

  const evaluateCondition = (kosul: KuralKosul): boolean => {
    if (kosul.kural_tipi === 'baslangic') return true
    if (!kosul.soru_kodu) return false
    
    const val = getQValue(kosul.soru_kodu)
    if (val === 0) return false // Not answered

    switch (kosul.operator) {
      case 'eq': return val === kosul.deger
      case 'gt': return val > kosul.deger
      case 'gte': return val >= kosul.deger
      case 'lt': return val < kosul.deger
      case 'lte': return val <= kosul.deger
      default: return false
    }
  }

  const evaluateConditionGroup = (grup: KuralKosulGrubu): boolean => {
    if (!grup || !grup.kosullar || grup.kosullar.length === 0) return false
    
    if (grup.mantik === 'OR') {
      return grup.kosullar.some(evaluateCondition)
    }
    // Default is AND
    return grup.kosullar.every(evaluateCondition)
  }

  // 1. Kuralları değerlendir
  for (const kural of kurallar) {
    if (!kural.aktif_mi) continue
    
    const isMatched = evaluateConditionGroup(kural.tetikleyici_kosullar)
    
    if (isMatched) {
      if (kural.acilacak_sorular) {
        kural.acilacak_sorular.forEach(kod => {
          const id = qCodeToId.get(kod)
          if (id) visible.add(id)
        })
      }
      if (kural.kapanacak_sorular) {
        kural.kapanacak_sorular.forEach(kod => {
          const id = qCodeToId.get(kod)
          if (id) mustHide.add(id)
        })
      }
    }
  }

  // 2. Nihai görünür listesi
  const finalHidden = new Set<string>()
  for (const id of qCodeToId.values()) {
    if (!visible.has(id) || mustHide.has(id)) {
      finalHidden.add(id)
    }
  }

  return finalHidden
}
