"use client";

import { useToast } from "@/shared/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/shared/ui/toast";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { getExplorerTxUrl } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case "destructive":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, txHash, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(variant)}</div>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {txHash && (
                <div className="mt-2 flex flex-col gap-1">
                  <span className="font-mono text-[10px] opacity-70 break-all select-all">
                    Hash: {txHash.slice(0, 8)}...{txHash.slice(-8)}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto justify-start text-xs text-[#ffe17c] hover:text-[#ffe17c]/80 underline"
                    asChild
                  >
                    <a
                      href={getExplorerTxUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View transaction on Stellar Expert"
                    >
                      View on Stellar Expert
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
