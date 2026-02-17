"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-bearish)]" />
              <h2 className="text-sm font-semibold">Something went wrong</h2>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              An unexpected error occurred in this part of the UI. Refresh the page to try again.
            </p>
            {this.state.error && (
              <pre className="rounded-lg bg-[var(--muted)] px-3 py-2 text-[10px] font-mono text-[var(--muted-foreground)] overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-medium text-[var(--color-brand)] hover:underline underline-offset-2"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
