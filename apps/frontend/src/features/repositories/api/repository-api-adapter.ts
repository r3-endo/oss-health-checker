import {
  ApiErrorSchema,
  CategoryDetailResponseSchema,
  ListCategoriesResponseSchema,
  RefreshRepositoryResponseSchema,
  RegisterRepositoryInputSchema,
  RegisterRepositoryResponseSchema,
  RepositoryListResponseSchema,
} from "../model/schemas";
import type { RepositoryApiPort } from "./repository-api-port";
import type {
  CategoryDetail,
  CategorySummary,
  RepositoryApiRepository,
  RepositoryApiSnapshot,
  RegisterRepositoryInput,
  RefreshRepositoryResponse,
  RepositoryView,
} from "../model/types";

export class RepositoryApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RepositoryApiError";
  }
}

const parseErrorResponse = (
  status: number,
  json: unknown,
): RepositoryApiError => {
  const parsed = ApiErrorSchema.safeParse(json);

  if (parsed.success) {
    return new RepositoryApiError(
      status,
      parsed.data.error.code,
      parsed.data.error.message,
    );
  }

  return new RepositoryApiError(status, "INTERNAL_ERROR", "Request failed");
};

const expectJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const toRepositoryView = (
  repository: RepositoryApiRepository,
  snapshot: RepositoryApiSnapshot,
): RepositoryView =>
  Object.freeze({
    id: repository.id,
    url: repository.url,
    owner: repository.owner,
    name: repository.name,
    status: snapshot.status,
    warningReasons: snapshot.warningReasons,
    lastCommitAt: snapshot.lastCommitAt,
    lastReleaseAt: snapshot.lastReleaseAt,
    openIssuesCount: snapshot.openIssuesCount,
    contributorsCount: snapshot.contributorsCount,
    fetchedAt: snapshot.fetchedAt,
  });

export class HttpRepositoryApiAdapter implements RepositoryApiPort {
  constructor(private readonly baseUrl: string) {}

  async listCategories(): Promise<readonly CategorySummary[]> {
    const response = await fetch(`${this.baseUrl}/api/categories`);
    const json = await expectJson(response);

    if (!response.ok) {
      throw parseErrorResponse(response.status, json);
    }

    return ListCategoriesResponseSchema.parse(json).data;
  }

  async getCategoryDetail(slug: string): Promise<CategoryDetail> {
    const response = await fetch(
      `${this.baseUrl}/api/categories/${encodeURIComponent(slug)}`,
    );
    const json = await expectJson(response);

    if (!response.ok) {
      throw parseErrorResponse(response.status, json);
    }

    return CategoryDetailResponseSchema.parse(json).data;
  }

  async listRepositories(): Promise<readonly RepositoryView[]> {
    const response = await fetch(`${this.baseUrl}/api/repositories`);
    const json = await expectJson(response);

    if (!response.ok) {
      throw parseErrorResponse(response.status, json);
    }

    const parsed = RepositoryListResponseSchema.parse(json);

    return parsed.data.map(({ repository, snapshot }) => {
      if (!snapshot) {
        throw new RepositoryApiError(
          500,
          "INTERNAL_ERROR",
          "Missing snapshot data",
        );
      }
      return toRepositoryView(repository, snapshot);
    });
  }

  async registerRepository(
    input: RegisterRepositoryInput,
  ): Promise<RepositoryView> {
    const payload = RegisterRepositoryInputSchema.parse(input);
    const response = await fetch(`${this.baseUrl}/api/repositories`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await expectJson(response);

    if (!response.ok) {
      throw parseErrorResponse(response.status, json);
    }

    const parsed = RegisterRepositoryResponseSchema.parse(json);
    return toRepositoryView(parsed.data.repository, parsed.data.snapshot);
  }

  async refreshRepository(
    repositoryId: string,
  ): Promise<RefreshRepositoryResponse["data"]> {
    const response = await fetch(
      `${this.baseUrl}/api/repositories/${repositoryId}/refresh`,
      {
        method: "POST",
      },
    );
    const json = await expectJson(response);

    if (!response.ok) {
      throw parseErrorResponse(response.status, json);
    }

    return RefreshRepositoryResponseSchema.parse(json).data;
  }
}
