import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import ContractDemo from "@/components/ContractDemo"
import Features from "@/components/Features"
import HowItWorks from "@/components/HowItWorks"
import AgentsSection from "@/components/AgentsSection"

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-transparent selection:bg-[#4A90E2]/30">
      
      {/* Main UI Nav */}
      <Navbar />
      
      {/* Hero with massive BLOCKCHAIN bg */}
      <Hero />
      
      {/* Smart Contract Live Demo Section */}
      <ContractDemo />
      
      {/* 3 Large feature blocks below the Hero */}
      <Features />

      {/* How it works flowing carousel */}
      <HowItWorks />

      {/* Agents interactive glowing grid */}
      <AgentsSection />

      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col items-center justify-center text-white/30 text-[10px] tracking-wide uppercase">
          <p>© {new Date().getFullYear()} Hyper UI. Blockchain Technology Website.</p>
        </div>
      </footer>
    </main>
  )
}