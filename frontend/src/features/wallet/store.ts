import { create } from "zustand";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: "testnet" | "mainnet" | "local";
  balance: string;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  setAddress: (address: string | null) => void;
  setConnected: (isConnected: boolean) => void;
  setNetwork: (network: "testnet" | "mainnet" | "local") => void;
  setBalance: (balance: string) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  network: "testnet",
  balance: "0",
  isConnecting: false,
  error: null,

  setAddress: (address) => set({ address, isConnected: !!address }),
  setConnected: (isConnected) => set({ isConnected }),
  setNetwork: (network) => set({ network }),
  setBalance: (balance) => set({ balance }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),
  reset: () => set({ address: null, isConnected: false, balance: "0", error: null }),
}));
