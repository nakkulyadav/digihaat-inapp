import { Component } from "react";
import { T } from "./tokens";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh", gap: 12,
        background: T.work, color: T.ink, fontFamily: "Inter, system-ui, sans-serif",
      }}>
        <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>Something went wrong.</p>
        <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>Refresh the page to continue.</p>
        <pre style={{
          fontSize: 11, color: T.sub, background: T.line,
          padding: "8px 12px", borderRadius: 6, maxWidth: 480, overflowX: "auto",
        }}>{this.state.error.message}</pre>
      </div>
    );
  }
}
