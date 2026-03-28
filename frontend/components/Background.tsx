"use client"
import { motion } from "framer-motion"

export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050505] pointer-events-none">
      {/* Dark base radial map */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,5,5,0)_0%,rgba(5,5,5,1)_100%)] z-10" />

      {/* Glowing Orb 1 - Greenish/Blue */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,178,0.15)_0%,transparent_60%)] blur-[80px]"
      />

      {/* Glowing Orb 2 - Reddish/Pink */}
      <motion.div
        animate={{
          y: [0, 40, 0],
          x: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,61,90,0.15)_0%,transparent_60%)] blur-[100px]"
      />
      
      {/* Orb rings / orbital path */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full border border-white/[0.03] shadow-[0_0_80px_rgba(0,255,178,0.05)]"
      />
    </div>
  )
}
