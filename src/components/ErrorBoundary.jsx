import { Component } from "react";

/* global process */

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[EPIONARA ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback, t } = this.props;
      if (fallback) return fallback;

      return (
        <div style={{
          minHeight: "40vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
        }}>
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 20,
            padding: "32px 40px",
            maxWidth: 400,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{
              color: "#fca5a5",
              fontSize: 18,
              fontWeight: 700,
              margin: "0 0 12px",
            }}>
              {t?.error_title || "Có lỗi xảy ra"}
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              lineHeight: 1.6,
              margin: "0 0 20px",
            }}>
              {t?.error_desc || "Tính năng này gặp sự cố. Hãy thử lại hoặc làm mới trang."}
            </p>
            {(typeof process !== "undefined" ? process.env.NODE_ENV === "development" : import.meta.env.DEV) && this.state.error && (
              <details style={{ marginBottom: 16, textAlign: "left" }}>
                <summary style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                  {t?.error_dev_details || "Chi tiết lỗi (dev only)"}
                </summary>
                <pre style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 10,
                  color: "#fca5a5",
                  overflowX: "auto",
                  marginTop: 8,
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              aria-label={t?.error_retry || "Thử lại"}
              style={{
                padding: "10px 24px",
                borderRadius: 99,
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              🔄 {t?.error_retry || "Thử lại"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
