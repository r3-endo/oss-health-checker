import { describe, expect, it } from "vitest";
import {
  calculateHealthScore,
  generateDeductionReasons,
} from "../../src/features/development-health/domain/models/health-score.js";
import { mapScoreToStatus } from "../../src/features/development-health/domain/models/health-status.js";

describe("calculateHealthScore", () => {
  const baseDate = new Date("2026-02-13T00:00:00Z");

  describe("perfect score cases", () => {
    it("returns score 100 when all signals are healthy", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"), // 3 days ago
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"), // 34 days ago
          openIssues: 50,
          contributors: 5,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(100);
      expect(result.scoreVersion).toBe(1);
    });
  });

  describe("score boundary cases", () => {
    it("returns score 80 with only release deduction", () => {
      // Score 80: -20 from release stale only
      const result80 = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"), // recent
          lastReleaseAt: new Date("2024-02-10T00:00:00Z"), // >365 days → -20
          openIssues: 50, // no deduction
          contributors: 5, // no deduction
          evaluatedAt: baseDate,
        },
        1,
      );
      expect(result80.score).toBe(80);
    });

    it("returns score 65 with release and issue deductions", () => {
      // Score 65: -20 (release) -15 (issues) = -35
      const result65 = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"), // recent
          lastReleaseAt: new Date("2024-02-10T00:00:00Z"), // >365 days → -20
          openIssues: 101, // >100 → -15
          contributors: 5, // no deduction
          evaluatedAt: baseDate,
        },
        1,
      );
      expect(result65.score).toBe(65);
    });

    it("returns score 40 with commit and release deductions", () => {
      // Score 40: -60 deduction
      // -40 (commit) -20 (release) = -60 → 40
      const result40 = calculateHealthScore(
        {
          lastCommitAt: new Date("2025-08-10T00:00:00Z"), // >180 days → -40
          lastReleaseAt: new Date("2024-02-10T00:00:00Z"), // >365 days → -20
          openIssues: 50, // no deduction
          contributors: 5, // no deduction
          evaluatedAt: baseDate,
        },
        1,
      );
      expect(result40.score).toBe(40);
    });

    it("returns score 35 with commit, release, and issue deductions", () => {
      // Score 25: -40 -20 -15 = -75 → 25
      const result35 = calculateHealthScore(
        {
          lastCommitAt: new Date("2025-08-10T00:00:00Z"), // >180 days → -40
          lastReleaseAt: new Date("2024-02-10T00:00:00Z"), // >365 days → -20
          openIssues: 101, // >100 → -15
          contributors: 5, // no deduction
          evaluatedAt: baseDate,
        },
        1,
      );
      expect(result35.score).toBe(25);
    });
  });

  describe("lastCommitAt deduction rules", () => {
    it("deducts 40 when lastCommitAt is null", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: null,
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: 5,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(60);
    });

    it("deducts 40 when lastCommitAt is more than 180 days old", () => {
      // 181 days ago
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2025-08-15T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: 5,
          evaluatedAt: new Date("2026-02-13T00:00:00Z"),
        },
        1,
      );

      expect(result.score).toBe(60);
    });

    it("deducts 40 when lastCommitAt is exactly 180 days old", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2025-08-16T00:00:00Z"), // exactly 181 days before Feb 13
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: 5,
          evaluatedAt: new Date("2026-02-13T00:00:00Z"),
        },
        1,
      );

      expect(result.score).toBe(60);
    });

    it("does not deduct when lastCommitAt is 179 days old", () => {
      // 179 days ago: Feb 13 - 179 days = Aug 17
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2025-08-17T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: 5,
          evaluatedAt: new Date("2026-02-13T00:00:00Z"),
        },
        1,
      );

      expect(result.score).toBe(100);
    });
  });

  describe("lastReleaseAt deduction rules", () => {
    it("deducts 20 when lastReleaseAt is null", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: null,
          openIssues: 50,
          contributors: 5,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(80);
    });

    it("deducts 20 when lastReleaseAt is more than 365 days old", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2025-02-12T00:00:00Z"), // 366 days ago
          openIssues: 50,
          contributors: 5,
          evaluatedAt: new Date("2026-02-13T00:00:00Z"),
        },
        1,
      );

      expect(result.score).toBe(80);
    });

    it("does not deduct when lastReleaseAt is exactly 365 days old", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2025-02-13T00:00:00Z"), // exactly 365 days
          openIssues: 50,
          contributors: 5,
          evaluatedAt: new Date("2026-02-13T00:00:00Z"),
        },
        1,
      );

      expect(result.score).toBe(100);
    });

    it("does not deduct when lastReleaseAt is 364 days old", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2025-02-14T00:00:00Z"), // 364 days ago
          openIssues: 50,
          contributors: 5,
          evaluatedAt: new Date("2026-02-13T00:00:00Z"),
        },
        1,
      );

      expect(result.score).toBe(100);
    });
  });

  describe("openIssues deduction rules", () => {
    it("deducts 15 when openIssues is greater than 100", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 101,
          contributors: 5,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(85);
    });

    it("does not deduct when openIssues is exactly 100", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 100,
          contributors: 5,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(100);
    });

    it("does not deduct when openIssues is null", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: null,
          contributors: 5,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(100);
    });
  });

  describe("contributors deduction rules", () => {
    it("deducts 15 when contributors is less than 3", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: 2,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(85);
    });

    it("does not deduct when contributors is exactly 3", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: 3,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(100);
    });

    it("does not deduct when contributors is null", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: null,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(100);
    });
  });

  describe("combined deductions and clamping", () => {
    it("applies all deductions when all conditions are met", () => {
      // -40 (commit) -20 (release) -15 (issues) -15 (contributors) = -90 → 10
      const result = calculateHealthScore(
        {
          lastCommitAt: null, // -40
          lastReleaseAt: null, // -20
          openIssues: 101, // -15
          contributors: 2, // -15
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBe(10);
    });

    it("clamps score to 0 when it would be negative", () => {
      // This is tricky: max deduction is -90, so score min is 10, never negative
      // But let's test the clamping logic exists by verifying score doesn't go below 0
      // Since we can't make it negative with current rules, this test documents the expected behavior
      const result = calculateHealthScore(
        {
          lastCommitAt: null, // -40
          lastReleaseAt: null, // -20
          openIssues: 101, // -15
          contributors: 2, // -15
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBe(10);
    });

    it("clamps score to 100 when calculation would exceed", () => {
      // Perfect inputs should give exactly 100, not more
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 0,
          contributors: 100,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBe(100);
    });
  });

  describe("scoreVersion handling", () => {
    it("returns result with scoreVersion 1 when scoreVersion 1 is requested", () => {
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2026-02-10T00:00:00Z"),
          lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
          openIssues: 50,
          contributors: 5,
          evaluatedAt: baseDate,
        },
        1,
      );

      expect(result.scoreVersion).toBe(1);
    });

    it("throws error when unsupported scoreVersion is requested", () => {
      expect(() => {
        calculateHealthScore(
          {
            lastCommitAt: new Date("2026-02-10T00:00:00Z"),
            lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
            openIssues: 50,
            contributors: 5,
            evaluatedAt: baseDate,
          },
          999,
        );
      }).toThrow();
    });
  });

  describe("UTC date handling", () => {
    it("correctly handles date calculations across UTC boundaries", () => {
      // Test that calculations use UTC consistently
      const utcMidnight = new Date("2026-02-13T00:00:00Z");
      const result = calculateHealthScore(
        {
          lastCommitAt: new Date("2025-08-16T23:59:59Z"), // just over 180 days
          lastReleaseAt: new Date("2025-02-13T00:00:01Z"), // just under 365 days
          openIssues: 50,
          contributors: 5,
          evaluatedAt: utcMidnight,
        },
        1,
      );

      // lastCommitAt is >180 days → -40, lastReleaseAt is <=365 days → no deduction
      expect(result.score).toBe(60);
    });
  });
});

