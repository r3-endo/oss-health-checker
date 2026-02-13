import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDrizzleHandle,
  type DrizzleDatabaseHandle,
} from "../../src/infrastructure/db/drizzle/client.js";
import { migrateDrizzleDatabase } from "../../src/infrastructure/db/drizzle/migrate.js";

describe("category schema migration", () => {
  let tempDir: string;
  let db: DrizzleDatabaseHandle;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "category-schema-"));
    const databasePath = path.join(tempDir, "test.sqlite");
    db = createDrizzleHandle({ DATABASE_URL: `file:${databasePath}` });
    migrateDrizzleDatabase(db);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates categories and repository_categories with defaults and constraints", () => {
    db.sqlite
      .prepare(
        `
          INSERT INTO categories (id, slug, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run("cat-llm", "llm", "Large Language Models", 1, 1);

    const createdCategory = db.sqlite
      .prepare(
        `
          SELECT display_order, is_system
          FROM categories
          WHERE id = ?
        `,
      )
      .get("cat-llm") as { display_order: number; is_system: number };
    expect(createdCategory.display_order).toBe(0);
    expect(createdCategory.is_system).toBe(1);

    expect(() =>
      db.sqlite
        .prepare(
          `
            INSERT INTO categories (id, slug, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `,
        )
        .run("cat-dup", "llm", "Duplicate", 1, 1),
    ).toThrow();

    db.sqlite
      .prepare(
        `
          INSERT INTO repositories (id, url, owner, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        "repo-1",
        "https://github.com/example/repo-1",
        "example",
        "repo-1",
        1,
        1,
      );

    db.sqlite
      .prepare(
        `
          INSERT INTO repository_categories (repository_id, category_id, created_at)
          VALUES (?, ?, ?)
        `,
      )
      .run("repo-1", "cat-llm", 1);

    expect(() =>
      db.sqlite
        .prepare(
          `
            INSERT INTO repository_categories (repository_id, category_id, created_at)
            VALUES (?, ?, ?)
          `,
        )
        .run("repo-1", "cat-llm", 1),
    ).toThrow();

    expect(() =>
      db.sqlite
        .prepare(
          `
            INSERT INTO repository_categories (repository_id, category_id, created_at)
            VALUES (?, ?, ?)
          `,
        )
        .run("repo-missing", "cat-llm", 1),
    ).toThrow();
  });

  it("enforces one snapshot per repository and UTC day with FK integrity", () => {
    db.sqlite
      .prepare(
        `
          INSERT INTO repositories (id, url, owner, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        "repo-1",
        "https://github.com/example/repo-1",
        "example",
        "repo-1",
        1,
        1,
      );

    db.sqlite
      .prepare(
        `
          INSERT INTO repository_snapshots (repository_id, recorded_at, open_issues, commit_count_30d)
          VALUES (?, ?, ?, ?)
        `,
      )
      .run("repo-1", "2026-02-13T00:00:00Z", 12, 7);

    expect(() =>
      db.sqlite
        .prepare(
          `
            INSERT INTO repository_snapshots (repository_id, recorded_at, open_issues, commit_count_30d)
            VALUES (?, ?, ?, ?)
          `,
        )
        .run("repo-1", "2026-02-13T00:00:00Z", 13, 8),
    ).toThrow();

    expect(() =>
      db.sqlite
        .prepare(
          `
            INSERT INTO repository_snapshots (repository_id, recorded_at, open_issues, commit_count_30d)
            VALUES (?, ?, ?, ?)
          `,
        )
        .run("repo-missing", "2026-02-13T00:00:00Z", 13, 8),
    ).toThrow();
  });
});
