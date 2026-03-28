"use client";

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  sepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Suppress the non-critical Reown/WalletConnect allowlist dev warning
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  const originalError = console.error;
  const SUPPRESS = ["not found on Allowlist", "Cross-Origin-Opener-Policy"];
  console.warn = (...args: unknown[]) => {
    if (SUPPRESS.some(msg => String(args[0]).includes(msg))) return;
    originalWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    if (SUPPRESS.some(msg => String(args[0]).includes(msg))) return;
    originalError(...args);
  };
}

const config = getDefaultConfig({
  appName: 'Taskverse',
  projectId: 'c01fe4b6ced4d48cecb1c8340d2dedad', 
  chains: [sepolia, mainnet],
  ssr: false, 
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#00FFB2',
          accentColorForeground: 'black',
          borderRadius: 'large',
          fontStack: 'system',
          overlayBlur: 'small',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
