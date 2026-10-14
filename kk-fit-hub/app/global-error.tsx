"use client";

/** Last-resort error page when the root layout itself fails. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-KE">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b0b0c", color: "#f2f2f0" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 40, letterSpacing: "-0.02em" }}>Something went wrong.</h1>
            <p style={{ color: "#a1a1a6", fontSize: 19 }}>Please try again. If it keeps happening, call 0722 524 438.</p>
            <button
              onClick={reset}
              style={{ marginTop: 24, minHeight: 52, padding: "0 28px", borderRadius: 999, border: 0, background: "#277a3d", color: "#fff", fontSize: 17, fontWeight: 600 }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
