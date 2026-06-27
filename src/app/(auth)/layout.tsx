export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Simple header with logo (optional, can be inside children) */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/Atalitixlogo.jpeg" alt="Atalitix Logo" className="h-10 object-contain" />
          <span className="font-semibold text-slate-500 tracking-wider text-sm mt-2">PORTAL</span>
        </div>
        
        {children}
      </div>
    </div>
  )
}
