import { calculateHealthScore } from "../../domain/models/health-score.js";
import { mapScoreToStatus } from "../../domain/models/health-status.js";
import {
  calculateIssueGrowth30d,
  resolveCommitLast30d,
  type SnapshotRecord,
} from "../../domain/models/thirty-day-metrics.js";
import { ApplicationError } from "../errors/application-error.js";
import type { CategoryReadPort } from "../ports/category-read-port.js";
import type { RepositorySnapshotReadPort } from "../ports/repository-snapshot-read-port.js";
import type { CategoryDetail } from "../read-models/category-detail.js";

export type GetCategoryDetailInput = Readonly<{
  slug: string;
}>;

export interface GetCategoryDetailUseCase {
  execute(input: GetCategoryDetailInput): Promise<CategoryDetail>;
}

const SCORE_VERSION = 1;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const shiftIsoUtcByDays = (isoDate: string, days: number): string => {
  const time = Date.parse(isoDate);
  return new Date(time + days * 24 * 60 * 60 * 1000).toISOString();
};

const parseIsoDateOrNull = (value: string | null): Date | null => {
  if (value === null) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export class GetCategoryDetailService implements GetCategoryDetailUseCase {
  constructor(
    private readonly categoryReadPort: CategoryReadPort,
    private readonly repositorySnapshotReadPort: RepositorySnapshotReadPort,
  ) {}

  async execute(input: GetCategoryDetailInput): Promise<CategoryDetail> {
    const category = await this.categoryReadPort.findSummaryBySlug(input.slug);
    if (!category) {
      throw new ApplicationError("NOT_FOUND", "Category not found");
    }

    const repositoryRefs =
      await this.categoryReadPort.listRepositoriesByCategorySlug(input.slug);
    const repositoryIds = repositoryRefs.map(
      (repository) => repository.repositoryId,
    );
    const latestSnapshots =
      await this.repositorySnapshotReadPort.findLatestByRepositoryIds(
        repositoryIds,
      );

    const repositories = await Promise.all(
      repositoryRefs.map(async (repositoryRef) => {
        const snapshot = latestSnapshots.get(repositoryRef.repositoryId);

        const lastCommitAt = parseIsoDateOrNull(snapshot?.lastCommitAt ?? null);
        const lastReleaseAt = parseIsoDateOrNull(
          snapshot?.lastReleaseAt ?? null,
        );
        const evaluatedAt = parseIsoDateOrNull(snapshot?.recordedAt ?? null);

        const scoreVersion = snapshot?.healthScoreVersion ?? SCORE_VERSION;
        const healthScore = calculateHealthScore(
          {
            lastCommitAt,
            lastReleaseAt,
            openIssues: snapshot?.openIssues ?? null,
            contributors: snapshot?.contributorCount ?? null,
            evaluatedAt: evaluatedAt ?? new Date(),
          },
          scoreVersion,
        );

        let issueGrowth30d: number | null = null;
        let commitLast30d: number | null = null;

        if (snapshot && evaluatedAt) {
          const baselineRecordedAt = new Date(
            evaluatedAt.getTime() - THIRTY_DAYS_MS,
          ).toISOString();
          const baselineOpenIssues =
            await this.repositorySnapshotReadPort.findOpenIssuesAtOrBefore(
              repositoryRef.repositoryId,
              baselineRecordedAt,
            );
          const history: SnapshotRecord[] =
            baselineOpenIssues === null
              ? []
              : [
                  {
                    repositoryId: repositoryRef.repositoryId,
                    recordedAt: new Date(
                      shiftIsoUtcByDays(snapshot.recordedAt, -30),
                    ),
                    openIssues: baselineOpenIssues,
                    commitCount30d: null,
                  },
                ];
          issueGrowth30d = calculateIssueGrowth30d(
            {
              repositoryId: repositoryRef.repositoryId,
              recordedAt: new Date(snapshot.recordedAt),
              openIssues: snapshot.openIssues,
              commitCount30d: snapshot.commitCount30d,
            },
            history,
          );
          commitLast30d = resolveCommitLast30d({
            repositoryId: repositoryRef.repositoryId,
            recordedAt: new Date(snapshot.recordedAt),
            openIssues: snapshot.openIssues,
            commitCount30d: snapshot.commitCount30d,
          });
        }

        return Object.freeze({
          owner: repositoryRef.owner,
          name: repositoryRef.name,
          lastCommit: snapshot?.lastCommitAt ?? null,
          metrics: {
            devHealth: {
              healthScore: healthScore.score,
              status: mapScoreToStatus(healthScore.score),
              scoreVersion: healthScore.scoreVersion,
              issueGrowth30d,
              commitLast30d,
            },
            adoption: null,
            security: null,
            governance: null,
          },
        });
      }),
    );

    const sortedRepositories = [...repositories].sort(
      (a, b) =>
        b.metrics.devHealth.healthScore - a.metrics.devHealth.healthScore,
    );

    return Object.freeze({
      slug: category.slug,
      name: category.name,
      repositories: sortedRepositories,
    });
  }
}
