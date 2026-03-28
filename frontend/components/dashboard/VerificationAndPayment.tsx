"use client"
import { Check } from "lucide-react"

export default function VerificationAndPayment({ currentStep, onReleasePayment }: { currentStep: string, onReleasePayment: () => void }) {
  
  const showVerification = currentStep === "verifying" || currentStep === "payment" || currentStep === "completed";
  const showPayment = currentStep === "payment" || currentStep === "completed";

  return (
    <div className="flex flex-col gap-6 h-full font-[family-name:var(--font-outfit)]">
      
      {/* Verification Results */}
      {showVerification && (
        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-[#00FFB2]">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-white text-lg font-semibold">Verification Results</h3>
          </div>

          <div className="bg-gradient-to-br from-[#00FFB2]/5 to-transparent border border-[#00FFB2]/20 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-6">
             <div className="w-16 h-16 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-[#00FFB2]" />
             </div>
             <div className="text-[#00FFB2] text-xl font-bold mb-1">Verified</div>
             <div className="text-white/60 text-sm">All outputs meet quality standards</div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6">
             <div className="flex justify-between items-end mb-2">
                <div className="text-white/40 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  Overall Score
                </div>
                <div className="text-[#00FFB2] font-semibold">95%</div>
             </div>
             <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="w-[95%] h-full bg-[#00FFB2]" />
             </div>
          </div>

          <div className="flex justify-between text-xs font-semibold mb-3">
             <span className="text-white/80">Subtask Verification</span>
             <span className="text-white/40">5/5 passed (100%)</span>
          </div>
          
          <div className="space-y-2">
             {[1,2,3].map(i => (
               <div key={i} className="flex gap-3 items-start">
                  <Check className="w-4 h-4 text-[#00FFB2] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium">Subtask {i}</div>
                    <div className="text-white/40 text-[11px]">Output meets quality standards and requirements</div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Smart Contract Payment */}
      {showPayment && (
        <div className="bg-[#0F0F12] border border-[#00FFB2]/20 rounded-2xl p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-8 text-[#00FFB2]">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-white text-lg font-semibold">Smart Contract Payment</h3>
          </div>

          <div className="bg-black/60 border border-white/5 rounded-xl p-6 mb-8">
             <div className="flex items-center justify-between px-4">
                <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                   </div>
                   <span className="text-white/60 text-[11px] uppercase tracking-wider">Escrowed</span>
                </div>
                
                <div className="w-8 h-[1px] bg-white/20" />
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <div className="w-8 h-[1px] bg-[#00FFB2]/50" />

                <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center text-[#00FFB2] mb-2">
                      <Check className="w-5 h-5" />
                   </div>
                   <span className="text-white text-[11px] uppercase tracking-wider">Verified</span>
                </div>

                <div className="w-8 h-[1px] bg-white/20" />
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <div className="w-8 h-[1px] bg-white/20" />

                <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </div>
                   <span className="text-white/40 text-[11px] uppercase tracking-wider">Released</span>
                </div>
             </div>
          </div>

          <div className="text-center mb-8">
             <div className="text-white/50 text-xs mb-1">Total Payment</div>
             <div className="text-[#00FFB2] text-4xl font-bold tracking-tight mb-2">0.200 ETH</div>
             <div className="text-white/30 text-sm">~$500.00 USD</div>
          </div>

          <div className="mb-8">
             <h4 className="text-white/80 text-sm font-medium mb-3">Payment Recipients</h4>
             <div className="space-y-2">
                <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2 text-white/60">
                     <div className="w-5 h-5 rounded bg-green-500/20 text-green-500 flex items-center justify-center">
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                     </div>
                     DataMiner Pro
                   </div>
                   <span className="text-[#00FFB2] font-mono">0.030 ETH</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2 text-white/60">
                     <div className="w-5 h-5 rounded bg-green-500/20 text-green-500 flex items-center justify-center">
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                     </div>
                     CodeCraft AI
                   </div>
                   <span className="text-[#00FFB2] font-mono">0.050 ETH</span>
                </div>
                {/* Plus others for brevity */}
             </div>
          </div>

          <div className="mt-auto">
             {currentStep === "completed" ? (
               <a 
                 href="/"
                 className="w-full bg-white/10 text-white font-semibold flex items-center gap-2 justify-center py-4 rounded-xl hover:bg-white/20 transition-colors"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 Return to Landing Page
               </a>
             ) : (
               <button 
                 onClick={onReleasePayment}
                 className="w-full bg-[#00FFB2] text-black font-semibold py-4 rounded-xl flex items-center gap-2 justify-center hover:bg-[#00FFB2]/90 shadow-[0_0_20px_rgba(0,255,178,0.2)]"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                 Release Payment
               </button>
             )}
             <p className="text-center text-white/30 text-xs mt-4">Powered by Ethereum Smart Contracts</p>
          </div>
        </div>
      )}
    </div>
  )
}
