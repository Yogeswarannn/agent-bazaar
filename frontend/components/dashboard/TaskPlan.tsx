import { CheckCircle2, Circle } from "lucide-react"

export default function TaskPlan({ task, currentStep }: { task: string, currentStep: string }) {
  const isDone = (index: number) => {
    // For mock, subtasks are done if we are past 'planning'
    if (currentStep === "completed" || currentStep === "payment" || currentStep === "verifying" || currentStep === "executing") {
       return true;
    }
    return false;
  }

  const subtasks = [
    { title: "Analyze Requirements", agent: "DataMiner Pro", cost: 0.03 },
    { title: "Generate Code Structure", agent: "CodeCraft AI", cost: 0.05 },
    { title: "Design UI Components", agent: "DesignSynth", cost: 0.06 },
    { title: "Create Documentation", agent: "DocuBot", cost: 0.02 },
    { title: "Run Tests", agent: "TestRunner X", cost: 0.04 },
  ]

  return (
    <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-[#00FFB2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <h3 className="text-white text-lg font-semibold">Task Plan</h3>
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6">
        <div className="text-white/40 text-xs mb-2">Original Task</div>
        <div className="text-white text-sm leading-relaxed">{task || "Build a REST API for user authentication with JWT tokens"}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
           <div className="text-white/40 text-xs mb-1">Subtasks</div>
           <div className="text-white font-bold text-xl">5</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
           <div className="text-white/40 text-xs mb-1">Agents</div>
           <div className="text-white font-bold text-xl">5</div>
        </div>
        <div className="bg-[#00FFB2]/5 border border-[#00FFB2]/20 rounded-xl p-3 flex flex-col items-center justify-center">
           <div className="text-[#00FFB2]/60 text-xs mb-1">$ Total Cost</div>
           <div className="text-[#00FFB2] font-bold text-xl">0.200</div>
        </div>
      </div>

      <h4 className="text-white/80 text-sm font-medium mb-4">Subtasks Breakdown</h4>
      
      <div className="space-y-3">
        {subtasks.map((st, i) => (
          <div key={i} className="flex gap-4">
            <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isDone(i) ? "bg-[#00FFB2]/20 text-[#00FFB2]" : "bg-white/10 text-white/40"
            }`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <h5 className="text-white text-sm font-medium">{st.title}</h5>
              <p className="text-white/40 text-xs mt-1 mb-2">Break down the task requirements and identify key components</p>
              <div className="bg-white/5 border border-white/5 rounded-lg py-1.5 px-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded pl-0.5 flex items-center justify-center ${isDone(i)? "text-[#00FFB2]" : "text-white/40"}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <span className="text-white/70 text-xs">{st.agent}</span>
                </div>
                <span className="text-white/40 text-xs">${st.cost}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
