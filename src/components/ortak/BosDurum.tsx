interface BosDurumProps {
  baslik: string
  aciklama?: string
  ikon?: React.ReactNode
  aksiyon?: React.ReactNode
}

export function BosDurum({ baslik, aciklama, ikon, aksiyon }: BosDurumProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {ikon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
          {ikon}
        </div>
      )}
      <h3 className="font-semibold text-slate-300">{baslik}</h3>
      {aciklama && <p className="text-sm text-slate-500 mt-1 max-w-sm">{aciklama}</p>}
      {aksiyon && <div className="mt-4">{aksiyon}</div>}
    </div>
  )
}
