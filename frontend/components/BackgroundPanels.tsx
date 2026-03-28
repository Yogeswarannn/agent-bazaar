"use client"
import { motion } from "framer-motion"

export default function BackgroundPanels() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none perspective-[1200px]">
       
       {/* LEFT STACKED PANELS */}
       <motion.div 
         initial={{ x: -100, opacity: 0, rotateY: 15 }}
         animate={{ x: -60, opacity: 1, rotateY: 15 }}
         transition={{ duration: 1.5, ease: "easeOut" }}
         className="absolute top-[20%] left-0 w-[400px] hidden lg:flex flex-col gap-6 opacity-30 blur-[2px] transition-transform"
       >
          <div className="h-[250px] w-full glass-subtle rounded-3xl p-6 border border-white/5 shadow-[50px_0_100px_rgba(0,0,0,0.8)]">
             <div className="w-10 h-10 bg-white/5 rounded mx-auto mb-4" />
             <h4 className="text-white text-lg font-medium text-center leading-tight mb-2">Revolutionizing<br/>Digital Transactions</h4>
             <div className="w-full h-[80px] mt-4 flex justify-between items-end px-4">
                {/* Mock chart bars */}
                <div className="w-4 h-full bg-[#00FFB2]/20 rounded" />
                <div className="w-4 h-[60%] bg-[#00FFB2]/40 rounded" />
                <div className="w-4 h-[80%] bg-[#00FFB2]/60 rounded" />
                <div className="w-4 h-[40%] bg-white/20 rounded" />
             </div>
          </div>
          
          <div className="h-[200px] w-[90%] glass-subtle rounded-3xl p-6 border border-white/5 shadow-[50px_0_100px_rgba(0,0,0,0.8)] mx-auto blur-[1px]">
             <h4 className="text-white text-sm font-medium">The Ultimate Blockchain Ecosystem</h4>
             <div className="mt-4 w-full h-[60px] bg-white/[0.02] border border-white/5 rounded-lg flex items-center px-4 overflow-hidden relative">
                <div className="w-[80%] h-1 bg-[#4A90E2]/50 rounded-full" />
             </div>
          </div>
       </motion.div>

       {/* RIGHT STACKED PANELS */}
       <motion.div 
         initial={{ x: 100, opacity: 0, rotateY: -15 }}
         animate={{ x: 60, opacity: 1, rotateY: -15 }}
         transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
         className="absolute top-[30%] right-0 w-[350px] hidden lg:flex flex-col gap-6 opacity-25 blur-[3px] transition-transform"
       >
         <div className="h-[300px] w-full glass-subtle rounded-3xl p-8 border border-white/5 shadow-[-50px_0_100px_rgba(0,0,0,0.8)] flex flex-col items-center">
            <div className="w-[150px] h-[150px] rounded-[100%] bg-gradient-to-br from-white/10 to-transparent border-t border-white/20 blur-sm shadow-inner rotate-45 mb-4" />
            <p className="text-white text-xs text-center border-t border-white/10 pt-4 w-full">
               Hyper is shaping a trustless economy. It is the backbone of the new era of logic.
            </p>
         </div>
       </motion.div>

    </div>
  )
}
