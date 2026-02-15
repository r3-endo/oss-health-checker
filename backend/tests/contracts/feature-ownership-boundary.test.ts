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

  describe("1.2 packages/common/* is for cross-app reuse only", () => {
    it("packages/common/src/features must not contain HTTP controllers", () => {
      const controllersDir = path.join(
        repoRoot,
        "packages/common/src/features",
      );
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

    it("packages/common/src/shared/bootstrap must not contain backend-specific composition root", () => {
      const bootstrapDir = path.join(
        repoRoot,
        "packages/common/src/shared/bootstrap",
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
    it("apps/batch files do not import from apps/backend/interface", () => {
      const batchDir = path.join(repoRoot, "apps/batch/src");
      const files = collectTsFiles(batchDir);

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
      const batchDir = path.join(repoRoot, "apps/batch/src");
      const files = collectTsFiles(batchDir);

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
  });
});
