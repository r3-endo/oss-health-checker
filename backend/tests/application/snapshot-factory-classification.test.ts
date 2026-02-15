import { describe, expect, it } from "vitest";
import { buildSnapshotFromSignals } from "@backend/src/features/development-health/application/services/snapshot-factory.js";

describe("snapshot classification", () => {
  it("marks commit warning when last commit is exactly 6 months old", () => {
    const fetchedAt = new Date("2026-07-10T00:00:00Z");

    const snapshot = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt: new Date("2026-01-10T00:00:00Z"),
        lastReleaseAt: new Date("2026-02-10T00:00:00Z"),
        openIssuesCount: 100,
        contributorsCount: 3,
      },
      fetchedAt,
    );

    expect(snapshot.warningReasons).toEqual(["commit_stale"]);
    expect(snapshot.status).toBe("Stale");
  });

  it("marks release warning when last release is exactly 12 months old", () => {
    const fetchedAt = new Date("2026-08-10T00:00:00Z");

    const snapshot = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt: new Date("2026-07-11T00:00:00Z"),
        lastReleaseAt: new Date("2025-08-10T00:00:00Z"),
        openIssuesCount: 100,
        contributorsCount: 3,
      },
      fetchedAt,
    );

    expect(snapshot.warningReasons).toEqual(["release_stale"]);
    expect(snapshot.status).toBe("Stale");
  });

  it("marks open issue warning only when open issues are greater than 100", () => {
    const fetchedAt = new Date("2026-08-10T00:00:00Z");

    const warningSnapshot = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt: new Date("2026-08-01T00:00:00Z"),
        lastReleaseAt: new Date("2026-08-01T00:00:00Z"),
        openIssuesCount: 101,
        contributorsCount: 3,
      },
      fetchedAt,
    );

    const nonWarningSnapshot = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt: new Date("2026-08-01T00:00:00Z"),
        lastReleaseAt: new Date("2026-08-01T00:00:00Z"),
        openIssuesCount: 100,
        contributorsCount: 3,
      },
      fetchedAt,
    );

    expect(warningSnapshot.warningReasons).toEqual(["open_issues_high"]);
    expect(warningSnapshot.status).toBe("Stale");
    expect(nonWarningSnapshot.warningReasons).toEqual([]);
    expect(nonWarningSnapshot.status).toBe("Active");
  });

  it("does not mark release warning when last release is null", () => {
    const fetchedAt = new Date("2026-08-10T00:00:00Z");

    const snapshot = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt: new Date("2026-08-01T00:00:00Z"),
        lastReleaseAt: null,
        openIssuesCount: 50,
        contributorsCount: 3,
      },
      fetchedAt,
    );

    expect(snapshot.warningReasons).toEqual([]);
    expect(snapshot.status).toBe("Active");
  });

  it("handles month-end threshold without overflow drift", () => {
    const staleAtBoundary = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt: new Date("2025-08-31T00:00:00Z"),
        lastReleaseAt: null,
        openIssuesCount: 0,
        contributorsCount: 1,
      },
      new Date("2026-02-28T00:00:00Z"),
    );
    const notStaleBeforeBoundary = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt: new Date("2025-08-31T00:00:00Z"),
        lastReleaseAt: null,
        openIssuesCount: 0,
        contributorsCount: 1,
      },
      new Date("2026-02-27T23:59:59Z"),
    );

    expect(staleAtBoundary.warningReasons).toEqual(["commit_stale"]);
    expect(notStaleBeforeBoundary.warningReasons).toEqual([]);
  });

  it("clones date inputs to avoid external mutation side effects", () => {
    const lastCommitAt = new Date("2026-01-10T00:00:00Z");
    const lastReleaseAt = new Date("2026-01-11T00:00:00Z");
    const fetchedAt = new Date("2026-07-10T00:00:00Z");

    const snapshot = buildSnapshotFromSignals(
      "repo-1",
      {
        lastCommitAt,
        lastReleaseAt,
        openIssuesCount: 0,
        contributorsCount: 1,
      },
      fetchedAt,
    );

    lastCommitAt.setUTCFullYear(2030);
    lastReleaseAt.setUTCFullYear(2030);
    fetchedAt.setUTCFullYear(2030);

    expect(snapshot.lastCommitAt.toISOString()).toBe(
      "2026-01-10T00:00:00.000Z",
    );
    expect(snapshot.lastReleaseAt?.toISOString()).toBe(
      "2026-01-11T00:00:00.000Z",
    );
    expect(snapshot.fetchedAt.toISOString()).toBe("2026-07-10T00:00:00.000Z");
  });
});
