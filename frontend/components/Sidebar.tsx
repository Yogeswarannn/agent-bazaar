"use client"
import { motion } from "framer-motion"
import { LayoutGrid, Fingerprint, Activity } from "lucide-react"

export default function Sidebar() {
  const items = [
    { title: "Neural Frameworks", icon: <LayoutGrid className="w-5 h-5" /> },
    { title: "Interface Intelligence", icon: <Fingerprint className="w-5 h-5" /> },
    { title: "Synthetic Systems", icon: <Activity className="w-5 h-5" /> },
  ]

  return (
    <div className="w-full md:w-[320px] flex flex-col gap-4">
      {items.map((item, i) => (
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           transition={{ delay: i * 0.15, duration: 0.5 }}
           key={i}
           className="glass px-6 py-5 rounded-2xl flex items-center justify-between cursor-pointer group hover:bg-white/[0.05] transition-colors border border-white/5 hover:border-white/10"
        >
          <div className="flex items-center gap-4 text-white/70 group-hover:text-white transition-colors">
            {item.icon}
            <span className="font-medium text-sm">{item.title}</span>
          </div>
          <span className="text-white/20 group-hover:text-[#00FFB2] ml-4 transition-colors">&rarr;</span>
        </motion.div>
      ))}
    </div>
  )
}
