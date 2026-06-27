import type { Metadata } from 'next'
import { Kart, KartBasligi, KartIcerigi } from '@/components/arayuz'

export const metadata: Metadata = { title: 'Kullanım Rehberi' }

const guideSteps = [
  {
    step: 1,
    title: 'Soru Seti Sayfasını Doldurun',
    description: 'Her soru için belirlenen ağırlığa göre seçenekleri işaretleyin. Seçenekler 1, 3 ve 5 puan arasında değişmektedir. Düşük gereksinimler için 1, orta için 3, kritik ve yüksek karmaşıklık gerektiren süreçler için 5 puanlık seçeneği seçin.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Ciro ve Finansal Sorulara Özellikle Dikkat Edin',
    description: 'ERP seçimi sadece ihtiyaçlarla değil; ciro, kârlılık, gelir-gider dengesi, yatırım bütçesi ve iç kaynak kapasitesiyle birlikte değerlendirilir. Algoritma, yüksek bir finansal kapasite tespit etmezse kurumsal ölçekli projeler (SAP vb.) için uyarı üretir.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Skor Özeti Sayfasını Kontrol Edin',
    description: 'Değerlendirmeyi tamamladıktan sonra kategori bazlı 0–100 arası yüzdelik skorlarınızı inceleyin. Bu skorlar, hangi departman veya süreçte karmaşıklığın veya dijitalleşme ihtiyacının yüksek olduğunu size noktasal olarak gösterecektir.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Sonuçlar Sayfasındaki Yönlendirmeyi Okuyun',
    description: 'Analiz motoru, verdiğiniz cevaplar ve kategorik ağırlıklara göre bir ERP (SAP, Odoo, Logo, Canias vb.) kısa listesi üretir. Hatta özel süreçleriniz çok yüksekse standart ERP yerine "Özel Yazılım / Hibrit Katman" tavsiyesinde bulunur.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    step: 5,
    title: 'Sonucu Nihai Karar Olarak Kullanmayın',
    description: 'Bu ön değerlendirme modeli, projelerin başındaki ilk keşif ve kısa listeyi (shortlist) daraltmak için tasarlanmıştır. Nihai seçim için detaylı süreç haritalama, kavramsal tasarım, demo senaryoları, iş ortakları kalitesi ve TCO (Toplam Sahip Olma Maliyeti) analizleri zorunludur.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
]

export default function GuidePage() {
  return (
    <div className="space-y-8 animate-fade-up max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Sistem Kullanım Rehberi</h1>
        <p className="text-slate-600">
          Atalitix ERP Ön Değerlendirme ve Karar Destek Aracı&apos;nı en verimli şekilde kullanmak için aşağıdaki adımları izleyin.
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-0 bottom-0 left-8 w-px bg-slate-200 md:left-1/2 md:-ml-px hidden md:block"></div>
        
        <div className="space-y-8 relative">
          {guideSteps.map((item, idx) => (
            <div key={item.step} className={`relative flex items-center md:justify-between ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className="hidden md:block w-5/12"></div>
              
              {/* Timeline dot */}
              <div className="absolute left-4 md:left-1/2 -ml-6 w-12 h-12 rounded-full border-4 border-[#f8f9fc] bg-white shadow-sm flex items-center justify-center text-blue-600 z-10 shrink-0">
                {item.icon}
              </div>
              
              <div className="w-full pl-20 md:pl-0 md:w-5/12">
                <Kart className="p-6 border border-slate-200 hover:border-blue-300 transition-colors bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                      {item.step}
                    </span>
                    <h3 className="font-semibold text-slate-800">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </Kart>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
