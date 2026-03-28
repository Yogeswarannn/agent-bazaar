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
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 font-[family-name:var(--font-outfit)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 h-[80px] flex items-center justify-between">
        
        {/* Left: Logo and text */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 flex items-center justify-center bg-[#00FFB2]/10 rounded-lg border border-[#00FFB2]/20">
             {/* Simple tech icon for Agent Bazaar */}
             <svg className="w-4 h-4 text-[#00FFB2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
             </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-[500] text-[16px] tracking-wide leading-tight">Agent Bazaar</span>
            <span className="text-white/40 text-[11px] font-mono uppercase tracking-wider">Decentralized AI Marketplace</span>
          </div>
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
