import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
};

type State = { error: Error | null };

export class QueryErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[QueryErrorBoundary]", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset,
        });
      }

      return (
        <div className="rounded border border-status-risky/20 bg-status-risky/5 px-5 py-6 text-center">
          <p className="text-sm text-status-risky">
            Something went wrong loading this section.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-3 inline-flex items-center rounded border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
