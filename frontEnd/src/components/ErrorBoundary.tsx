import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-background p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
            <p className="text-text-secondary text-sm">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-3 rounded-panel font-bold text-xs uppercase tracking-widest bg-brand-primary/10 border border-brand-primary/20 text-brand-success hover:bg-brand-primary/20 hover:border-brand-primary/40 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
