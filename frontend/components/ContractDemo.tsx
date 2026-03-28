"use client";

import * as React from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SEPOLIA_ADDRESSES, JobManagerABI } from '@/lib/contracts';

export default function ContractDemo() {
  const [mounted, setMounted] = React.useState(false);
  const { isConnected } = useAccount();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Query nextJobId from JobManager smart contract
  const { data: nextJobId, isLoading, isError } = useReadContract({
    address: SEPOLIA_ADDRESSES.JobManager as `0x${string}`,
    abi: JobManagerABI,
    functionName: 'nextJobId',
    query: {
       enabled: mounted && isConnected // Only query network when a wallet connects!
    }
  });

  // Prevent Hydration mismatch: return null or a skeleton until client-side mount
  if (!mounted) return null;

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-10 mt-20 border border-white/10 rounded-xl bg-white/5 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Smart Contract Integration Demo
          </h2>
          <p className="text-white/60 mt-2 text-sm max-w-md">
            Connecting real-time directly to our deployed JobManager Contract on the Sepolia Testnet.
          </p>
        </div>

        <div>
          <ConnectButton />
        </div>
      </div>

      <div className="mt-8 p-6 bg-black/40 rounded-lg border border-white/5 font-mono text-sm leading-relaxed overflow-x-auto">
        <p className="text-emerald-400 mb-4">// System Read Data: `JobManager` (Address: {SEPOLIA_ADDRESSES.JobManager})</p>
        
        <div className="flex gap-4 items-center">
            <span className="text-white/50">Next Job ID:</span>
            {!isConnected && <span className="text-yellow-400 px-3 py-1 bg-yellow-400/10 rounded-full text-xs">Wallet Disconnected</span>}
            {isConnected && isLoading && <span className="animate-pulse text-white/70">Fetching from Blockchain...</span>}
            {isConnected && isError && <span className="text-red-400">Error reading contract! (Are you on Sepolia?)</span>}
            {isConnected && nextJobId !== undefined && (
                <span className="text-cyan-400 font-bold">{nextJobId.toString()}</span>
            )}
        </div>
      </div>
    </section>
  );
}
