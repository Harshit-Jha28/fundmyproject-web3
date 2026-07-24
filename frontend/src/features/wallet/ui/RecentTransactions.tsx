"use client";

import React, { useState, useEffect } from "react";
import { getTransactions, SavedTransaction, getExplorerTxUrl } from "@/shared/lib/utils";
import { Clock, ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function RecentTransactions() {
  const [txs, setTxs] = useState<SavedTransaction[]>([]);

  useEffect(() => {
    setTxs(getTransactions());

    const handleNewTx = () => {
      setTxs(getTransactions());
    };

    window.addEventListener("edufundx_new_tx", handleNewTx);
    return () => {
      window.removeEventListener("edufundx_new_tx", handleNewTx);
    };
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (txs.length === 0) {
    return null; // Don't show anything if there are no transactions
  }

  return (
    <div className="neo-box p-6 bg-white flex flex-col gap-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-black" />
          <span className="font-black text-lg uppercase">Recent Activity</span>
        </div>
        <span className="neo-badge bg-[#ffe17c]">{txs.length}</span>
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
        {txs.map((tx, idx) => (
          <div key={tx.hash + idx} className="border-2 border-black p-3 bg-gray-50 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="font-black text-xs uppercase tracking-wider text-black">
                {tx.type}
              </span>
              <span className="text-[10px] text-gray-500 font-bold">
                {formatTime(tx.timestamp)}
              </span>
            </div>
            
            <div className="font-mono text-[10px] text-gray-600 break-all bg-white border border-black/10 p-1.5 select-all">
              {tx.hash.slice(0, 10)}...{tx.hash.slice(-10)}
            </div>

            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto justify-start text-xs text-primary hover:text-primary/80 font-black gap-1 uppercase"
              asChild
            >
              <a
                href={getExplorerTxUrl(tx.hash)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View transaction ${tx.hash} details on Stellar Expert`}
              >
                Transaction Details
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
