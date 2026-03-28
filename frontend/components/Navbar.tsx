"use client"
import { useState, useEffect } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 font-[family-name:var(--font-outfit)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 h-24 flex items-center justify-between">
        
        {/* Left: Logo and text */}
        <div className="flex items-center gap-1">
          <div className="w-24 h-24 flex items-center justify-center -ml-2">
             <img src="/logo.png" alt="TASKVERSE Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-[100] text-[18px] uppercase tracking-widest leading-[1.1]">TASKVERSE</span>
        </div>

        {/* Center: Menu */}
        <div className="hidden md:flex items-center gap-10 font-[100] text-[18px] text-white/60">
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors duration-300 leading-[1.1]">Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="hover:text-white transition-colors duration-300 leading-[1.1]">How it works</a>
          <a href="#agents" onClick={(e) => scrollToSection(e, 'agents')} className="hover:text-white transition-colors duration-300 leading-[1.1]">Agents</a>
        </div>

        {/* Right: Connect Wallet */}
        <div className="flex items-center gap-6 font-[100]">
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
