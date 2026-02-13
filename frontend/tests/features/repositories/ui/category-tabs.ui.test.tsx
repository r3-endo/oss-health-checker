import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CategoryTabs } from "../../../../src/features/repositories/ui/components/CategoryTabs";

type TabButtonElement = ReactElement<{ onClick: () => void }, "button">;
type TabsNavElement = ReactElement<{ children: TabButtonElement[] }, "nav">;

describe("CategoryTabs", () => {
  const categories = [
    { slug: "llm", name: "LLM", displayOrder: 0 },
    { slug: "backend", name: "Backend", displayOrder: 1 },
  ] as const;

  it("renders category tab labels", () => {
    const html = renderToStaticMarkup(
      <CategoryTabs
        categories={categories}
        selectedSlug="llm"
        onSelect={() => undefined}
      />,
    );

    expect(html).toContain("LLM");
    expect(html).toContain("Backend");
    expect(html).toContain('aria-pressed="true"');
  });

  it("calls onSelect with clicked tab slug", () => {
    const onSelect = vi.fn();
    const tree = CategoryTabs({
      categories,
      selectedSlug: "llm",
      onSelect,
    }) as TabsNavElement;

    const children = tree.props.children;
    const backendButton = children[1];
    backendButton.props.onClick();

    expect(onSelect).toHaveBeenCalledWith("backend");
  });
});
