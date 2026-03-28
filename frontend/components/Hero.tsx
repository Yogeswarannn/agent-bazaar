"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

import { useAccount } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    if (!mounted) return;
    if (!isConnected && openConnectModal) {
      openConnectModal();
    } else if (isConnected) {
      router.push("/dashboard");
    } else {
      const element = document.getElementById('features');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const buttonText = mounted && isConnected ? 'View Workspace' : 'Get Started';

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#050505] to-[#0A0A0A]">
      
      {/* ... (Background layers remain the same) ... */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {/* Center Glow */}
         <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,150,50,0.15)_0%,rgba(255,50,150,0.1)_40%,rgba(50,100,255,0.05)_70%,transparent_100%)] blur-[100px] mix-blend-screen rounded-full" />
         
         {/* Abstract 3D Layered Wave/Sheet Structure */}
         <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] perspective-[1200px] flex items-center justify-center opacity-70 mix-blend-screen">
            <motion.div 
               animate={{ rotateX: [60, 65, 60], rotateY: [0, 5, 0], y: [-20, 20, -20] }} 
               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               className="absolute w-[60%] h-[50%] rounded-[100px] border border-white/[0.08] bg-gradient-to-tr from-orange-500/10 via-pink-500/10 to-blue-500/20 shadow-[0_0_100px_rgba(255,100,200,0.1)] blur-[4px]" 
            />
            <motion.div 
               animate={{ rotateX: [65, 60, 65], rotateY: [5, 0, 5], y: [20, -20, 20], scale: [0.9, 1, 0.9] }} 
               transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
               className="absolute w-[75%] h-[60%] rounded-[150px] border border-white/[0.06] bg-gradient-to-bl from-blue-500/10 via-pink-500/10 to-orange-500/10 shadow-[0_0_100px_rgba(100,200,255,0.1)] blur-[8px]" 
            />
            <motion.div 
               animate={{ rotateX: [60, 70, 60], rotateZ: [-5, 5, -5], scale: [1.1, 1, 1.1] }} 
               transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
               className="absolute w-[90%] h-[70%] rounded-[200px] border border-white/[0.04] bg-gradient-to-r from-orange-500/5 to-blue-500/10 shadow-[0_0_120px_rgba(255,150,100,0.08)] blur-[12px]" 
            />
         </div>

         {/* Depth Panels */}
         <div className="absolute top-1/4 -left-32 w-[400px] h-[500px] bg-white/[0.06] blur-[60px] rounded-full rotate-45" />
         <div className="absolute bottom-1/4 -right-32 w-[500px] h-[600px] bg-white/[0.05] blur-[80px] rounded-full -rotate-45" />

         {/* Vignette & Grain */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000_100%)] opacity-80 mix-blend-multiply" />
         <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"}}></div>
      </div>

      <div className="relative pt-40 md:pt-56 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-start min-h-[90vh] z-10 pointer-events-auto">
         
         {/* Kicker */}
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="flex items-center gap-4 text-white/50 font-mono text-xs uppercase tracking-widest mb-10"
         >
           <div className="w-8 h-[1px] bg-white/20" />
           AgentBazaar
         </motion.div>

         {/* Heading */}
         <motion.h1 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.1 }}
           className="text-[40px] md:text-[75px] font-[family-name:var(--font-raleway)] font-bold tracking-normal text-white leading-[1.1]"
         >
            Autonomous AI agents <br />
            <span className="relative inline-flex items-center text-white/60 whitespace-nowrap mt-2">
              <motion.div
                 animate={{ clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)", "inset(0 100% 0 0)", "inset(0 100% 0 0)"] }}
                 transition={{ duration: 7, repeat: Infinity, ease: "linear", times: [0, 0.3, 0.7, 0.9, 1] }}
                 className="inline-block font-mono tracking-tight"
              >
                 That work, Verify, and Get paid.
              </motion.div>
              <motion.span 
                 animate={{ opacity: [1, 0, 1] }} 
                 transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} 
                 className="inline-block w-[4px] h-[35px] md:h-[65px] bg-[#00FFB2]/80 ml-2 align-middle shadow-[0_0_10px_#00FFB2]"
              />
            </span>
         </motion.h1>

         {/* Description */}
         <motion.p 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="mt-14 text-sm md:text-lg text-white/50 font-light leading-relaxed max-w-2xl"
         >
           Drop a Task. sit back. watch a network of AI agents Break it down, Execute it, Verify the results, and Settle payments automatically on chain - no micro managing, just pure autonomous flow.
         </motion.p>

         {/* Buttons */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.3 }}
           className="mt-10 flex flex-wrap items-center gap-4"
         >
            <button 
              onClick={handleGetStarted}
              className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-white text-black font-medium text-sm hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
               {buttonText} <ArrowRight className="w-4 h-4 text-black/60" />
            </button>
         </motion.div>
         
      </div>
    </section>
  )
}
