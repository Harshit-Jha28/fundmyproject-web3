import { describe, expect, test } from "vitest";
import { toScVal } from "@/shared/lib/stellar";

describe("toScVal", () => {
  test("creates u64 values", () => {
    expect(toScVal(1, "u64")).toBeDefined();
  });

  test("creates string values", () => {
    expect(toScVal("hello", "string")).toBeDefined();
  });

  test("creates bool values", () => {
    expect(toScVal(true, "bool")).toBeDefined();
  });
});