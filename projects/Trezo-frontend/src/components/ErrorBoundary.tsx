import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="hero">
          <div className="hero-content">
            <div className="card">
              <h2 className="modal-title">⚠️ Something went wrong</h2>
              <p className="app-subtitle">An unexpected error occurred. Please refresh the page and try again.</p>
              {this.state.error && (
                <div className="status-message status-error">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
              )}
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                <span className="emoji">🔄</span>
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
