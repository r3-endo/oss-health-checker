import { describe, expect, it } from "vitest";
import {
  resolveSelectedCategorySlug,
  sortCategoriesByDisplayOrder,
} from "../src/features/repositories/hooks/category-selection";

const categories = [
  { slug: "backend", name: "Backend", displayOrder: 2 },
  { slug: "llm", name: "LLM", displayOrder: 1 },
  { slug: "frontend", name: "Frontend", displayOrder: 3 },
] as const;

describe("category-selection", () => {
  it("sorts categories by displayOrder ascending", () => {
    const sorted = sortCategoriesByDisplayOrder(categories);

    expect(sorted.map((category) => category.slug)).toEqual([
      "llm",
      "backend",
      "frontend",
    ]);
  });

  it("keeps selected slug when it exists", () => {
    const sorted = sortCategoriesByDisplayOrder(categories);

    expect(resolveSelectedCategorySlug("backend", sorted)).toBe("backend");
  });

  it("falls back to first category when selected slug is missing", () => {
    const sorted = sortCategoriesByDisplayOrder(categories);

    expect(resolveSelectedCategorySlug("infra", sorted)).toBe("llm");
  });

  it("returns null when no categories are available", () => {
    expect(resolveSelectedCategorySlug("llm", [])).toBeNull();
  });
});
