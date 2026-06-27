import { describe, expect, test } from "vitest";
import { mapStatus } from "@/features/projects/contract/core-contract";
import { ProjectStatus } from "@/shared/types/project";

describe("mapStatus", () => {
  test("status 0 returns Active", () => {
    expect(mapStatus(0)).toBe(ProjectStatus.Active);
  });

  test("status 2 returns FullyFunded", () => {
    expect(mapStatus(2)).toBe(ProjectStatus.FullyFunded);
  });

  test("unknown status defaults to Active", () => {
    expect(mapStatus(999)).toBe(ProjectStatus.Active);
  });
});