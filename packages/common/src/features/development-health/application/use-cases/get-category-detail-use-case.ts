import { ApplicationError } from "../errors/application-error.js";
import type {
  CategoryRepositoryDataStatus,
  RepositoryOwner,
} from "../ports/category-repository-facts-port.js";
import type { CategoryReadPort } from "../ports/category-read-port.js";
import type { RegistryDataPort } from "../ports/registry-data-port.js";
import type { RepositorySnapshotReadPort } from "../ports/repository-snapshot-read-port.js";
import type { CategoryDetail } from "../read-models/category-detail.js";

export type GetCategoryDetailInput = Readonly<{
  slug: string;
}>;

export interface GetCategoryDetailUseCase {
  execute(input: GetCategoryDetailInput): Promise<CategoryDetail>;
}

export class GetCategoryDetailService implements GetCategoryDetailUseCase {
  constructor(
    private readonly categoryReadPort: CategoryReadPort,
    private readonly repositorySnapshotReadPort: RepositorySnapshotReadPort,
    private readonly registryDataPort: RegistryDataPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: GetCategoryDetailInput): Promise<CategoryDetail> {
    const category = await this.categoryReadPort.findSummaryBySlug(input.slug);
    if (!category) {
      throw new ApplicationError("NOT_FOUND", "Category not found");
    }

    const repositoryRefs =
      await this.categoryReadPort.listRepositoriesByCategorySlug(input.slug);
    const latestSnapshots =
      await this.repositorySnapshotReadPort.findLatestByRepositoryIds(
        repositoryRefs.map((repositoryRef) => repositoryRef.repositoryId),
      );

    const repositories = await Promise.all(
      repositoryRefs.map(async (repositoryRef) => {
        const [snapshot, registryData] = await Promise.all([
          Promise.resolve(
            latestSnapshots.get(repositoryRef.repositoryId) ?? null,
          ),
          this.registryDataPort.findLatestByRepositoryId(
            repositoryRef.repositoryId,
          ),
        ]);

        const ownerType: RepositoryOwner["type"] = repositoryRef.owner.includes(
          "-",
        )
          ? "Organization"
          : "User";
        const dataStatus: CategoryRepositoryDataStatus = snapshot
          ? "ok"
          : "pending";

        return Object.freeze({
          owner: {
            login: repositoryRef.owner,
            type: ownerType,
          },
          name: repositoryRef.name,
          github: {
            openIssues: snapshot?.openIssues ?? null,
            lastCommitToDefaultBranchAt: snapshot?.lastCommitAt ?? null,
            defaultBranch: null,
            dataStatus,
            errorMessage: snapshot ? null : "Snapshot not collected yet",
          },
          registry: registryData
            ? Object.freeze({
                packageName: registryData.packageName,
                latestVersion: registryData.latestVersion,
                lastPublishedAt: registryData.lastPublishedAt,
                weeklyDownloads: registryData.weeklyDownloads,
                deprecated: registryData.deprecated ?? false,
                npmUrl: `https://www.npmjs.com/package/${encodeURIComponent(registryData.packageName)}`,
              })
            : null,
          links: {
            repo: `https://github.com/${repositoryRef.owner}/${repositoryRef.name}`,
          },
        });
      }),
    );

    const sortedRepositories = [...repositories].sort((a, b) => {
      const left = `${a.owner.login}/${a.name}`.toLowerCase();
      const right = `${b.owner.login}/${b.name}`.toLowerCase();
      return left.localeCompare(right);
    });

    const latestRecordedAt = [...latestSnapshots.values()]
      .map((snapshot) => snapshot.recordedAt)
      .sort()
      .at(-1);

    return Object.freeze({
      slug: category.slug,
      name: category.name,
      updatedAt: latestRecordedAt ?? this.now().toISOString(),
      repositories: sortedRepositories,
    });
  }
}
