import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const collectTsFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => path.join(e.parentPath, e.name));
};

describe("layer boundary: application must not depend on infrastructure", () => {
  it("application layer files do not import drizzle or infrastructure modules", () => {
    const applicationDir = path.resolve(__dirname, "../../src/application");
    const files = collectTsFiles(applicationDir);

    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          continue;
        }
        if (
          /(?:from\s+|import\s+|require\().*drizzle/.test(line) ||
          /(?:from\s+|import\s+|require\().*infrastructure/.test(line)
        ) {
          const relativePath = path.relative(applicationDir, file);
          violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
