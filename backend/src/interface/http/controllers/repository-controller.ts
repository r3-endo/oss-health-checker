import type { Context } from "hono";
import { z } from "zod";
import { ApplicationError } from "../../../application/errors/application-error";
import type { ListRepositoriesWithLatestSnapshotUseCase } from "../../../application/use-cases/list-repositories-with-latest-snapshot-use-case";
import type { RefreshRepositoryUseCase } from "../../../application/use-cases/refresh-repository-use-case";
import type { RegisterRepositoryUseCase } from "../../../application/use-cases/register-repository-use-case";

const RegisterRepositoryBodySchema = z.object({
  url: z.string().url(),
});

const RepositoryParamsSchema = z.object({
  id: z.string().min(1),
});

export class RepositoryController {
  constructor(
    private readonly listRepositoriesWithLatestSnapshotUseCase: ListRepositoriesWithLatestSnapshotUseCase,
    private readonly registerRepositoryUseCase: RegisterRepositoryUseCase,
    private readonly refreshRepositoryUseCase: RefreshRepositoryUseCase,
  ) {}

  list = async (c: Context): Promise<Response> => {
    const data = await this.listRepositoriesWithLatestSnapshotUseCase.execute();
    return c.json({ data });
  };

  create = async (c: Context): Promise<Response> => {
    const payload = await c.req.json().catch(() => {
      throw new ApplicationError("VALIDATION_ERROR", "Invalid JSON body");
    });

    const parsed = RegisterRepositoryBodySchema.safeParse(payload);
    if (!parsed.success) {
      throw new ApplicationError("VALIDATION_ERROR", "Invalid repository URL");
    }

    const data = await this.registerRepositoryUseCase.execute(parsed.data);
    return c.json({ data }, 201);
  };

  refresh = async (c: Context): Promise<Response> => {
    const parsed = RepositoryParamsSchema.safeParse(c.req.param());
    if (!parsed.success) {
      throw new ApplicationError("VALIDATION_ERROR", "Invalid repository id");
    }

    const data = await this.refreshRepositoryUseCase.execute({
      repositoryId: parsed.data.id,
    });
    return c.json({ data });
  };
}
