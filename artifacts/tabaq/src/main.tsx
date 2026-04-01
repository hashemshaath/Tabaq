import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

// ── Sentry Frontend Error Monitoring ────────────────────────────────────────
// Disabled automatically when VITE_SENTRY_DSN is not set (dev-safe).
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    // Trace 10% of transactions in production
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Only capture session replays for 1% of sessions (10% on errors)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.1,
    beforeSend(event) {
      // Strip any auth tokens from URLs before sending to Sentry
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[^&]+/, "token=[REDACTED]");
      }
      return event;
    },
  });
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (sentryDsn) {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    }
  }

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
