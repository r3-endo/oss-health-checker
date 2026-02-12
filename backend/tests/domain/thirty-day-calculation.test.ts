import { describe, expect, it } from "vitest";
import {
  calculateIssueGrowth30d,
  resolveCommitLast30d,
} from "../../src/domain/models/thirty-day-metrics.js";

describe("calculateIssueGrowth30d", () => {
  const currentDate = new Date("2026-02-13T00:00:00Z");
  const thirtyDaysAgo = new Date("2026-01-14T00:00:00Z");

  describe("baseline existence cases", () => {
    it("returns difference when baseline exists exactly 30 days ago", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: thirtyDaysAgo,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(50);
    });

    it("returns difference when baseline exists before 30 days ago", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-10T00:00:00Z"), // 34 days ago
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(50);
    });

    it("returns null when no baseline exists at or before 30 days ago", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-15T00:00:00Z"), // only 29 days ago
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBeNull();
    });

    it("returns null when historical snapshots array is empty", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };

      const result = calculateIssueGrowth30d(current, []);

      expect(result).toBeNull();
    });
  });

  describe("multiple snapshots selection", () => {
    it("picks the snapshot closest to 30 days ago when multiple exist", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-10T00:00:00Z"), // 34 days ago
          openIssues: 80,
          commitCount30d: 5,
        },
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-14T00:00:00Z"), // exactly 30 days ago (closest)
          openIssues: 100,
          commitCount30d: 7,
        },
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-12T00:00:00Z"), // 32 days ago
          openIssues: 90,
          commitCount30d: 6,
        },
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-02-01T00:00:00Z"), // 12 days ago (too recent)
          openIssues: 110,
          commitCount30d: 9,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      // Should use the snapshot from exactly 30 days ago (openIssues=100)
      expect(result).toBe(50);
    });

    it("ignores snapshots more recent than 30 days ago", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-20T00:00:00Z"), // 24 days ago (too recent)
          openIssues: 140,
          commitCount30d: 9,
        },
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-02-01T00:00:00Z"), // 12 days ago (too recent)
          openIssues: 135,
          commitCount30d: 10,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBeNull();
    });

    it("uses nearest old snapshot when only older snapshots exist", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-01T00:00:00Z"), // 43 days ago
          openIssues: 80,
          commitCount30d: 5,
        },
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-05T00:00:00Z"), // 39 days ago
          openIssues: 90,
          commitCount30d: 6,
        },
        {
          repositoryId: "repo-1",
          recordedAt: new Date("2026-01-10T00:00:00Z"), // 34 days ago (nearest)
          openIssues: 100,
          commitCount30d: 7,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      // Should use the most recent snapshot that's still at or before 30 days ago
      expect(result).toBe(50);
    });
  });

  describe("growth direction cases", () => {
    it("returns positive growth when current issues are higher than baseline", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: thirtyDaysAgo,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(50);
      expect(result).toBeGreaterThan(0);
    });

    it("returns negative growth when current issues are lower than baseline", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 80,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: thirtyDaysAgo,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(-20);
      expect(result).toBeLessThan(0);
    });

    it("returns zero when current issues equal baseline", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 100,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: thirtyDaysAgo,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(0);
    });
  });

  describe("UTC boundary precision", () => {
    it("includes snapshot at exactly 30 days ago at midnight UTC", () => {
      const currentAtMidnight = new Date("2026-02-13T00:00:00Z");
      const exactlyThirtyDaysAgo = new Date("2026-01-14T00:00:00Z");

      const current = {
        repositoryId: "repo-1",
        recordedAt: currentAtMidnight,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: exactlyThirtyDaysAgo,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(50);
    });

    it("excludes snapshot at exactly 30 days ago minus one second", () => {
      // If current is 2026-02-13 00:00:00Z, then 30 days back is 2026-01-14 00:00:00Z
      // A snapshot at 2026-01-14 00:00:01Z would be 29 days 23h 59m 59s ago (too recent)
      const currentAtMidnight = new Date("2026-02-13T00:00:00Z");
      const justUnderThirtyDays = new Date("2026-01-14T00:00:01Z");

      const current = {
        repositoryId: "repo-1",
        recordedAt: currentAtMidnight,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: justUnderThirtyDays,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBeNull();
    });

    it("includes snapshot at 30 days ago plus one second", () => {
      const currentAtMidnight = new Date("2026-02-13T00:00:00Z");
      const justOverThirtyDays = new Date("2026-01-13T23:59:59Z");

      const current = {
        repositoryId: "repo-1",
        recordedAt: currentAtMidnight,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: justOverThirtyDays,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(50);
    });

    it("correctly handles leap year boundary calculations", () => {
      // Test around a leap year boundary
      const currentLeapYear = new Date("2024-03-10T00:00:00Z");
      const thirtyDaysBackLeap = new Date("2024-02-09T00:00:00Z"); // crosses Feb 29

      const current = {
        repositoryId: "repo-1",
        recordedAt: currentLeapYear,
        openIssues: 150,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: thirtyDaysBackLeap,
          openIssues: 100,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(50);
    });
  });

  describe("edge cases", () => {
    it("handles zero issues correctly", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 0,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: thirtyDaysAgo,
          openIssues: 50,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(-50);
    });

    it("handles large issue counts correctly", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 10000,
        commitCount30d: 10,
      };
      const history = [
        {
          repositoryId: "repo-1",
          recordedAt: thirtyDaysAgo,
          openIssues: 5000,
          commitCount30d: 8,
        },
      ];

      const result = calculateIssueGrowth30d(current, history);

      expect(result).toBe(5000);
    });
  });
});

describe("resolveCommitLast30d", () => {
  const currentDate = new Date("2026-02-13T00:00:00Z");

  describe("null handling", () => {
    it("returns null when commitCount30d is null", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 100,
        commitCount30d: null,
      };

      const result = resolveCommitLast30d(current);

      expect(result).toBeNull();
    });

    it("returns the same value when commitCount30d is non-null", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 100,
        commitCount30d: 42,
      };

      const result = resolveCommitLast30d(current);

      expect(result).toBe(42);
    });
  });

  describe("various input values", () => {
    it("returns zero when commitCount30d is zero", () => {
      const current = {
        repositoryId: "repo-1",
        recordedAt: currentDate,
        openIssues: 100,
        commitCount30d: 0,
      };

      const result = resolveCommitLast30d(current);

      expect(result).toBe(0);
    });

    it("returns positive values unchanged", () => {
      expect(
        resolveCommitLast30d({
          repositoryId: "repo-1",
          recordedAt: currentDate,
          openIssues: 100,
          commitCount30d: 1,
        }),
      ).toBe(1);

      expect(
        resolveCommitLast30d({
          repositoryId: "repo-1",
          recordedAt: currentDate,
          openIssues: 100,
          commitCount30d: 100,
        }),
      ).toBe(100);

      expect(
        resolveCommitLast30d({
          repositoryId: "repo-1",
          recordedAt: currentDate,
          openIssues: 100,
          commitCount30d: 9999,
        }),
      ).toBe(9999);
    });
  });
});
