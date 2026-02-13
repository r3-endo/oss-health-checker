import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardPage } from "../../../../src/features/dashboard/ui/pages/DashboardPage";

vi.mock(
  "../../../../src/features/repositories/hooks/use-categories-query",
  () => ({
    useCategoriesQuery: () => ({
      data: [
        { slug: "llm", name: "LLM", displayOrder: 0 },
        { slug: "backend", name: "Backend", displayOrder: 1 },
      ],
    }),
  }),
);

vi.mock(
  "../../../../src/features/registry-adoption/hooks/use-registry-adoption-repositories-query",
  () => ({
    useRegistryAdoptionRepositoriesQuery: () => ({
      data: [{ repository: { id: "repo-1" } }],
    }),
  }),
);

describe("DashboardPage", () => {
  it("renders hub links and summary cards", () => {
    const html = renderToStaticMarkup(<DashboardPage />);
    expect(html).toContain("OSS Dashboard");
    expect(html).toContain('href="/github"');
    expect(html).toContain('href="/registry"');
    expect(html).toContain("Categories: 2");
    expect(html).toContain("Repositories: 1");
  });
});
