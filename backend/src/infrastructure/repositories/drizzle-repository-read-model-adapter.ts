import type { RepositoryReadModelPort } from "../../application/ports/repository-read-model-port";
import type { RepositoryWithLatestSnapshot } from "../../application/read-models/repository-with-latest-snapshot";
import type { DrizzleDatabaseHandle } from "../db/drizzle/client";

export class DrizzleRepositoryReadModelAdapter implements RepositoryReadModelPort {
  constructor(private readonly db: DrizzleDatabaseHandle) {}

  async listWithLatestSnapshot(): Promise<
    readonly RepositoryWithLatestSnapshot[]
  > {
    throw new Error(
      `Not implemented: list with latest snapshot via ${this.db.kind}`,
    );
  }
}
