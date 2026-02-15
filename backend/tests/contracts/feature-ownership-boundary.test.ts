import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../..");
const backendDir = path.join(repoRoot, "apps/backend");
const batchDir = path.join(repoRoot, "apps/batch");
const commonFeaturesDir = path.join(repoRoot, "apps/common/src/features");

const collectTsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return [];
  }
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => path.join(e.parentPath, e.name));
};

const extractImportSpecifiers = (line: string): string[] => {
  const results: string[] = [];
  const fromMatch = line.match(/from\s+["']([^"']+)["']/);
  if (fromMatch?.[1]) {
    results.push(fromMatch[1]);
  }
  const importMatch = line.match(/import\s+["']([^"']+)["']/);
  if (importMatch?.[1]) {
    results.push(importMatch[1]);
  }
  const requireMatch = line.match(/require\(\s*["']([^"']+)["']\s*\)/);
  if (requireMatch?.[1]) {
    results.push(requireMatch[1]);
  }
  return results;
};

const countImportHits = (dir: string, importPath: string): number => {
  const files = collectTsFiles(dir);
  let hits = 0;
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      if (!line) {
        continue;
      }
      const specifiers = extractImportSpecifiers(line);
      if (specifiers.includes(importPath)) {
        hits++;
      }
    }
  }
  return hits;
};

const backendOnlyCommonCandidates = [
  "development-health/application/use-cases/get-category-detail-use-case.ts",
  "development-health/application/use-cases/list-category-summaries-use-case.ts",
  "development-health/application/use-cases/list-repositories-with-latest-snapshot-use-case.ts",
  "development-health/application/use-cases/register-repository-use-case.ts",
  "development-health/application/use-cases/refresh-repository-use-case.ts",
  "development-health/application/read-models/category-detail.ts",
  "development-health/application/read-models/category-summary.ts",
  "development-health/application/read-models/repository-with-latest-snapshot.ts",
  "development-health/application/services/github-repository-url.ts",
  "development-health/application/services/snapshot-factory.ts",
  "development-health/application/ports/category-read-port.ts",
  "development-health/application/ports/category-repository-facts-port.ts",
  "development-health/application/ports/registry-data-port.ts",
  "development-health/application/ports/repository-read-model-port.ts",
  "development-health/application/ports/repository-snapshot-read-port.ts",
  "development-health/application/ports/unit-of-work-port.ts",
  "development-health/infrastructure/repositories/drizzle-category-read-adapter.ts",
  "development-health/infrastructure/repositories/drizzle-registry-data-adapter.ts",
  "development-health/infrastructure/repositories/drizzle-repository-read-model-adapter.ts",
  "development-health/infrastructure/repositories/drizzle-repository-snapshot-read-adapter.ts",
  "development-health/infrastructure/repositories/drizzle-snapshot-adapter.ts",
  "development-health/infrastructure/repositories/drizzle-unit-of-work-adapter.ts",
  "ecosystem-adoption/application/use-cases/get-repository-adoption-use-case.ts",
  "ecosystem-adoption/application/use-cases/refresh-repository-adoption-use-case.ts",
  "ecosystem-adoption/application/read-models/repository-adoption-view.ts",
  "ecosystem-adoption/application/services/adoption-score-calculator.ts",
  "ecosystem-adoption/application/ports/repository-adoption-read-port.ts",
  "ecosystem-adoption/infrastructure/repositories/drizzle-repository-adoption-read-adapter.ts",
  "ecosystem-adoption/infrastructure/repositories/persisted-adoption-validation.ts",
];

