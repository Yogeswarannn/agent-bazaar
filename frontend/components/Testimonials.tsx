"use client"
import { motion } from "framer-motion"

export default function Testimonials() {
  const testimonials = [
    {
      name: "Elara V.",
      role: "CTO, NovaCore",
      text: "Celestia gave us a level field, speed, and scale we've never seen before. We scaled effortlessly without breaking a sweat.",
    },
    {
      name: "Adrian T.",
      role: "Product Director",
      text: "Working with Celestia feels like peering into the future. The seamless AI integrations have streamlined our entire operational flow.",
    },
    {
      name: "Zoe T.",
      role: "Founder, Ayla Finance",
      text: "From architecture logic, everything is built with precision and intent. We launched our platform months ahead of schedule.",
    }
  ]

  return (
    <section className="py-24 max-w-7xl mx-auto px-6 sm:px-12 relative z-10">
      <div className="flex flex-col lg:flex-row gap-16 justify-between items-start">
        
        {/* Left Side: Title */}
        <div className="lg:w-1/3">
           <motion.h2 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="text-4xl lg:text-5xl font-light leading-tight text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
           >
             Voices from the <br/>
             <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">Edge of Innovation</span>
           </motion.h2>
           <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="flex gap-4"
           >
              <div className="w-12 h-1 bg-white/20 rounded-full" />
              <div className="w-4 h-1 bg-[#00FFB2]/50 rounded-full" />
              <div className="w-4 h-1 bg-[#FF3D5A]/50 rounded-full" />
           </motion.div>
        </div>

        {/* Right Side: Grid of Testimonials */}
        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
           {testimonials.map((t, i) => (
              <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: i * 0.15 }}
                 key={i}
                 className="glass p-8 rounded-3xl flex flex-col justify-between h-[280px]"
              >
                 <p className="text-white/60 leading-relaxed text-sm mb-8">
                   "{t.text}"
                 </p>
                 <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-bl from-white/20 to-transparent border border-white/20"></div>
                    <div>
                      <h4 className="text-white text-sm font-semibold">{t.name}</h4>
                      <p className="text-white/40 text-xs">{t.role}</p>
                    </div>
                 </div>
              </motion.div>
           ))}
        </div>
      </div>
    </section>
  )
}
