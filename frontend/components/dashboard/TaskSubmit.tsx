"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Send } from "lucide-react"

export default function TaskSubmit({ onSubmit, isProcessing }: { onSubmit: (task: string) => void, isProcessing: boolean }) {
  const [task, setTask] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  }

  const handleSubmit = () => {
    if (task.trim() && !isProcessing) {
      onSubmit(task.trim());
    }
  }

  return (
    <div className="w-full bg-[#0F0F12] border border-white/5 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00FFB2]/50 to-transparent opacity-50" />
      
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#00FFB2]" />
        <h2 className="text-white text-lg font-semibold tracking-wide">Submit a Task</h2>
      </div>

      <div className="relative">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder="Describe the task you want AI agents to complete..."
          className="w-full h-32 bg-black/40 border border-white/5 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#00FFB2]/30 focus:ring-1 focus:ring-[#00FFB2]/30 resize-none disabled:opacity-50 transition-all font-mono text-sm"
        />
        
        {/* Prompts chips */}
        {!task && !isProcessing && (
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
             <button 
               onClick={() => setTask("Build a REST API for user authentication with JWT tokens")}
               className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 text-xs border border-white/5 transition-colors"
             >
               Build a REST API for user authentic...
             </button>
             <button 
               onClick={() => setTask("Create a data pipeline to analyze customer churn")}
               className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 text-xs border border-white/5 transition-colors hidden sm:block"
             >
               Create a data pipeline to analyze c...
             </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-white/30 text-xs flex items-center gap-1 font-mono">
           Press <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-sans">Cmd</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-sans">Enter</kbd> to submit
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!task.trim() || isProcessing}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
            isProcessing 
              ? "bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20 shadow-[0_0_15px_rgba(0,255,178,0.2)]"
              : "bg-[#00FFB2] text-black hover:bg-[#00FFB2]/90 disabled:opacity-30 disabled:hover:bg-[#00FFB2]"
          }`}
        >
          {isProcessing ? (
             <>
               <div className="w-4 h-4 border-2 border-[#00FFB2] border-t-transparent rounded-full animate-spin" />
               Processing
             </>
          ) : (
             <>
               <Send className="w-4 h-4" />
               Submit Task
             </>
          )}
        </button>
      </div>
      
      {!isProcessing && (
        <p className="text-center text-white/20 text-xs mt-8">Mock data is used when backend is unavailable.</p>
      )}
    </div>
  )
}
