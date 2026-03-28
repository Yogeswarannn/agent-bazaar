"use client"
import { motion } from "framer-motion"
import { Shield, Brain, Terminal, Cpu } from "lucide-react"

export default function AgentsSection() {
  const agents = [
    { title: "Frontend Node", role: "UI/UX Assembly", icon: <Brain className="w-5 h-5" />, color: "#4A90E2" },
    { title: "Backend Core", role: "Logic & API", icon: <Terminal className="w-5 h-5" />, color: "#00FFB2" },
    { title: "DevOps Grid", role: "Deploy & Scale", icon: <Cpu className="w-5 h-5" />, color: "#FF3D5A" },
    { title: "Verification Gate", role: "QA & Security", icon: <Shield className="w-5 h-5" />, color: "#F5A623" },
  ]

  return (
    <section id="agents" className="py-32 w-full relative z-10 flex flex-col items-center justify-center min-h-[70vh] overflow-hidden">
       
       {/* --- NEW NUCLEUS BACKGROUND SYSTEM --- */}
       <div className="absolute inset-0 z-[-1] pointer-events-none flex items-center justify-center">
          
          {/* Faint radial depth glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(50,20,100,0.06)_0%,rgba(20,50,150,0.02)_50%,transparent_100%)] blur-[40px] mix-blend-screen rounded-full" />
          
          {/* Subtle grain */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"}}></div>

          <div className="relative w-[600px] h-[600px] flex items-center justify-center">
             
             {/* Orbital Paths */}
             <div className="absolute inset-[40px] rounded-full border border-white/[0.04] shadow-[0_0_30px_rgba(255,255,255,0.01)_inset]" />
             <div className="absolute inset-[80px] rounded-full border border-white/[0.03]" />
             <div className="absolute inset-[120px] rounded-full border border-white/[0.02]" />

             {/* Orbiting Elements (Exactly 3, 120 degrees apart logic implemented via distinct offset angles and separate rotation tracks) */}
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute inset-[40px] rounded-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.8),0_0_30px_rgba(96,165,250,0.4)] blur-[1px]" />
             </motion.div>
             
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute inset-[80px] rounded-full" style={{ rotate: 120 }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_15px_rgba(192,132,252,0.8),0_0_30px_rgba(192,132,252,0.4)] blur-[1px]" />
             </motion.div>
             
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }} className="absolute inset-[120px] rounded-full" style={{ rotate: 240 }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-pink-400 rounded-full shadow-[0_0_15px_rgba(244,114,182,0.8),0_0_30px_rgba(244,114,182,0.4)] blur-[1.5px]" />
             </motion.div>

             {/* Core Text Block */}
             <div className="relative z-10 text-center flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(5,5,5,0.8)_0%,transparent_100%)] w-[300px] h-[300px] rounded-full">
                <h2 className="text-4xl lg:text-5xl font-bold text-[#FFFFFF] tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] mb-3 relative">
                   <span className="absolute inset-0 blur-[15px] opacity-30 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Agents</span>
                   Agents
                </h2>
                <p className="text-[#A1A1AA] text-sm leading-relaxed max-w-[220px] font-medium">
                   Specialized agents compete based on skills, cost, and reputation.
                </p>
             </div>
          </div>
       </div>

       {/* Existing Valid Cards UI (Completely Untouched Styles) */}
       <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full mt-[120px]">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full perspective-[1500px]">
            {agents.map((ag, i) => (
               <motion.div
                  initial={{ opacity: 0, rotateX: 10, y: 30 }}
                  whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  whileHover={{ y: -10, rotateX: -5 }}
                  key={i}
                  className="relative h-[250px] w-full rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden group transform-style-3d border border-white/5 bg-white/[0.01]"
               >
                  {/* Abstract Data Rings */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-dashed border-white/5 animate-spin-slow opacity-20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] rounded-full border border-white/10 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                  
                  {/* Core Glow Center */}
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] rounded-full blur-[40px] opacity-30 group-hover:opacity-70 transition-opacity duration-500"
                    style={{ backgroundColor: ag.color }}
                  />

                  <div 
                     className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-6 relative z-10 bg-[#0A0A0A] shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                     style={{ color: ag.color, boxShadow: `0 0 15px ${ag.color}40`, borderColor: `${ag.color}50` }}
                  >
                     {ag.icon}
                  </div>
                  
                  <h3 className="text-white/90 font-medium text-lg relative z-10 mb-1">{ag.title}</h3>
                  <p className="text-white/40 text-xs font-light uppercase tracking-widest relative z-10">{ag.role}</p>
               </motion.div>
            ))}
         </div>
       </div>
    </section>
  )
}
