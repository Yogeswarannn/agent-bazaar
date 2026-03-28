"use client"
import { motion } from "framer-motion"
import { Check, Info } from "lucide-react"

type Agent = { name: string, role: string, roleColor: string, cost: string }

const agents: Agent[] = [
  { name: "DataMiner Pro", role: "Data Analysis", roleColor: "text-blue-400", cost: "0.030" },
  { name: "CodeCraft AI", role: "Code Generation", roleColor: "text-green-400", cost: "0.050" },
  { name: "DesignSynth", role: "UI Design", roleColor: "text-pink-400", cost: "0.060" },
  { name: "DocuBot", role: "Documentation", roleColor: "text-orange-400", cost: "0.020" },
  { name: "TestRunner X", role: "Testing", roleColor: "text-cyan-400", cost: "0.040" },
]

export default function ExecutionView({ currentStep, logs }: { currentStep: string, logs: any[] }) {
  
  const getStatus = (index: number) => {
    // Basic mock logic based on logs length or step
    if (currentStep === "payment" || currentStep === "verifying" || currentStep === "completed") return "Completed";
    if (currentStep === "executing") {
        const progress = Math.min(100, logs.length * 10);
        if (progress > index * 20 + 20) return "Completed";
        if (progress > index * 20) return "Processing";
    }
    return "Idle";
  }

  return (
    <div className="flex flex-col gap-6 h-full">

      <div className="flex-1 bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white text-lg font-semibold mb-6">Assigned Agents</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent, i) => {
            const status = getStatus(i);
            return (
              <div key={i} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                       <svg className={`w-4 h-4 ${status === 'Completed' ? 'text-[#00FFB2]' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                     </div>
                     <div>
                       <div className="text-white text-sm font-medium">{agent.name}</div>
                       <div className={`text-[10px] ${agent.roleColor}`}>{agent.role}</div>
                     </div>
                   </div>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-white/60 text-xs">$ {agent.cost} ETH</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${
                      status === "Completed" ? "bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20" :
                      status === "Processing" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                      "bg-white/5 text-white/40 border border-white/10"
                    }`}>
                      {status}
                    </span>
                 </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 bg-[#050505] border border-white/10 rounded-2xl overflow-hidden flex flex-col relative font-mono text-[11px] h-[300px]">
        {/* Terminal Header */}
        <div className="bg-[#1A1A20] border-b border-white/5 h-10 flex items-center px-4 justify-between">
           <div className="flex items-center gap-2 text-white/60 font-sans text-xs">
             <span className="text-[#00FFB2]">&gt;_</span> Execution Terminal
           </div>
           <div className="flex gap-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
             <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
             <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
           </div>
        </div>
        
        {/* Terminal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-white/70 font-mono text-[13px]">
           {logs.map((log, i) => {
             const [prefix, ...rest] = log.message.split(": ");
             const content = rest.join(": ");
             
             return (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }} 
                 animate={{ opacity: 1, x: 0 }} 
                 key={i} 
                 className="flex items-start gap-3"
               >
                 <span className="text-white/40 shrink-0">{log.time}</span>
                 {log.type === "info" ? (
                   <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-white/60 shrink-0 mt-0.5 text-[10px] font-sans italic">i</div>
                 ) : (
                   <div className="w-4 h-4 rounded-full border border-[#00FFB2] flex items-center justify-center text-[#00FFB2] shrink-0 mt-0.5">
                     <Check className="w-3 h-3 stroke-[3]" />
                   </div>
                 )}
                 <div className="flex-1 break-words leading-tight">
                   <span className="text-indigo-400 mr-2">{log.agent}</span>
                   {log.type === "success" ? (
                     <span className="text-[#00FFB2]">
                       {prefix}: {content}
                     </span>
                   ) : (
                     <span className="text-white/60">
                       {prefix}: <span className="text-white/60">{content}</span>
                     </span>
                   )}
                 </div>
               </motion.div>
             )
           })}
           {currentStep === "executing" && (
             <div className="text-[#00FFB2] mt-4 flex items-center font-mono text-[13px]">
               $ <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-[1em] bg-[#00FFB2] inline-block align-middle ml-1.5" />
             </div>
           )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-[#1A1A20] border-t border-white/5 h-8 flex items-center px-4 justify-between text-white/40 font-sans text-xs">
          <span>{logs.length} log entries</span>
          <span>{currentStep === "executing" ? "Processing..." : "Ready"}</span>
        </div>
      </div>
    </div>
  )
}
