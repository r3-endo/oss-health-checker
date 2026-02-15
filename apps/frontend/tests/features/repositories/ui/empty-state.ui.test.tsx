import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState } from "../../../../src/features/repositories/ui/components/EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="Nothing here"
        description="Add something to get started."
      />,
    );

    expect(html).toContain("Nothing here");
    expect(html).toContain("Add something to get started.");
  });

  it("renders without description", () => {
    const html = renderToStaticMarkup(<EmptyState title="Empty" />);

    expect(html).toContain("Empty");
    expect(html).not.toContain("undefined");
  });

  it("renders icon when provided", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon={<span data-testid="icon">icon</span>}
        title="With icon"
      />,
    );

    expect(html).toContain("icon");
    expect(html).toContain("With icon");
  });
});
