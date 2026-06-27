"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useWallet } from "@/features/wallet/hooks";
import { useStudentReputation, useSponsorReputation } from "@/features/reputation/hooks/use-reputation";
import { WalletInfo } from "@/features/wallet/ui/WalletInfo";
import { Loader2, Coins, ArrowUpRight, Award, Plus, FolderHeart, Landmark } from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/shared/types/project";
import { getTierForScore } from "@/shared/types/reputation";

export default function DashboardPage() {
  const { address, isConnected } = useWallet();
  const { data: projects, isLoading } = useProjects();
  const { data: studentRep } = useStudentReputation(address);
  const { data: sponsorRep } = useSponsorReputation(address);

  const [activeTab, setActiveTab] = useState<"student" | "sponsor">("student");

  if (!isConnected || !address) {
    return (
      <div className="bg-[#171e19] min-h-screen text-black font-sans">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 mt-12 flex flex-col items-center gap-6">
          <div className="neo-box p-8 bg-[#b7c6c2] text-center w-full">
            <h1 className="text-3xl font-black uppercase">EduFundX Dashboard</h1>
            <p className="font-bold text-gray-700 mt-2">
              Connect your Freighter wallet to view your student portfolio, sponsored proposals, and reputation scores.
            </p>
          </div>
          <div className="w-full max-w-md">
            <WalletInfo />
          </div>
        </main>
      </div>
    );
  }

  // Filter projects owned by the user (student view)
  const studentProjects = projects?.filter((p) => p.student === address) || [];

  // Filter projects sponsored by the user (sponsor view)
  // For MVP/simulation, we can show projects where user has contributed. We'd check if sponsorship > 0.
  // Since we don't fetch all sponsorships in one call, we can mock/simulate this or display projects sponsored in local cache.
  // Let's filter by checking if project status is Active/FullyFunded/Completed and showing a list where user can click.
  const sponsoredProjects = projects?.filter((p) => p.student !== address && p.currentFunding > 0n) || [];

  const repScore = activeTab === "student" ? studentRep?.score || 0 : sponsorRep?.score || 0;
  const tierInfo = getTierForScore(repScore);

  return (
    <div className="bg-[#171e19] min-h-screen text-black font-sans pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Wallet Info & Reputation Card */}
        <div className="flex flex-col gap-6">
          <WalletInfo />

          {/* Reputation Stats Box */}
          <div className="neo-box p-6 bg-white flex flex-col gap-4">
            <h3 className="font-black text-xl uppercase border-b-2 border-black pb-2">Reputation Tier</h3>
            
            <div className={`p-4 border-2 border-black font-black uppercase text-center text-lg bg-[#ffe17c]`}>
              🏅 {tierInfo.label} Class
            </div>

            <div className="flex justify-between items-center mt-2 font-bold text-sm text-gray-600">
              <span>Reputation Score</span>
              <span className="font-black text-black text-lg">{repScore} Points</span>
            </div>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-black/5 text-xs text-gray-500 font-bold">
              {activeTab === "student" ? (
                <>
                  <div className="flex justify-between">
                    <span>Projects Completed:</span>
                    <span className="text-black font-black">{studentRep?.projectsCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Milestones Delivered:</span>
                    <span className="text-black font-black">{studentRep?.milestonesDelivered || 0}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Sponsored Count:</span>
                    <span className="text-black font-black">{sponsorRep?.projectsFunded || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Dashboards & Project Lists */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Dashboard Tabs */}
          <div className="flex border-2 border-black bg-white p-1">
            <button
              onClick={() => setActiveTab("student")}
              className={`flex-1 py-3 font-black uppercase text-sm transition-all ${
                activeTab === "student" ? "bg-[#ffe17c] border-2 border-black" : "hover:bg-gray-50"
              }`}
            >
              Student Portfolio
            </button>
            <button
              onClick={() => setActiveTab("sponsor")}
              className={`flex-1 py-3 font-black uppercase text-sm transition-all ${
                activeTab === "sponsor" ? "bg-[#ffe17c] border-2 border-black" : "hover:bg-gray-50"
              }`}
            >
              Sponsorship Dashboard
            </button>
          </div>

          {/* Student Dashboard view */}
          {activeTab === "student" && (
            <div className="neo-box p-6 bg-white flex flex-col gap-6">
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                <div className="flex items-center gap-2">
                  <FolderHeart className="h-6 w-6 text-black" />
                  <h2 className="text-2xl font-black uppercase">My Funded Proposals</h2>
                </div>
                <Link href="/projects/create" className="neo-btn bg-[#ffe17c] py-1.5 px-3 text-xs font-black uppercase gap-1">
                  <Plus className="h-4 w-4" />
                  Create Proposal
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffe17c]" />
                </div>
              ) : studentProjects.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {studentProjects.map((p) => {
                    const goalXlm = Number(p.fundingGoal) / 10000000;
                    const sponsoredXlm = Number(p.currentFunding) / 10000000;
                    return (
                      <div key={p.id} className="border-2 border-black p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100/50 transition-all">
                        <div className="flex flex-col gap-1 min-w-0 pr-4">
                          <span className="neo-badge bg-[#b7c6c2] text-[10px] font-black self-start uppercase">
                            {p.category || "Tech"}
                          </span>
                          <h3 className="font-black uppercase text-base truncate mt-1">{p.title}</h3>
                          <span className="text-xs text-gray-500 font-bold">
                            Goal: {goalXlm} XLM | Sponsored: {sponsoredXlm} XLM
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`neo-badge text-xs font-black ${getStatusColor(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
                          <Link href={`/projects/${p.id}`} className="p-1 border-2 border-black hover:bg-[#ffe17c] transition-all">
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 text-gray-500 font-bold flex flex-col items-center justify-center gap-3">
                  <span>You haven't submitted any project proposals yet.</span>
                  <Link href="/projects/create" className="neo-btn bg-[#ffe17c] py-2 px-6 uppercase text-xs font-black">
                    Submit First Project
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Sponsor Dashboard view */}
          {activeTab === "sponsor" && (
            <div className="neo-box p-6 bg-white flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b-2 border-black pb-4">
                <Landmark className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-black uppercase">My Sponsored Projects</h2>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffe17c]" />
                </div>
              ) : sponsoredProjects.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {sponsoredProjects.map((p) => {
                    const goalXlm = Number(p.fundingGoal) / 10000000;
                    const sponsoredXlm = Number(p.currentFunding) / 10000000;
                    return (
                      <div key={p.id} className="border-2 border-black p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100/50 transition-all">
                        <div className="flex flex-col gap-1 min-w-0 pr-4">
                          <span className="neo-badge bg-[#b7c6c2] text-[10px] font-black self-start uppercase">
                            {p.category || "Tech"}
                          </span>
                          <h3 className="font-black uppercase text-base truncate mt-1">{p.title}</h3>
                          <span className="text-xs text-gray-500 font-bold">
                            Goal: {goalXlm} XLM | Total Sponsored: {sponsoredXlm} XLM
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`neo-badge text-xs font-black ${getStatusColor(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
                          <Link href={`/projects/${p.id}`} className="p-1 border-2 border-black hover:bg-[#ffe17c] transition-all">
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 text-gray-500 font-bold flex flex-col items-center justify-center gap-3">
                  <span>You haven't sponsored any project proposals yet.</span>
                  <Link href="/marketplace" className="neo-btn bg-[#ffe17c] py-2 px-6 uppercase text-xs font-black">
                    Explore Marketplace
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