describe("feature ownership boundary", () => {
  describe("1.1 apps/backend/features/* is the feature ownership boundary", () => {
    it("apps/backend/features/development-health directory exists", () => {
      const dir = path.join(
        repoRoot,
        "apps/backend/features/development-health",
      );
      expect(existsSync(dir)).toBe(true);
    });

    it("apps/backend/features/ecosystem-adoption directory exists", () => {
      const dir = path.join(
        repoRoot,
        "apps/backend/features/ecosystem-adoption",
      );
      expect(existsSync(dir)).toBe(true);
    });

    it("apps/backend/features/dashboard-overview directory exists", () => {
      const dir = path.join(
        repoRoot,
        "apps/backend/features/dashboard-overview",
      );
      expect(existsSync(dir)).toBe(true);
    });

    it("development-health feature contains at least one .ts file", () => {
      const dir = path.join(
        repoRoot,
        "apps/backend/features/development-health",
      );
      if (!existsSync(dir)) {
        // Feature directory doesn't exist yet - will fail in directory check above
        expect(existsSync(dir)).toBe(true);
        return;
      }
      const tsFiles = collectTsFiles(dir);
      expect(tsFiles.length).toBeGreaterThan(0);
    });

    it("ecosystem-adoption feature contains at least one .ts file", () => {
      const dir = path.join(
        repoRoot,
        "apps/backend/features/ecosystem-adoption",
      );
      if (!existsSync(dir)) {
        // Feature directory doesn't exist yet - will fail in directory check above
        expect(existsSync(dir)).toBe(true);
        return;
      }
      const tsFiles = collectTsFiles(dir);
      expect(tsFiles.length).toBeGreaterThan(0);
    });

    it("dashboard-overview feature contains at least one .ts file", () => {
      const dir = path.join(
        repoRoot,
        "apps/backend/features/dashboard-overview",
      );
      if (!existsSync(dir)) {
        // Feature directory doesn't exist yet - will fail in directory check above
        expect(existsSync(dir)).toBe(true);
        return;
      }
      const tsFiles = collectTsFiles(dir);
      expect(tsFiles.length).toBeGreaterThan(0);
    });
  });

  describe("1.2 apps/common/* is for cross-app reuse only", () => {
    it("apps/common/src/features must not contain HTTP controllers", () => {
      const controllersDir = path.join(repoRoot, "apps/common/src/features");
      if (!existsSync(controllersDir)) {
        // No features directory yet - pass vacuously
        return;
      }

      const allFiles = collectTsFiles(controllersDir);
      const violations: string[] = [];

      for (const file of allFiles) {
        const relativePath = path.relative(controllersDir, file);
        // Check if file is under interface/http/controllers or interface/http/routes
        if (
          /interface\/http\/controllers\/.*\.ts$/.test(relativePath) ||
          /interface\/http\/routes\/.*\.ts$/.test(relativePath)
        ) {
          violations.push(relativePath);
        }
      }

      expect(violations).toEqual([]);
    });

    it("apps/common/src/shared/bootstrap must not contain backend-specific composition root", () => {
      const bootstrapDir = path.join(
        repoRoot,
        "apps/common/src/shared/bootstrap",
      );
      if (!existsSync(bootstrapDir)) {
        // No bootstrap directory yet - pass vacuously
        return;
      }

      const allFiles = collectTsFiles(bootstrapDir);
      const violations: string[] = [];

      for (const file of allFiles) {
        const basename = path.basename(file);
        // These files are backend-specific and should be in apps/backend
        if (basename === "build-container.ts" || basename === "build-app.ts") {
          violations.push(path.relative(bootstrapDir, file));
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("1.3 apps/batch must not import from apps/backend/interface directly", () => {
    it("detects forbidden dependency: apps/batch -> apps/backend/interface/*", () => {
      const files = collectTsFiles(batchDir);
      const violations: string[] = [];

      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) {
            continue;
          }
          const importSpecifiers = extractImportSpecifiers(line);
          const hasViolation = importSpecifiers.some((specifier) =>
            specifier.includes("apps/backend/interface/"),
          );
          if (hasViolation) {
            const relativePath = path.relative(batchDir, file);
            violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("apps/batch files do not import from apps/backend/interface", () => {
      const files = collectTsFiles(path.join(batchDir, "src"));

      if (files.length === 0) {
        // No source files yet - pass vacuously
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
          // Check for imports from apps/backend/interface
          if (
            /(?:from\s+|import\s+|require\().*["'].*apps\/backend\/.*interface/.test(
              line,
            )
          ) {
            const relativePath = path.relative(batchDir, file);
            violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("apps/batch files do not import from apps/backend directly (general isolation)", () => {
      const files = collectTsFiles(path.join(batchDir, "src"));

      if (files.length === 0) {
        // No source files yet - pass vacuously
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
          if (
            /(?:from\s+|import\s+|require\().*["'].*apps\/backend/.test(line)
          ) {
            const relativePath = path.relative(batchDir, file);
            violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("apps/batch runtime entrypoints import shared contracts via @oss-health-checker/common", () => {
      const files = collectTsFiles(path.join(batchDir, "src"));
      const violations: string[] = [];

      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        const lines = content.split("\n");
        let hasSharedImport = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) {
            continue;
          }
          const importSpecifiers = extractImportSpecifiers(line);
          if (
            importSpecifiers.some((specifier) =>
              specifier.startsWith("@oss-health-checker/common/"),
            )
          ) {
            hasSharedImport = true;
          }
        }
        if (!hasSharedImport) {
          const relativePath = path.relative(batchDir, file);
          violations.push(
            `${relativePath}: missing @oss-health-checker/common import`,
          );
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("1.4 apps/common must not depend on apps/backend implementation", () => {
    it("detects forbidden dependency: apps/common -> apps/backend/*", () => {
      const files = collectTsFiles(commonFeaturesDir);
      const violations: string[] = [];

      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) {
            continue;
          }
          const importSpecifiers = extractImportSpecifiers(line);
          const hasViolation = importSpecifiers.some((specifier) =>
            specifier.includes("apps/backend/"),
          );
          if (hasViolation) {
            const relativePath = path.relative(commonFeaturesDir, file);
            violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("1.5 apps/common additions require cross-app usage evidence", () => {
    it("backend-only runtime candidates must not remain in apps/common without batch usage", () => {
      const violations: string[] = [];

      for (const relativeFile of backendOnlyCommonCandidates) {
        const absoluteFile = path.join(commonFeaturesDir, relativeFile);
        if (!existsSync(absoluteFile)) {
          continue;
        }
        const importPath = `@oss-health-checker/common/features/${relativeFile.replace(
          ".ts",
          ".js",
        )}`;
        const backendUsage = countImportHits(backendDir, importPath);
        const batchUsage = countImportHits(batchDir, importPath);

        if (backendUsage > 0 && batchUsage === 0) {
          violations.push(`${relativeFile}: backend=${backendUsage}, batch=0`);
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
