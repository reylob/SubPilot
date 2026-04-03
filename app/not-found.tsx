// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>404</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Page not found.
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <Link
          href="/import"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111827",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Go to Import
        </Link>
        <Link href="/subscriptions" style={{ alignSelf: "center" }}>
          Subscriptions
        </Link>
      </div>
    </main>
  );
}