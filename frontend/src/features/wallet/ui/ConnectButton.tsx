"use client";

import React from "react";
import { useWallet } from "../hooks";
import { Loader2, Wallet, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export function ConnectButton() {
  const { address, isConnected, isConnecting, connect, disconnect, balance } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <button className="neo-btn-black h-12 gap-2" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="neo-btn h-12 gap-2">
            <Wallet className="h-4 w-4" />
            <span>{formatAddress(address)}</span>
            <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs bg-black text-[#ffe17c] font-black">
              {Number(balance).toFixed(2)} XLM
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="neo-box border-2 border-black rounded-none p-1 bg-white">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(address);
            }}
            className="cursor-pointer font-bold focus:bg-[#ffe17c] focus:text-black rounded-none p-2"
          >
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={disconnect}
            className="cursor-pointer font-bold text-destructive focus:bg-[#ff5f57] focus:text-white rounded-none p-2 gap-2"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button onClick={() => connect()} className="neo-btn-black h-12 gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </button>
  );
}
