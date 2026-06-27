import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "./store";
import { getXlmBalance } from "@/shared/lib/stellar";
import { toast } from "@/shared/ui/use-toast";
import {
  isConnected as freighterIsConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";

// Local storage key for session persistence
const WALLET_SESSION_KEY = "edufundx_connected_wallet";

// Export the FreighterApi interface for backward compatibility
export interface FreighterApi {}

export function useWallet() {
  const queryClient = useQueryClient();

  // Selected state fields from Zustand to prevent unnecessary re-renders
  const address = useWalletStore((s) => s.address);
  const isConnected = useWalletStore((s) => s.isConnected);
  const balance = useWalletStore((s) => s.balance);
  const isConnecting = useWalletStore((s) => s.isConnecting);
  const error = useWalletStore((s) => s.error);

  // Stable actions from Zustand store
  const setAddress = useWalletStore((s) => s.setAddress);
  const setConnected = useWalletStore((s) => s.setConnected);
  const setBalance = useWalletStore((s) => s.setBalance);
  const setConnecting = useWalletStore((s) => s.setConnecting);
  const setError = useWalletStore((s) => s.setError);
  const reset = useWalletStore((s) => s.reset);

  // Helper to check if Freighter is installed
  const checkInstalled = useCallback(async () => {
    try {
      const installed = await freighterIsConnected();
      return !!installed;
    } catch {
      return false;
    }
  }, []);

  // Primary wallet connection flow
  const connectWallet = useCallback(async (): Promise<string> => {
    // 1. Check if Freighter is installed
    const installed = await freighterIsConnected();
    if (!installed) {
      toast({
        title: "Freighter Not Detected",
        description: "Please install the Freighter browser extension to continue.",
        variant: "destructive",
      });
      throw new Error("Freighter extension is not installed");
    }

    try {
      // 2. Request user authorization to retrieve public key
      const accessResult = await requestAccess();
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }
      
      const address = accessResult.address;
      if (!address || address.length === 0) {
        throw new Error("Wallet connection rejected by user");
      }

      // 3. Verify selected network (Testnet warning if configured)
      const networkDetails = await getNetwork();
      const expectedNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
      
      if (networkDetails && networkDetails.network) {
        const activeNet = networkDetails.network.toLowerCase();
        if (expectedNetwork.toLowerCase() !== activeNet) {
          toast({
            title: "Incorrect Network Selected",
            description: `Please switch your Freighter wallet network to ${expectedNetwork.toUpperCase()}.`,
            variant: "destructive",
          });
        }
      }

      // Save to localStorage for page-refresh recovery
      localStorage.setItem(WALLET_SESSION_KEY, address);

      toast({
        title: "Wallet Connected",
        description: `Connected to Freighter: ${address.slice(0, 4)}...${address.slice(-4)}`,
      });

      return address;
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to authorize wallet access.",
        variant: "destructive",
      });
      throw err;
    }
  }, []);

  // React Query mutation for connecting wallet
  const connectMutation = useMutation({
    mutationFn: connectWallet,
    onMutate: () => {
      setConnecting(true);
      setError(null);
    },
    onSuccess: (connectedAddress: string) => {
      setAddress(connectedAddress);
      setConnected(true);
      setConnecting(false);
      queryClient.invalidateQueries({ queryKey: ["xlm-balance", connectedAddress] });
    },
    onError: (err: any) => {
      setError(err.message || "Freighter connection failed");
      setConnecting(false);
      setConnected(false);
    },
  });

  // Query native XLM balance using the address
  const balanceQuery = useQuery({
    queryKey: ["xlm-balance", address],
    queryFn: () => getXlmBalance(address!),
    enabled: !!address,
    refetchInterval: 15000, // Poll balance every 15s when active
  });

  // Sync balance to store only when it changes to prevent infinite update loops
  useEffect(() => {
    if (balanceQuery.data && balanceQuery.data !== balance) {
      setBalance(balanceQuery.data);
    }
  }, [balanceQuery.data, balance, setBalance]);

  // Disconnect flow
  const disconnect = useCallback(() => {
    const prevAddress = address;
    reset();
    localStorage.removeItem(WALLET_SESSION_KEY);
    queryClient.removeQueries({ queryKey: ["xlm-balance"] });

    if (prevAddress) {
      toast({
        title: "Wallet Disconnected",
        description: "Your session has been terminated.",
      });
    }
  }, [address, reset, queryClient]);

  // Autoconnect on load if session key exists
  const autoConnect = useCallback(async () => {
    if (isConnected && address) return;

    const savedAddress = localStorage.getItem(WALLET_SESSION_KEY);
    if (!savedAddress) return;

    const installed = await freighterIsConnected();
    if (!installed) {
      localStorage.removeItem(WALLET_SESSION_KEY);
      return;
    }

    try {
      // Validate that we still have permissions
      const { address: currentAddress, error: currentError } = await getAddress();
      if (currentAddress && currentAddress === savedAddress && !currentError) {
        setAddress(currentAddress);
        setConnected(true);
        queryClient.invalidateQueries({ queryKey: ["xlm-balance", currentAddress] });
      } else {
        // Clear stale session
        localStorage.removeItem(WALLET_SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(WALLET_SESSION_KEY);
    }
  }, [isConnected, address, setAddress, setConnected, queryClient]);

  useEffect(() => {
    autoConnect();
  }, [autoConnect]);

  // Sign a transaction
  const signTx = useCallback(
    async (xdr: string, networkPassphrase?: string) => {
      if (!address) {
        throw new Error("Wallet is not connected");
      }
      const installed = await freighterIsConnected();
      if (!installed) {
        throw new Error("Freighter wallet is not installed");
      }

      try {
        const passphrase = networkPassphrase || process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
        const { signedTxXdr, error: signError } = await freighterSignTransaction(xdr, {
          networkPassphrase: passphrase,
        });

        if (signError) {
          throw new Error(typeof signError === "string" ? signError : JSON.stringify(signError));
        }

        return signedTxXdr;
      } catch (err: any) {
        throw new Error(err.message || "Transaction signing failed or rejected");
      }
    },
    [address]
  );

  return {
    address,
    isConnected,
    balance,
    isConnecting,
    error,
    connect: connectMutation.mutate,
    disconnect,
    signTransaction: signTx,
    isLoadingBalance: balanceQuery.isLoading,
    checkInstalled,
  };
}

// Watch for changes in wallet configuration periodically
export function useWatchWallet() {
  const { address, connect, disconnect } = useWallet();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkWallet = async () => {
      try {
        const installed = await freighterIsConnected();
        if (installed && address) {
          const { address: currentAddress, error } = await getAddress();
          if (error || !currentAddress) {
            disconnect();
            return;
          }
          if (currentAddress !== address) {
            connect();
          }
        }
      } catch {
        disconnect();
      }
    };

    const interval = setInterval(checkWallet, 4000);
    return () => clearInterval(interval);
  }, [address, connect, disconnect]);
}
