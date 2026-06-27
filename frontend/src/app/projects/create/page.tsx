"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useProjectActions } from "@/features/projects/hooks/use-project-actions";
import { useWallet } from "@/features/wallet/hooks";
import { ShieldAlert, Info } from "lucide-react";

export default function CreateProjectPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const actions = useProjectActions();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Tech");
  const [fundingGoal, setFundingGoal] = useState("");

  const categories = ["Tech", "Research", "Edu", "Science", "Social", "Web3"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !fundingGoal) return;

    try {
      const goalStroops = BigInt(Number(fundingGoal) * 10000000);
      const hash = await actions.createProject({
        title,
        description,
        category,
        fundingGoal: goalStroops,
      });

      if (hash) {
        // Redirect to marketplace or dashboard
        router.push("/marketplace");
      }
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  return (
    <div className="bg-[#171e19] min-h-screen text-black font-sans pb-16">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 mt-12">
        <div className="neo-box p-8 bg-white flex flex-col gap-6">
          <div className="border-b-2 border-black pb-4">
            <h1 className="text-3xl font-black uppercase tracking-tight">Submit Project Proposal</h1>
            <p className="font-bold text-gray-600 mt-1">
              Publish your project on-chain to receive transparent, milestone-based sponsorship.
            </p>
          </div>

          {!isConnected ? (
            <div className="neo-box p-6 bg-[#ffe17c] border-2 border-black flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 flex-shrink-0 text-black" />
              <div>
                <h3 className="font-black uppercase text-sm">Wallet Not Connected</h3>
                <p className="text-sm font-bold mt-1">
                  You must connect your Freighter wallet to publish a project proposal on the Stellar Soroban blockchain.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="neo-input"
                  placeholder="e.g. Solar-Powered Clean Water System"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="neo-input min-h-[120px] leading-relaxed"
                  placeholder="Provide a detailed description of your project, research scope, and what you aim to achieve..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="neo-input font-bold"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Funding Goal (XLM)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value)}
                    className="neo-input"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="neo-box p-4 bg-gray-50 flex items-start gap-2.5">
                <Info className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Important: Creating a proposal initiates a transaction on the Stellar network. Upon confirmation, your proposal will enter Draft status. You will need to define milestone proposals before activating it.
                </p>
              </div>

              <button
                type="submit"
                disabled={actions.isCreating}
                className="neo-btn-black h-14 text-md uppercase font-black tracking-wide mt-2"
              >
                {actions.isCreating ? "Broadcasting to Soroban..." : "Publish Proposal"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
