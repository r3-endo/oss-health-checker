import {
  RegistryAdoptionListResponseSchema,
  type RegistryAdoptionRow,
} from "../model/schemas";

export class RegistryAdoptionApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RegistryAdoptionApiError";
  }
}

const parseError = (
  status: number,
  json: unknown,
): RegistryAdoptionApiError => {
  if (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof (json as { error?: unknown }).error === "object" &&
    (json as { error: { code?: unknown; message?: unknown } }).error !== null
  ) {
    const error = (json as { error: { code?: unknown; message?: unknown } })
      .error;
    return new RegistryAdoptionApiError(
      status,
      typeof error.code === "string" ? error.code : "INTERNAL_ERROR",
      typeof error.message === "string" ? error.message : "Request failed",
    );
  }

  return new RegistryAdoptionApiError(
    status,
    "INTERNAL_ERROR",
    "Request failed",
  );
};

const expectJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export class HttpRegistryAdoptionApiAdapter {
  constructor(private readonly baseUrl: string) {}

  async listRepositories(): Promise<readonly RegistryAdoptionRow[]> {
    const response = await fetch(`${this.baseUrl}/api/dashboard/repositories`);
    const json = await expectJson(response);

    if (!response.ok) {
      throw parseError(response.status, json);
    }

    return RegistryAdoptionListResponseSchema.parse(json).data;
  }
}
