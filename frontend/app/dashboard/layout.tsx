import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Agent Bazaar",
  description: "Agent Workflow Dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-[#00FFB2]/30 font-[family-name:var(--font-outfit)]">
      {/* Dynamic Background Noise/Glow (Subtle) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00FFB2]/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00FFB2]/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 pt-[100px] pb-20 px-4 sm:px-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
