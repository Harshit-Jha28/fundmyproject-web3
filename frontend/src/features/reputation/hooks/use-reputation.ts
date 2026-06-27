import { useQuery } from "@tanstack/react-query";
import { ReputationContract } from "../contract/reputation-contract";

export function useStudentReputation(address: string | null) {
  return useQuery({
    queryKey: ["student-reputation", address],
    queryFn: () => ReputationContract.getStudentReputation(address!),
    enabled: !!address,
    refetchInterval: 20000,
  });
}

export function useSponsorReputation(address: string | null) {
  return useQuery({
    queryKey: ["sponsor-reputation", address],
    queryFn: () => ReputationContract.getSponsorReputation(address!),
    enabled: !!address,
    refetchInterval: 20000,
  });
}
