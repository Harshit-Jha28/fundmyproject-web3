import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "../../wallet/hooks";
import { submitTransaction, waitForTransaction } from "@/shared/lib/stellar";
import { CoreRegistryContract } from "../contract/core-contract";
import { EscrowContract } from "../contract/escrow-contract";
import { MilestoneContract } from "../contract/milestone-contract";
import { toast } from "@/shared/ui/use-toast";

export type TxStep = "IDLE" | "BUILDING" | "SIGNING" | "SUBMITTING" | "PENDING" | "CONFIRMED" | "FAILED";

export function useProjectActions() {
  const { address, signTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<TxStep>("IDLE");
  const [txHash, setTxHash] = useState<string | null>(null);

  // Helper to coordinate build -> simulate -> sign -> submit -> wait
  const runTransaction = async (
    buildTxFn: () => Promise<any>,
    successMessage: string
  ) => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setStep("BUILDING");
      toast({ title: "Building Transaction", description: "Preparing and simulating invocation on Soroban...", duration: 3000 });
      
      const preparedTx = await buildTxFn();
      
      setStep("SIGNING");
      toast({ title: "Signature Required", description: "Please approve the transaction in Freighter wallet.", duration: 5000 });
      
      const signedXdr = await signTransaction(preparedTx.toXDR());
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        preparedTx.networkPassphrase
      ) as any;

      setStep("SUBMITTING");
      toast({ title: "Submitting to Ledger", description: "Sending transaction to Soroban RPC...", duration: 3000 });
      
      const response = await submitTransaction(signedTx);
      
      if (response.status === "ERROR") {
        throw new Error(`RPC submission error: ${JSON.stringify((response as any).errorResultXdr || (response as any).errorResult)}`);
      }
      
      const hash = response.hash;
      setTxHash(hash);
      setStep("PENDING");
      toast({ title: "Transaction Pending", description: `Polling ledger for hash ${hash.slice(0, 8)}...`, duration: 5000 });

      // Wait for ledger confirmation
      const waitResult = await waitForTransaction(hash);
      
      if (waitResult.status === "SUCCESS") {
        setStep("CONFIRMED");
        toast({ title: "Transaction Confirmed!", description: successMessage, variant: "default" });
        
        // Refresh project queries
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["xlm-balance", address] });
        
        return hash;
      } else {
        throw new Error("Transaction execution failed on ledger");
      }
    } catch (err: any) {
      setStep("FAILED");
      const errMsg = err.message || "Execution failed";
      toast({ title: "Transaction Failed", description: errMsg, variant: "destructive" });
      throw err;
    }
  };

  // Create Project mutation
  const createProject = useMutation({
    mutationFn: async (params: { title: string; description: string; category: string; fundingGoal: bigint }) => {
      return runTransaction(
        () => CoreRegistryContract.createProjectTx(
          address!,
          params.title,
          params.description,
          params.category,
          params.fundingGoal
        ),
        "Your project registry proposal was successfully created!"
      );
    }
  });

  // Sponsor Project mutation
  const sponsorProject = useMutation({
    mutationFn: async (params: { projectId: number; amount: bigint }) => {
      return runTransaction(
        () => EscrowContract.sponsorProjectTx(
          address!,
          params.projectId,
          params.amount
        ),
        `Successfully sponsored project #${params.projectId} with ${Number(params.amount) / 10000000} XLM!`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
    }
  });

  // Add Milestone mutation
  const addMilestone = useMutation({
    mutationFn: async (params: { projectId: number; title: string; description: string; amount: bigint; reviewer: string }) => {
      return runTransaction(
        () => MilestoneContract.addMilestoneTx(
          address!,
          params.projectId,
          params.title,
          params.description,
          params.amount,
          params.reviewer
        ),
        "Successfully added new milestone proposal!"
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-milestones", variables.projectId] });
    }
  });

  // Submit Milestone proof mutation
  const submitMilestone = useMutation({
    mutationFn: async (params: { projectId: number; index: number; proofUrl: string }) => {
      return runTransaction(
        () => MilestoneContract.submitMilestoneTx(
          address!,
          params.projectId,
          params.index,
          params.proofUrl
        ),
        `Successfully submitted completion proof for Milestone #${params.index + 1}!`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-milestones", variables.projectId] });
    }
  });

  // Review Milestone mutation
  const reviewMilestone = useMutation({
    mutationFn: async (params: { projectId: number; index: number; approved: boolean }) => {
      return runTransaction(
        () => MilestoneContract.reviewMilestoneTx(
          address!,
          params.projectId,
          params.index,
          params.approved
        ),
        `Successfully marked Milestone #${params.index + 1} as ${params.approved ? "Approved" : "Rejected"}!`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-milestones", variables.projectId] });
    }
  });

  // Claim refund mutation
  const refundSponsor = useMutation({
    mutationFn: async (params: { projectId: number }) => {
      return runTransaction(
        () => EscrowContract.refundSponsorTx(
          address!,
          params.projectId
        ),
        "Successfully claimed your refund for the cancelled project!"
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
    }
  });

  // Activate project
  const activateProject = useMutation({
    mutationFn: async (params: { projectId: number }) => {
      return runTransaction(
        () => CoreRegistryContract.updateProjectStatusTx(
          address!,
          params.projectId,
          1 // 1 = Active
        ),
        "Your project is now active and open for sponsorship!"
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
    }
  });

  return {
    step,
    txHash,
    createProject: createProject.mutateAsync,
    isCreating: createProject.isPending,
    sponsorProject: sponsorProject.mutateAsync,
    isSponsoring: sponsorProject.isPending,
    addMilestone: addMilestone.mutateAsync,
    isAddingMilestone: addMilestone.isPending,
    submitMilestone: submitMilestone.mutateAsync,
    isSubmittingMilestone: submitMilestone.isPending,
    reviewMilestone: reviewMilestone.mutateAsync,
    isReviewingMilestone: reviewMilestone.isPending,
    refundSponsor: refundSponsor.mutateAsync,
    isRefunding: refundSponsor.isPending,
    activateProject: activateProject.mutateAsync,
    isActivating: activateProject.isPending,
  };
}

// Global import helper for Transaction deserialization
import * as StellarSdk from "@stellar/stellar-sdk";