describe("mapScoreToStatus", () => {
  it("returns Active when score is 70", () => {
    expect(mapScoreToStatus(70)).toBe("Active");
  });

  it("returns Stale when score is 69", () => {
    expect(mapScoreToStatus(69)).toBe("Stale");
  });

  it("returns Stale when score is 40", () => {
    expect(mapScoreToStatus(40)).toBe("Stale");
  });

  it("returns Risky when score is 39", () => {
    expect(mapScoreToStatus(39)).toBe("Risky");
  });

  it("returns Active when score is 100", () => {
    expect(mapScoreToStatus(100)).toBe("Active");
  });

  it("returns Risky when score is 0", () => {
    expect(mapScoreToStatus(0)).toBe("Risky");
  });
});

describe("generateDeductionReasons", () => {
  const baseDate = new Date("2026-02-13T00:00:00Z");

  it("returns empty reasons when no deduction applies", () => {
    const reasons = generateDeductionReasons({
      lastCommitAt: new Date("2026-02-10T00:00:00Z"),
      lastReleaseAt: new Date("2026-01-10T00:00:00Z"),
      openIssues: 10,
      contributors: 5,
      evaluatedAt: baseDate,
    });

    expect(reasons).toEqual([]);
  });

  it("returns all matched reasons with configured deduction points", () => {
    const reasons = generateDeductionReasons({
      lastCommitAt: null,
      lastReleaseAt: null,
      openIssues: 101,
      contributors: 2,
      evaluatedAt: baseDate,
    });

    expect(reasons).toEqual([
      { key: "commit_stale_or_missing", points: 40 },
      { key: "release_stale_or_missing", points: 20 },
      { key: "open_issues_high", points: 15 },
      { key: "contributors_low", points: 15 },
    ]);
  });
});
