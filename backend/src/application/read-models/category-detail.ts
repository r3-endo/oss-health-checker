import type { HealthStatus } from "../../domain/models/health-status.js";

export type CategoryRepositoryView = Readonly<{
  owner: string;
  name: string;
  lastCommit: string | null;
  metrics: Readonly<{
    devHealth: Readonly<{
      healthScore: number;
      status: HealthStatus;
      scoreVersion: number;
      issueGrowth30d: number | null;
      commitLast30d: number | null;
    }>;
    adoption: null;
    security: null;
    governance: null;
  }>;
}>;

export type CategoryDetail = Readonly<{
  slug: string;
  name: string;
  repositories: readonly CategoryRepositoryView[];
}>;
