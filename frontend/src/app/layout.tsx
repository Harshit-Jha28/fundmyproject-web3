import "@/app/globals.css";
import React from "react";
import { Providers } from "./providers";
import { Toaster } from "@/shared/ui/toaster";

export const metadata = {
  title: "EduFundX — Decentralized Student Project Sponsorship",
  description:
    "EduFundX is a decentralized student project sponsorship platform built on Stellar Soroban, connecting academic innovation with transparent milestone-based funding.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#171e19] text-black min-h-screen selection:bg-black selection:text-white">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
