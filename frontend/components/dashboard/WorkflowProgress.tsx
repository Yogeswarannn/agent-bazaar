"use client"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

type WorkflowState = "idle" | "submitting" | "planning" | "executing" | "verifying" | "payment" | "completed";

const STEPS = [
  { id: "planning", label: "Planning", desc: "Analyzing task & assigning agents" },
  { id: "executing", label: "Execution", desc: "Agents working on subtasks" },
  { id: "verifying", label: "Verification", desc: "Validating outputs" },
  { id: "payment", label: "Payment", desc: "Releasing funds via smart contract" },
];

export default function WorkflowProgress({ currentState }: { currentState: WorkflowState }) {
  
  if (currentState === "idle" || currentState === "submitting") return null;

  const currentStepIndex = STEPS.findIndex(s => s.id === currentState);
  // If state is not found, we might be in completed or intermediate, let's derive:
  const activeIndex = currentState === "completed" ? 4 : 
                      currentState === "planning" ? 0 :
                      currentState === "executing" ? 1 :
                      currentState === "verifying" ? 2 :
                      currentState === "payment" ? 3 : -1;

  return (
    <div className="w-full bg-[#0F0F12] border border-white/5 rounded-2xl p-6 md:p-8 mb-6">
      <h2 className="text-white text-lg font-semibold mb-8">Workflow Progress</h2>
      
      <div className="flex items-start justify-between relative max-w-4xl mx-auto">
        {/* Connection Lines Container */}
        <div className="absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-white/5 flex">
           {/* Dynamic progress line */}
           <motion.div 
             className="h-full bg-gradient-to-r from-[#00FFB2]/50 to-[#00FFB2]" 
             initial={{ width: "0%" }}
             animate={{ width: `${Math.max(0, activeIndex) * 33.33}%` }}
             transition={{ duration: 1, ease: "easeInOut" }}
           />
        </div>

        {STEPS.map((step, index) => {
          const isDone = index < activeIndex || currentState === "completed";
          const isActive = index === activeIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center w-1/4">
              
              <div className="mb-4 relative">
                {isDone ? (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="w-14 h-14 rounded-full bg-[#00FFB2] text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,255,178,0.4)]"
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </motion.div>
                ) : isActive ? (
                  <div className="w-14 h-14 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/50 flex items-center justify-center relative">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 rounded-full border border-t-[#00FFB2] border-r-transparent border-b-transparent border-l-transparent"
                    />
                    <div className="w-4 h-4 rounded-full bg-[#00FFB2] blur-[4px] opacity-80" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#1A1A20] border border-white/10 flex items-center justify-center" />
                )}
              </div>

              <div className="text-center flex flex-col items-center">
                 <span className={`text-[15px] font-medium ${isActive || isDone ? "text-[#00FFB2]" : "text-white/50"}`}>
                   {step.label}
                 </span>
                 <span className="text-[12px] text-white/40 mt-1 max-w-[120px] leading-tight">
                   {step.desc}
                 </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  )
}
