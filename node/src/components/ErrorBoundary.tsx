import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("Unhandled frontend render error:", error);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main role="alert" aria-live="assertive">
          <h1>Something went wrong</h1>
          <p>The application could not render this view.</p>
          <button type="button" onClick={this.handleRetry}>
            Try again
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
