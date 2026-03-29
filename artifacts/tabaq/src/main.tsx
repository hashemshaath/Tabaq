import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
          <h2 style={{ color: '#7B28C8', marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Please refresh the page to continue.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#7B28C8', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Refresh Page
          </button>
          {import.meta.env.DEV && (
            <pre style={{ marginTop: '24px', textAlign: 'left', background: '#f5f5f5', padding: '16px', borderRadius: '8px', fontSize: '12px', overflow: 'auto', color: '#c00' }}>
              {(this.state.error as Error).message}
              {'\n'}
              {(this.state.error as Error).stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
