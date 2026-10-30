import { Component, Suspense } from "react";
import { ErrorState, Panel } from "./Panel";

export default class DashboardPageBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <ErrorState message="This page could not load. Reload the workspace to try again." retry={() => window.location.reload()} />;
    }
    return <Suspense fallback={<Panel title="Loading page"><p role="status" className="text-sm text-slate-600">Opening your workspace page…</p></Panel>}>
      {this.props.children}
    </Suspense>;
  }
}
