import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Taskverse",
  description: "Agent Workflow Dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-[#00FFB2]/30 font-[family-name:var(--font-outfit)]">
      <div className="fixed inset-0 z-0 pointer-events-none w-full h-full bg-gradient-to-b from-[#050505] to-[#0A0A0A]">
         {/* Center Glow */}
         <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,150,50,0.15)_0%,rgba(255,50,150,0.1)_40%,rgba(50,100,255,0.05)_70%,transparent_100%)] blur-[100px] mix-blend-screen rounded-full" />
         
         {/* Depth Panels */}
         <div className="absolute top-1/4 -left-32 w-[400px] h-[500px] bg-white/[0.06] blur-[60px] rounded-full rotate-45" />
         <div className="absolute bottom-1/4 -right-32 w-[500px] h-[600px] bg-white/[0.05] blur-[80px] rounded-full -rotate-45" />

         {/* Vignette & Grain */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000_100%)] opacity-80 mix-blend-multiply" />
         <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"}}></div>
      </div>

      <div className="relative z-10 pt-[100px] pb-20 px-4 sm:px-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
