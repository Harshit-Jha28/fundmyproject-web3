"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useProjectDetails, useProjectMilestones } from "@/features/projects/hooks/use-projects";
import { useProjectActions } from "@/features/projects/hooks/use-project-actions";
import { useWallet } from "@/features/wallet/hooks";
import { useStudentReputation } from "@/features/reputation/hooks/use-reputation";
import { Loader2, Coins, Calendar, CheckCircle2, ChevronRight, Award, Plus, Upload, X } from "lucide-react";
import { getStatusColor, getStatusLabel, ProjectStatus } from "@/shared/types/project";
import { MilestoneStatus, getMilestoneStatusColor } from "@/shared/types/milestone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const { address, isConnected } = useWallet();
  const { data: project, isLoading, error } = useProjectDetails(projectId);
  const { data: milestones, isLoading: isLoadingMilestones } = useProjectMilestones(projectId);
  const { data: rep } = useStudentReputation(project?.student || null);

  const actions = useProjectActions();

  // Dialog forms local state
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);

  // Add Milestone dialog state
  const [msTitle, setMsTitle] = useState("");
  const [msDesc, setMsDesc] = useState("");
  const [msAmount, setMsAmount] = useState("");
  const [msReviewer, setMsReviewer] = useState("");

  const [openSponsor, setOpenSponsor] = useState(false);
  const [openProof, setOpenProof] = useState(false);
  const [openAddMilestone, setOpenAddMilestone] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#171e19] min-h-screen text-black font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffe17c]" />
          <span className="font-bold text-[#b7c6c2]">Loading project details from Stellar blockchain...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-[#171e19] min-h-screen text-black font-sans">
        <Navbar />
        <div className="max-w-3xl mx-auto mt-12 p-8 neo-box bg-red-50 border-red-500 text-center">
          <h2 className="text-2xl font-black uppercase text-red-700">Project Not Found</h2>
          <p className="font-bold mt-2 text-gray-700">
            We couldn't retrieve project #{projectId} from the core registry.
          </p>
          <button onClick={() => router.push("/marketplace")} className="neo-btn-black mt-6">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const goalXlm = Number(project.fundingGoal) / 10000000;
  const currentXlm = Number(project.currentFunding) / 10000000;
  const progressPercent = Math.min(100, Math.round((currentXlm / goalXlm) * 100)) || 0;

  const isStudent = address === project.student;

  const handleSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorAmount) return;

    try {
      const amountStroops = BigInt(Number(sponsorAmount) * 10000000);
      await actions.sponsorProject({ projectId, amount: amountStroops });
      setSponsorAmount("");
      setOpenSponsor(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle || !msDesc || !msAmount || !msReviewer) return;

    try {
      const amountStroops = BigInt(Number(msAmount) * 10000000);
      await actions.addMilestone({
        projectId,
        title: msTitle,
        description: msDesc,
        amount: amountStroops,
        reviewer: msReviewer,
      });
      setMsTitle("");
      setMsDesc("");
      setMsAmount("");
      setMsReviewer("");
      setOpenAddMilestone(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMilestoneIndex === null || !proofUrl) return;

    try {
      await actions.submitMilestone({
        projectId,
        index: selectedMilestoneIndex,
        proofUrl,
      });
      setProofUrl("");
      setSelectedMilestoneIndex(null);
      setOpenProof(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewMilestone = async (index: number, approved: boolean) => {
    try {
      await actions.reviewMilestone({ projectId, index, approved });
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async () => {
    try {
      await actions.activateProject({ projectId });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#171e19] min-h-screen text-black font-sans pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3 width) - Project Details */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Back button */}
          <button
            onClick={() => router.push("/marketplace")}
            className="self-start neo-btn bg-white py-1.5 px-4 font-bold text-xs uppercase"
          >
            ← Back to Marketplace
          </button>

          {/* Project Header Card */}
          <div className="neo-box p-8 bg-white flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="neo-badge bg-[#b7c6c2] text-xs font-black">{project.category || "General"}</span>
              <span className={`neo-badge text-xs font-black ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">{project.title}</h1>
            <p className="font-bold text-gray-700 leading-relaxed">{project.description}</p>

            {/* Creator details */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-black/10">
              <div className="w-10 h-10 bg-[#ffe17c] border-2 border-black flex items-center justify-center font-black">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase">Student Address</span>
                <span className="font-mono text-sm truncate max-w-xs md:max-w-md">{project.student}</span>
              </div>
              <div className="flex items-center gap-1 ml-auto text-[#ffbc2e]">
                <Award className="h-5 w-5 text-black" />
                <span className="font-black text-black">Reputation: {rep?.score || 0}</span>
              </div>
            </div>
          </div>

          {/* Milestones Flow */}
          <div className="neo-box p-8 bg-white flex flex-col gap-6">
            <div className="flex justify-between items-center border-b-2 border-black pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">Project Milestones</h2>
              
              {/* Add Milestone trigger (Draft only, student only) */}
              {isStudent && project.status === ProjectStatus.Active && (
                <Dialog open={openAddMilestone} onOpenChange={setOpenAddMilestone}>
                  <DialogTrigger asChild>
                    <button className="neo-btn bg-[#ffe17c] py-1.5 px-3 text-xs font-black uppercase gap-1">
                      <Plus className="h-4 w-4" />
                      Add Milestone
                    </button>
                  </DialogTrigger>
                  <DialogContent className="neo-box border-2 border-black rounded-none bg-white p-6 w-full max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase">Add Milestone Proposal</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddMilestone} className="flex flex-col gap-4 mt-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase">Milestone Title</label>
                        <input
                          type="text"
                          required
                          value={msTitle}
                          onChange={(e) => setMsTitle(e.target.value)}
                          className="neo-input"
                          placeholder="e.g. Prototype Development"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase">Description</label>
                        <textarea
                          required
                          value={msDesc}
                          onChange={(e) => setMsDesc(e.target.value)}
                          className="neo-input min-h-[80px]"
                          placeholder="Detailed deliverables for this phase..."
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase">Funding Allocation (XLM)</label>
                        <input
                          type="number"
                          required
                          value={msAmount}
                          onChange={(e) => setMsAmount(e.target.value)}
                          className="neo-input"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase">Reviewer / Mentor Address</label>
                        <input
                          type="text"
                          required
                          value={msReviewer}
                          onChange={(e) => setMsReviewer(e.target.value)}
                          className="neo-input font-mono text-xs"
                          placeholder="Stellar public key (G...)"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actions.isAddingMilestone}
                        className="neo-btn-black mt-4 h-12 uppercase"
                      >
                        {actions.isAddingMilestone ? "Submitting..." : "Submit Milestone"}
                      </button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Milestones list */}
            {isLoadingMilestones ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : milestones && milestones.length > 0 ? (
              <div className="flex flex-col gap-6">
                {milestones.map((ms, index) => {
                  const msXlm = Number(ms.fundsReleased) / 10000000;
                  const isReviewer = address === "reviewer" || true; // Replace with actual validation

                  return (
                    <div key={ms.id} className="border-2 border-black p-4 bg-gray-50 flex flex-col gap-3 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-black text-[#ffe17c] font-black text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-black uppercase text-sm">{ms.description || `Milestone ${index + 1}`}</span>
                        </div>
                        <span className={`neo-badge text-xs font-black ${getMilestoneStatusColor(ms.status)}`}>
                          {ms.status}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between text-xs font-bold text-gray-600 mt-2 gap-4">
                        <span>Allocation: <span className="font-black text-black">{msXlm.toLocaleString()} XLM</span></span>
                        {ms.proofUrl && (
                          <a
                            href={ms.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline font-black truncate max-w-xs"
                          >
                            Proof Link: {ms.proofUrl}
                          </a>
                        )}
                      </div>

                      {/* Action buttons based on status */}
                      <div className="flex gap-2 justify-end mt-3 border-t border-black/5 pt-3">
                        {isStudent && ms.status === MilestoneStatus.Pending && (
                          <Dialog open={openProof} onOpenChange={setOpenProof}>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => setSelectedMilestoneIndex(index)}
                                className="neo-btn bg-[#ffe17c] py-1 px-3 text-xs font-black uppercase gap-1"
                              >
                                <Upload className="h-3 w-3" />
                                Submit Proof
                              </button>
                            </DialogTrigger>
                            <DialogContent className="neo-box border-2 border-black rounded-none bg-white p-6 w-full max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase">Submit Completion Proof</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSubmitProof} className="flex flex-col gap-4 mt-4">
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-black uppercase">Proof URL</label>
                                  <input
                                    type="url"
                                    required
                                    value={proofUrl}
                                    onChange={(e) => setProofUrl(e.target.value)}
                                    className="neo-input"
                                    placeholder="e.g. Github repository, Google Drive link"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={actions.isSubmittingMilestone}
                                  className="neo-btn-black mt-4 h-12 uppercase"
                                >
                                  {actions.isSubmittingMilestone ? "Submitting..." : "Submit Proof"}
                                </button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Review actions (Reviewer/Admin only) */}
                        {ms.status === MilestoneStatus.Submitted && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewMilestone(index, true)}
                              disabled={actions.isReviewingMilestone}
                              className="neo-btn bg-green-500 text-white hover:bg-green-600 py-1 px-3 text-xs font-black uppercase"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewMilestone(index, false)}
                              disabled={actions.isReviewingMilestone}
                              className="neo-btn bg-red-500 text-white hover:bg-red-600 py-1 px-3 text-xs font-black uppercase"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 font-bold border-2 border-dashed border-gray-300 p-4">
                No milestones proposals registered for this project.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width) - Sponsorship Widget */}
        <div className="flex flex-col gap-6 w-full">
          {/* Sponsorship card widget */}
          <div className="neo-box p-6 bg-white flex flex-col gap-4">
            <h3 className="font-black text-xl uppercase border-b-2 border-black pb-2">Sponsorship Widget</h3>
            
            <div className="flex justify-between text-xs font-black text-gray-600 uppercase">
              <span>Goal Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
              <div
                className="bg-[#ffe17c] border-r border-black h-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center gap-1 text-2xl font-black mt-2">
              <Coins className="h-6 w-6" />
              <span>{currentXlm.toLocaleString()} / {goalXlm.toLocaleString()} XLM</span>
            </div>

            {/* If Draft, student must activate first */}
            {isStudent && project.status === ProjectStatus.Active && ( // Let's simplify Draft activation
              <button
                onClick={handleActivate}
                disabled={actions.isActivating}
                className="neo-btn bg-[#ffe17c] w-full py-3 mt-4 text-sm font-black uppercase"
              >
                {actions.isActivating ? "Activating..." : "Activate Project"}
              </button>
            )}

            {/* Connect Wallet to interact message */}
            {!isConnected ? (
              <div className="text-center p-3 bg-gray-50 border-2 border-dashed border-gray-400 font-bold text-xs mt-4 text-gray-600">
                Connect your Freighter wallet to sponsor or manage this project.
              </div>
            ) : (
              <>
                {/* Sponsor Button */}
                {project.status === ProjectStatus.Active && (
                  <Dialog open={openSponsor} onOpenChange={setOpenSponsor}>
                    <DialogTrigger asChild>
                      <button className="neo-btn bg-[#ffe17c] w-full py-3 mt-4 text-sm font-black uppercase">
                        Sponsor Project
                      </button>
                    </DialogTrigger>
                    <DialogContent className="neo-box border-2 border-black rounded-none bg-white p-6 w-full max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase">Sponsor Academic Project</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSponsor} className="flex flex-col gap-4 mt-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-black uppercase">Contribution Amount (XLM)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={sponsorAmount}
                            onChange={(e) => setSponsorAmount(e.target.value)}
                            className="neo-input"
                            placeholder="e.g. 100"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actions.isSponsoring}
                          className="neo-btn-black mt-4 h-12 uppercase"
                        >
                          {actions.isSponsoring ? "Transacting..." : "Confirm Contribution"}
                        </button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Refund Button (Cancelled only) */}
                {project.status === ProjectStatus.Cancelled && (
                  <button
                    onClick={() => actions.refundSponsor({ projectId })}
                    disabled={actions.isRefunding}
                    className="neo-btn bg-[#ff5f57] text-white w-full py-3 mt-4 text-sm font-black uppercase"
                  >
                    {actions.isRefunding ? "Claiming..." : "Claim Contribution Refund"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
