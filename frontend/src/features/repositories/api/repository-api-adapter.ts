import {
  ApiErrorSchema,
  RegisterRepositoryInputSchema,
  RepositoryListResponseSchema,
  RepositoryViewSchema,
} from "../model/schemas";
import type { RepositoryApiPort } from "./repository-api-port";
import type { RegisterRepositoryInput, RepositoryView } from "../model/types";

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

export class HttpRepositoryApiAdapter implements RepositoryApiPort {
  constructor(private readonly baseUrl: string) {}

  async listRepositories(): Promise<readonly RepositoryView[]> {
    const response = await fetch(`${this.baseUrl}/api/repositories`);
    const json = await expectJson(response);

    if (!response.ok) {
      throw parseErrorResponse(response.status, json);
    }

    return RepositoryListResponseSchema.parse(json).data;
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

    return RepositoryViewSchema.parse((json as { data: unknown }).data);
  }

  async refreshRepository(repositoryId: string): Promise<RepositoryView> {
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

    return RepositoryViewSchema.parse((json as { data: unknown }).data);
  }
}
