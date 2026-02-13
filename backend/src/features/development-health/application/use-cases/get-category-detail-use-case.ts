import { ApplicationError } from "../errors/application-error.js";
import type { CategoryReadPort } from "../ports/category-read-port.js";
import type { CategoryRepositoryFactsPort } from "../ports/category-repository-facts-port.js";
import type { RegistryDataPort } from "../ports/registry-data-port.js";
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
    private readonly categoryRepositoryFactsPort: CategoryRepositoryFactsPort,
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

    const repositories = await Promise.all(
      repositoryRefs.map(async (repositoryRef) => {
        const [facts, registryData] = await Promise.all([
          this.categoryRepositoryFactsPort.fetchCategoryRepositoryFacts(
            repositoryRef.owner,
            repositoryRef.name,
          ),
          this.registryDataPort.findLatestByRepositoryId(
            repositoryRef.repositoryId,
          ),
        ]);

        return Object.freeze({
          owner: facts.owner,
          name: repositoryRef.name,
          github: {
            openIssues: facts.openIssues,
            lastCommitToDefaultBranchAt: facts.lastCommitToDefaultBranchAt,
            defaultBranch: facts.defaultBranch,
            dataStatus: facts.dataStatus,
            errorMessage: facts.errorMessage,
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

    return Object.freeze({
      slug: category.slug,
      name: category.name,
      updatedAt: this.now().toISOString(),
      repositories: sortedRepositories,
    });
  }
}
