import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../..");

const collectTsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return [];
  }
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => path.join(e.parentPath, e.name));
};

describe("app layout boundary: monorepo structure", () => {
  it("apps/backend directory exists", () => {
    const dir = path.join(repoRoot, "apps/backend");
    expect(existsSync(dir)).toBe(true);
  });

  it("apps/batch directory exists", () => {
    const dir = path.join(repoRoot, "apps/batch");
    expect(existsSync(dir)).toBe(true);
  });

  it("apps/frontend directory exists", () => {
    const dir = path.join(repoRoot, "apps/frontend");
    expect(existsSync(dir)).toBe(true);
  });

  it("packages/common directory exists", () => {
    const dir = path.join(repoRoot, "packages/common");
    expect(existsSync(dir)).toBe(true);
  });

  it("db directory exists", () => {
    const dir = path.join(repoRoot, "db");
    expect(existsSync(dir)).toBe(true);
  });

  it("infra directory exists", () => {
    const dir = path.join(repoRoot, "infra");
    expect(existsSync(dir)).toBe(true);
  });
});

describe("app isolation boundary: apps must not import from other apps", () => {
  it("apps/backend files do not import from apps/batch", () => {
    const backendDir = path.join(repoRoot, "apps/backend");
    const files = collectTsFiles(backendDir);

    if (files.length === 0) {
      // Directory doesn't exist yet - test will fail in directory check above
      expect(files.length).toBeGreaterThan(0);
      return;
    }

    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          continue;
        }
        // Check for imports from apps/batch
        if (/(?:from\s+|import\s+|require\().*["'].*apps\/batch/.test(line)) {
          const relativePath = path.relative(backendDir, file);
          violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("apps/batch files do not import from apps/backend", () => {
    const batchDir = path.join(repoRoot, "apps/batch");
    const files = collectTsFiles(batchDir);

    if (files.length === 0) {
      // Directory doesn't exist yet - test will fail in directory check above
      expect(files.length).toBeGreaterThan(0);
      return;
    }

    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          continue;
        }
        // Check for imports from apps/backend
        if (/(?:from\s+|import\s+|require\().*["'].*apps\/backend/.test(line)) {
          const relativePath = path.relative(batchDir, file);
          violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("apps/frontend files do not import from apps/backend or apps/batch", () => {
    const frontendDir = path.join(repoRoot, "apps/frontend");
    const files = collectTsFiles(frontendDir);

    if (files.length === 0) {
      // Placeholder only — no .ts files to scan yet; pass vacuously
      return;
    }

    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          continue;
        }
        // Check for imports from other apps
        if (
          /(?:from\s+|import\s+|require\().*["'].*apps\/backend/.test(line) ||
          /(?:from\s+|import\s+|require\().*["'].*apps\/batch/.test(line)
        ) {
          const relativePath = path.relative(frontendDir, file);
          violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe("entrypoint consolidation: apps/* is the official entrypoint", () => {
  it("apps/backend has package.json with start/dev scripts", () => {
    const pkgPath = path.join(repoRoot, "apps/backend/package.json");
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.dev || pkg.scripts.start).toBeDefined();
  });

  it("apps/batch has package.json with batch scripts", () => {
    const pkgPath = path.join(repoRoot, "apps/batch/package.json");
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts).toBeDefined();
  });

  it("root backend/ must not contain source code (only tests, config, docs, scripts)", () => {
    const backendSrcDir = path.join(repoRoot, "backend/src");
    if (existsSync(backendSrcDir)) {
      const tsFiles = collectTsFiles(backendSrcDir);
      expect(tsFiles).toEqual([]);
    }
  });

  it("root frontend/ must not be the official entrypoint (apps/frontend takes precedence)", () => {
    const appsFrontendPkg = path.join(repoRoot, "apps/frontend/package.json");
    // apps/frontend must exist as official entrypoint
    expect(existsSync(appsFrontendPkg)).toBe(true);
  });

  it("root package.json scripts reference apps/* packages, not root backend/frontend directly", () => {
    const rootPkg = JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf-8"),
    );
    const scripts = rootPkg.scripts || {};
    const violations: string[] = [];
    for (const [name, cmd] of Object.entries(scripts)) {
      const command = cmd as string;
      // Scripts should not cd into backend/ or frontend/ directly
      if (/\bcd\s+(backend|frontend)\b/.test(command)) {
        violations.push(`${name}: ${command}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("contract test baseline: existing tests must not be lost", () => {
  it("backend/tests/contracts directory contains all existing contract tests", () => {
    const contractsDir = path.join(repoRoot, "backend/tests/contracts");
    const files = readdirSync(contractsDir).filter((f) =>
      f.endsWith(".test.ts"),
    );

    // As of baseline, there are 8 contract test files (plus the new one being added)
    // Ensure we don't accidentally lose any during migration
    expect(files.length).toBeGreaterThanOrEqual(8);

    // List of known contract tests that must exist
    const requiredTests = [
      "adoption-openapi.contract.test.ts",
      "category-api.contract.test.ts",
      "dashboard-overview-openapi.contract.test.ts",
      "display-api-db-read-only.contract.test.ts",
      "github-registry-boundary.contract.test.ts",
      "layer-boundary.test.ts",
      "openapi-route-binding.contract.test.ts",
    ];

    for (const testFile of requiredTests) {
      expect(files).toContain(testFile);
    }
  });
});
