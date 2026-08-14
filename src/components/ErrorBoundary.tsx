import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  stack: string | null;
}

/**
 * Error boundary global — mencegah layar kosong (blank) saat terjadi error;
 * error ditampilkan agar bisa dilaporkan/diperbaiki.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, stack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
    this.setState({ stack: info.componentStack ?? null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          maxWidth: 720,
        }}
      >
        <h2 style={{ color: "#b91c1c", marginBottom: 8 }}>
          Terjadi kesalahan saat menjalankan aplikasi.
        </h2>
        <p style={{ color: "#334155" }}>
          <b>{this.state.error.message}</b>
        </p>
        {this.state.stack && (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: 300,
              overflow: "auto",
              background: "#f1f5f9",
              padding: 12,
              borderRadius: 8,
              color: "#475569",
            }}
          >
            {this.state.stack}
          </pre>
        )}
        <p style={{ color: "#64748b" }}>
          Coba hard-refresh (Ctrl+Shift+R). Jika tetap muncul, buka DevTools
          (F12) → tab <b>Console</b>, lalu laporkan pesan error di atas.
        </p>
      </div>
    );
  }
}