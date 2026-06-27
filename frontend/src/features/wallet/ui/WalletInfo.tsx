"use client";

import React from "react";
import { useWallet } from "../hooks";
import { Copy, Check, Wallet } from "lucide-react";

export function WalletInfo() {
  const { address, isConnected, balance } = useWallet();
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="neo-box p-6 bg-white flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 bg-[#b7c6c2] border-2 border-black flex items-center justify-center">
          <Wallet className="h-6 w-6 text-black" />
        </div>
        <div>
          <h3 className="font-black text-xl">No Wallet Connected</h3>
          <p className="text-gray-600 mt-1">Connect your Freighter wallet to interact with EduFundX.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-box p-6 bg-white flex flex-col gap-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ffe17c] border-2 border-black flex items-center justify-center font-black">
            W
          </div>
          <span className="font-black text-lg">My Wallet</span>
        </div>
        <span className="neo-badge bg-[#b7c6c2]">Freighter</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500 font-bold uppercase">Public Address</span>
        <div className="flex items-center justify-between bg-gray-50 border-2 border-black p-2 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="truncate mr-2">{address}</span>
          <button
            onClick={copyToClipboard}
            className="p-1 hover:bg-[#ffe17c] border border-transparent hover:border-black transition-all"
            title="Copy Address"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-bold uppercase">Balance</span>
        <div className="text-3xl font-black">{Number(balance).toFixed(4)} XLM</div>
      </div>
    </div>
  );
}
