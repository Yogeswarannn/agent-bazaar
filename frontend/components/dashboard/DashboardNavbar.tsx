"use client"
import { useState, useEffect } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"

export default function DashboardNavbar() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 font-[family-name:var(--font-outfit)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 h-24 flex items-center justify-between">
        
        {/* Left: Logo and text */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 flex items-center justify-center">
             <img src="/logo.png" alt="Taskverse Logo" className="w-full h-full object-contain mix-blend-screen" />
          </div>
          <span className="text-white font-[100] text-[18px] uppercase tracking-widest leading-[1.1]">Taskverse</span>
        </Link>

        {/* Right: Connect Wallet and Profile */}
        <div className="flex items-center gap-4">
          {mounted && (
            <ConnectButton 
              accountStatus="avatar" 
              chainStatus="icon" 
              showBalance={false}
            />
          )}
        </div>

      </div>
    </nav>
  )
}
