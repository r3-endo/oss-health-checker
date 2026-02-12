import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryErrorBoundary } from "../src/app/error-boundary";

describe("QueryErrorBoundary", () => {
  it("renders children when there is no error", () => {
    const html = renderToStaticMarkup(
      <QueryErrorBoundary>
        <p>content</p>
      </QueryErrorBoundary>,
    );

    expect(html).toContain("content");
  });

  it("getDerivedStateFromError returns error state", () => {
    const error = new Error("test");
    const state = QueryErrorBoundary.getDerivedStateFromError(error);

    expect(state).toEqual({ error });
  });

  it("calls onReset when provided", () => {
    const onReset = vi.fn();

    // Construct an instance to test reset logic directly.
    // Error boundary rendering in an error state requires a client-side DOM
    // (SSR re-throws instead of catching), so we test the method in isolation.
    const instance = new QueryErrorBoundary({ children: null, onReset });
    instance.setState = vi.fn();

    // Access the private reset method via the prototype trick
    const resetFn = (instance as unknown as { reset: () => void }).reset;
    resetFn();

    expect(onReset).toHaveBeenCalledOnce();
    expect(instance.setState).toHaveBeenCalledWith({ error: null });
  });
});
