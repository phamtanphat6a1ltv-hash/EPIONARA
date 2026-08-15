import { describe, it, expect } from "vitest";
import { calculatePearsonCorrelation } from "../src/hooks/useAIAnalysis.js";

describe("Pearson Correlation Calculation Utility", () => {
  it("should return null if array length is less than 2", () => {
    expect(calculatePearsonCorrelation([], [])).toBeNull();
    expect(calculatePearsonCorrelation([1], [2])).toBeNull();
  });

  it("should calculate perfect positive correlation (+1.0)", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    const r = calculatePearsonCorrelation(x, y);
    expect(r).toBeCloseTo(1.0, 5);
  });

  it("should calculate perfect negative correlation (-1.0)", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    const r = calculatePearsonCorrelation(x, y);
    expect(r).toBeCloseTo(-1.0, 5);
  });

  it("should calculate zero/low correlation correctly", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 1, 4, 2, 3];
    const r = calculatePearsonCorrelation(x, y);
    expect(r).toBeCloseTo(-0.3, 1);
  });

  it("should handle division by zero (constant inputs/no variance)", () => {
    const x = [5, 5, 5, 5];
    const y = [1, 2, 3, 4];
    const r = calculatePearsonCorrelation(x, y);
    expect(r).toBe(0);
  });
});
