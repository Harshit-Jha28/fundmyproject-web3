"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@/features/wallet/ui/ConnectButton";
import { Zap, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 h-20 bg-[#ffe17c] border-b-2 border-black flex items-center px-6 md:px-12 justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Zap className="h-5 w-5 text-[#ffe17c] fill-[#ffe17c]" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase">
            EduFund<span className="text-black/70">X</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 font-black text-sm uppercase">
          <Link href="/dashboard" className="hover:text-black/60 transition-colors">
            Dashboard
          </Link>
          <Link href="/marketplace" className="hover:text-black/60 transition-colors">
            Marketplace
          </Link>
          <Link href="/projects/create" className="hover:text-black/60 transition-colors">
            Submit Project
          </Link>
        </nav>

        {/* Right side: hamburger + wallet */}
        <div className="flex items-center gap-4">
          {/* Hamburger button - mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-black" />
            ) : (
              <Menu className="h-5 w-5 text-black" />
            )}
          </button>

          {/* Wallet Connection - hidden on mobile, shown in dropdown instead */}
          <div className="hidden md:flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown - renders below the header */}
      {mobileMenuOpen && (
        <div className="md:hidden sticky top-20 z-40 bg-[#ffe17c] border-b-2 border-black px-6">
          <nav className="flex flex-col font-black text-sm uppercase">
            <Link
              href="/dashboard"
              className="py-4 border-b border-black/20 hover:text-black/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/marketplace"
              className="py-4 border-b border-black/20 hover:text-black/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link
              href="/projects/create"
              className="py-4 border-b border-black/20 hover:text-black/60 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Submit Project
            </Link>
          </nav>
          <div className="py-4">
            <ConnectButton />
          </div>
        </div>
      )}
    </>
  );
}
