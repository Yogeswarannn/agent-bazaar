"use client"
import RadialOrbitalTimeline, { TimelineItem } from "@/components/ui/radial-orbital-timeline"
import { Code, Database, ShieldCheck, Flame, Cpu, Search } from "lucide-react"

export default function AgentsSection() {
  const agentsData: TimelineItem[] = [
    {
      id: 1,
      title: "CodeWriter-7B",
      date: "0.05 ETH / RUN",
      content: "Code Generation - Generates highly optimized, intelligent, and bug-free smart contracts and frontend scripts dynamically on the fly based on user prompts.",
      category: "Development",
      icon: Code,
      relatedIds: [2, 3],
      status: "in-progress",
      energy: 85,
    },
    {
      id: 2,
      title: "DataAnalyzer-X",
      date: "0.03 ETH / RUN",
      content: "Data Analysis - Ingests large context logs, normalizes unstructured information, and creates precise logical pipelines for the execution agents.",
      category: "Data",
      icon: Database,
      relatedIds: [1, 3],
      status: "completed",
      energy: 95,
    },
    {
      id: 3,
      title: "VerifyBot-Pro",
      date: "0.02 ETH / RUN",
      content: "Verification Node - The final authority. Runs comprehensive unit tests, security audits, and approves the final payout hash immediately upon passing criteria.",
      category: "Security",
      icon: ShieldCheck,
      relatedIds: [1, 2, 5],
      status: "completed",
      energy: 100,
    },
    {
      id: 4,
      title: "DeployMaster-V1",
      date: "0.04 ETH / RUN",
      content: "DevOps & Deployment - Automatically deploys compiled, verified smart contracts and application code to mainnet or testnet RPCs.",
      category: "Infrastructure",
      icon: Cpu,
      relatedIds: [1, 3],
      status: "pending",
      energy: 70,
    },
    {
      id: 5,
      title: "LogicAuditor-Zero",
      date: "0.06 ETH / RUN",
      content: "Security Auditing - Conducts deep static analysis, formal verification, and vulnerability scanning for complex logic prior to verify bots taking over.",
      category: "Security",
      icon: Flame,
      relatedIds: [1, 3],
      status: "pending",
      energy: 90,
    },
    {
      id: 6,
      title: "DataScraper-Pro",
      date: "0.01 ETH / RUN",
      content: "Web Intelligence - Autonomously crawls off-chain data sources, aggregates intelligence, and feeds verifiable metadata into network oracles.",
      category: "Data",
      icon: Search,
      relatedIds: [2],
      status: "completed",
      energy: 40,
    }
  ];

  return (
    <section id="agents" className="pt-24 pb-4 w-full relative z-10 flex flex-col items-center justify-center overflow-hidden bg-transparent">
       
       <div className="absolute inset-0 z-[-1] pointer-events-none flex items-center justify-center">
          {/* Faint radial depth glow to support the UI */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(50,20,100,0.06)_0%,rgba(20,50,150,0.02)_50%,transparent_100%)] blur-[40px] mix-blend-screen rounded-full" />
       </div>

       <div className="text-center mb-2 relative z-30">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] mb-4">
             Agents
          </h2>
          <p className="text-white/40 text-sm md:text-base leading-relaxed max-w-lg mx-auto font-medium">
             Interact with the specialized execution agents operating on the network.
          </p>
       </div>

       <div className="w-full max-w-7xl mx-auto -mt-16">
          <RadialOrbitalTimeline timelineData={agentsData} />
       </div>

    </section>
  )
}
