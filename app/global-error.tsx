"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest || error.message);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          fontFamily: "Tajawal, system-ui, sans-serif",
          background: "linear-gradient(160deg, #f7fafc 0%, #e8f0f8 55%, #f4f7fb 100%)",
          color: "#0f2f5b"
        }}
      >
        <div
          style={{
            width: "min(100%, 34rem)",
            textAlign: "center",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(15,47,91,0.08)",
            borderRadius: "1.25rem",
            padding: "2rem 1.5rem",
            boxShadow: "0 18px 40px rgba(15,47,91,0.08)"
          }}
        >
          <p style={{ margin: 0, letterSpacing: "0.2em", fontSize: "0.75rem", fontWeight: 700 }}>
            خطأ مؤقت
          </p>
          <h1 style={{ margin: "1rem 0 0.75rem", fontSize: "1.75rem", lineHeight: 1.35 }}>
            الموقع ما زال شغّال — جرّب مرة ثانية
          </h1>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: "0.95rem" }}>
            حصل خلل غير متوقع. أعد المحاولة أو ارجع للصفحة الرئيسية.
          </p>
          <div
            style={{
              marginTop: "1.75rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center"
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: "0.75rem",
                padding: "0.75rem 1.25rem",
                background: "#0f2f5b",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              إعادة المحاولة
            </button>
            <a
              href="/"
              style={{
                borderRadius: "0.75rem",
                padding: "0.75rem 1.25rem",
                background: "#fff",
                border: "1px solid rgba(15,47,91,0.15)",
                color: "#0f2f5b",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              العودة للرئيسية
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
