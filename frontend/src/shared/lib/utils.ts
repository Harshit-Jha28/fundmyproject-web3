import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatXLM(stroops: bigint | number | string): string {
  const value = Number(stroops) / 1e7;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  }).format(value);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(timestamp: number | string | Date): string {
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getExplorerTxUrl(hash: string): string {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://stellar.expert/explorer/testnet";
  return `${base}/tx/${hash}`;
}

export function getExplorerAccountUrl(address: string): string {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://stellar.expert/explorer/testnet";
  return `${base}/account/${address}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SavedTransaction {
  hash: string;
  timestamp: number;
  type: string;
}

export function saveTransaction(tx: SavedTransaction): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem("edufundx_txs");
    const txs: SavedTransaction[] = stored ? JSON.parse(stored) : [];
    const updated = [tx, ...txs].slice(0, 20);
    localStorage.setItem("edufundx_txs", JSON.stringify(updated));
    window.dispatchEvent(new Event("edufundx_new_tx"));
  } catch (err) {
    console.error("Failed to save transaction:", err);
  }
}

export function getTransactions(): SavedTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("edufundx_txs");
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Failed to get transactions:", err);
    return [];
  }
}
