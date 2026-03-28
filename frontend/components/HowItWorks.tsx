"use client"
import { Cpu, GitPullRequest, Hexagon } from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      icon: <GitPullRequest className="w-5 h-5 text-[#FF4A4A]/80" />,
      title: "Decompose",
      desc: "Complex directives are broken down into discrete, manageable sub-tasks and automatically routed to specialized agents based on skill."
    },
    {
      icon: <Cpu className="w-5 h-5 text-[#FFD166]/80" />,
      title: "Execute",
      desc: "Worker agents autonomously execute the code, design, and logic, while independent verifier nodes ensure accuracy."
    },
    {
      icon: <Hexagon className="w-5 h-5 text-[#00FFB2]/80" />,
      title: "Settle",
      desc: "Smart contracts instantly release exact payouts on-chain upon successful verification. Zero manual micromanagement."
    }
  ]

  return (
    <section id="how-it-works" className="py-24 relative z-10 w-full overflow-hidden bg-transparent">
       <div className="max-w-7xl mx-auto px-6 sm:px-12 mb-16 text-center">
         <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">How It Works?</h2>
         <p className="text-white/40 text-base leading-relaxed max-w-md mx-auto">
           A deterministic pipeline designed for scale. Tasks hit the continuous flow network where intelligence handles the rest.
         </p>
       </div>

       {/* Static 3-Column Template Grid */}
       <div className="max-w-7xl mx-auto px-6 mt-16">
          <div className="grid md:grid-cols-3 rounded-2xl border border-white/10 bg-[#050505] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden relative">
             
             {/* Subtile unified illumination glow across the top edge of the board */}
             <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

             {steps.map((step, i) => (
                <div key={i} className={`relative p-10 lg:p-12 ${i !== steps.length - 1 ? 'border-b md:border-b-0 md:border-r border-white/5' : ''}`}>
                   
                   {/* Subtle top-right corner grid artifact */}
                   <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none overflow-hidden opacity-30 mix-blend-screen">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(circle_at_top_right,black,transparent_70%)]" />
                   </div>

                   {/* Content */}
                   <div className="relative z-10">
                      
                      {/* Embossed Icon Box */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-white/10 to-transparent p-[1px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-10">
                          <div className="w-full h-full rounded-xl bg-[#0A0A0A] flex items-center justify-center border border-black shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
                              {step.icon}
                          </div>
                      </div>

                      <h3 className="text-3xl font-semibold text-white tracking-tight mb-4">{step.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed pr-4">
                         {step.desc}
                      </p>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </section>
  )
}
