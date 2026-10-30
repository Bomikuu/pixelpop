import { Component, Suspense } from "react";
import { ErrorState, LoadingState } from "./Panel";

export default class DashboardPageBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <ErrorState message="This page could not load. Reload the workspace to try again." retry={() => window.location.reload()} />;
    }
    return <Suspense fallback={<LoadingState message="Opening your workspace page…" className="min-h-[50dvh]" />}>
      {this.props.children}
    </Suspense>;
  }
}
