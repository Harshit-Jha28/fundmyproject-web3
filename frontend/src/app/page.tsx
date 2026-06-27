"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "./components/Navbar";
import { ArrowRight, CheckCircle2, XCircle, Milestone, Award, Wallet, ShieldAlert, Coins, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-[#171e19] min-h-screen text-black overflow-x-hidden font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="neo-yellow-bg min-h-[calc(100vh-80px)] border-b-2 border-black flex items-center py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="flex flex-col gap-6 items-start">
            <span className="neo-badge bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-black">
              ★ Soroban Mainnet Beta Launch Ready
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-black">
              FUND YOUR <br />
              <span className="text-transparent" style={{ WebkitTextStroke: "2px black" }}>
                ACADEMIC
              </span>{" "}
              <br />
              DREAMS
            </h1>
            <p className="font-bold text-lg max-w-xl text-black/80">
              EduFundX connects talented students with sponsors worldwide. Transparent, milestone-based funding secured by the Stellar Soroban smart contract ecosystem.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Link href="/marketplace" className="neo-btn-black text-lg py-4 px-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Browse Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/projects/create" className="neo-btn-white text-lg py-4 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Submit Project
              </Link>
            </div>
          </div>

          {/* Right Column: Browser Mockup */}
          <div className="neo-browser w-full max-w-xl mx-auto">
            <div className="neo-browser-header">
              <div className="neo-dot-red"></div>
              <div className="neo-dot-yellow"></div>
              <div className="neo-dot-green"></div>
              <span className="text-xs text-white/50 font-mono ml-4">edufundx.app/dashboard</span>
            </div>
            <div className="p-6 bg-white flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="neo-box p-4 bg-[#b7c6c2]">
                  <span className="text-xs font-black uppercase text-black/70">Total Sponsored</span>
                  <div className="text-2xl font-black mt-1">125,500 XLM</div>
                </div>
                <div className="neo-box p-4 bg-[#ffe17c]">
                  <span className="text-xs font-black uppercase text-black/70">Active Projects</span>
                  <div className="text-2xl font-black mt-1">42 Proposals</div>
                </div>
              </div>
              <div className="neo-box p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <span className="font-black text-sm">Solar Autonomous Drone</span>
                  <span className="neo-badge bg-[#ffe17c]">ACTIVE</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-600">
                  <span>Progress: 8,500 / 10,000 XLM</span>
                  <span>85% Funded</span>
                </div>
                <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
                  <div className="bg-[#ffe17c] border-r-2 border-black h-full w-[85%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Marquee */}
      <section className="bg-[#171e19] border-b-2 border-black py-4 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee font-black uppercase text-2xl tracking-tight text-[#b7c6c2]/50 gap-16">
          <span>Stellar Foundation</span>
          <span>Soroban Smart Contracts</span>
          <span>Decentralized Crowdfunding</span>
          <span>Milestone-Based Escrow</span>
          <span>Freighter Wallet Integrated</span>
          <span>Native XLM Only</span>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="bg-white py-20 px-6 md:px-12 border-b-2 border-black">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
              Tackling Funding Transparency
            </h2>
            <p className="font-bold text-gray-600">
              Traditional student funding is opaque and fragmented. EduFundX secures sponsorships through programmable, smart-contract backed escrows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Problem Card */}
            <div className="border-2 border-dashed border-gray-400 p-8 opacity-70 bg-gray-50 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-500 h-8 w-8" />
                <h3 className="text-2xl font-black uppercase">Traditional Crowdfunding</h3>
              </div>
              <ul className="flex flex-col gap-4 font-bold text-gray-600">
                <li className="flex items-start gap-2">
                  <span>•</span> Opaque deployment where students receive 100% of funds upfront with no accountability.
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span> High fees charged by centralized intermediaries, taking up to 10% of funds.
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span> No tracking of project progress or actual project delivery after funding completes.
                </li>
              </ul>
            </div>

            {/* Solution Card */}
            <div className="neo-box-large p-8 bg-[#ffe17c] flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-black h-8 w-8" />
                <h3 className="text-2xl font-black uppercase">The EduFundX Standard</h3>
              </div>
              <ul className="flex flex-col gap-4 font-black">
                <li className="flex items-start gap-2">
                  <span>✔</span> Escrow-locked funds that are only released as students achieve verified project milestones.
                </li>
                <li className="flex items-start gap-2">
                  <span>✔</span> Minimal platform fees (2.5%) automated fully on-chain.
                </li>
                <li className="flex items-start gap-2">
                  <span>✔</span> Reputation scores awarded to students and sponsors to foster platform trust.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="neo-yellow-bg py-20 px-6 md:px-12 border-b-2 border-black">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase text-center tracking-tight">
            PLATFORM FEATURES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="neo-box p-6 bg-white">
              <div className="w-12 h-12 bg-[#b7c6c2] border-2 border-black flex items-center justify-center mb-4">
                <Milestone className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Milestone Escrows</h3>
              <p className="font-bold text-sm text-gray-600">
                Funding is locked in smart contracts and distributed in phases. Payouts are triggered automatically upon reviewer approval.
              </p>
            </div>

            <div className="neo-box p-6 bg-white">
              <div className="w-12 h-12 bg-[#b7c6c2] border-2 border-black flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-black uppercase mb-2">On-Chain Reputation</h3>
              <p className="font-bold text-sm text-gray-600">
                Both students and sponsors earn reputation points for successful project delivery and funding contributions.
              </p>
            </div>

            <div className="neo-box p-6 bg-white">
              <div className="w-12 h-12 bg-[#b7c6c2] border-2 border-black flex items-center justify-center mb-4">
                <Coins className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Native XLM Support</h3>
              <p className="font-bold text-sm text-gray-600">
                Sponsorship is facilitated fully using native XLM tokens via Freighter wallet for lightning fast transaction settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Personas Section */}
      <section className="bg-white py-20 px-6 md:px-12 border-b-2 border-black">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-center">
            WHO IS IT FOR?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="neo-box p-8 bg-[#b7c6c2] flex flex-col justify-between min-h-[300px]">
              <span className="neo-badge bg-white self-start">STUDENTS</span>
              <div className="flex flex-col gap-2 mt-8">
                <h3 className="text-3xl font-black uppercase">Publish Proposals</h3>
                <p className="font-bold text-black/80">
                  Showcase your academic thesis, build research prototypes, and request transparent sponsor support.
                </p>
              </div>
            </div>

            <div className="neo-box-large p-8 bg-[#ffe17c] flex flex-col justify-between min-h-[300px]">
              <span className="neo-badge bg-white self-start">SPONSORS</span>
              <div className="flex flex-col gap-2 mt-8">
                <h3 className="text-3xl font-black uppercase">Direct Sponsorship</h3>
                <p className="font-black">
                  Directly fund student proposals, review proof of completions, and support Web3 academic innovation.
                </p>
              </div>
            </div>

            <div className="neo-box p-8 bg-[#171e19] text-white flex flex-col justify-between min-h-[300px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="neo-badge bg-white text-black self-start">MENTORS</span>
              <div className="flex flex-col gap-2 mt-8">
                <h3 className="text-3xl font-black uppercase">Review Proofs</h3>
                <p className="font-bold text-white/80">
                  Act as a validator, verify milestone delivery proofs, and authorize fund releases from the smart contracts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Final CTA */}
      <footer className="bg-[#171e19] text-white border-t-2 border-black py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ffe17c] border-2 border-black flex items-center justify-center">
              <Zap className="h-4 w-4 text-black fill-black" />
            </div>
            <span className="font-black text-xl uppercase tracking-tighter text-white">
              EduFund<span className="text-[#ffe17c]">X</span>
            </span>
          </div>

          <p className="font-bold text-white/60 text-sm">
            © 2026 EduFundX Platform. Secured by Stellar Soroban smart contracts.
          </p>

          <div className="flex gap-4">
            <Link href="/marketplace" className="neo-btn bg-[#ffe17c] font-black text-black py-2 px-6">
              Launch App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
