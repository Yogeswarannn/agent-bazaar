"use client"
import { motion } from "framer-motion"

export default function Stats() {
  const stats = [
    { label: "Uptime", value: "99.9%" },
    { label: "Deploy", value: "150+" },
    { label: "Energy", value: "-37%" }
  ]

  return (
    <section className="border-t border-b border-white/5 bg-white/[0.01]">
      <div className="py-12 max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 z-10 relative">
        {stats.map((s, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            key={i}
            className="flex flex-col items-center justify-center py-6 md:py-0"
          >
            <span className="text-white/40 text-sm font-medium tracking-wide mb-2 uppercase">{s.label}</span>
            <span className="text-4xl lg:text-5xl font-light text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {s.value}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
