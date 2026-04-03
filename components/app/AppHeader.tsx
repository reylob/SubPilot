// components/app/AppHeader.tsx
import Link from "next/link";

export function AppHeader() {
  return (
    <header
      style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Link href="/import" style={{ fontWeight: 900, textDecoration: "none", color: "inherit" }}>
        SubPilot
      </Link>

      <nav style={{ display: "flex", gap: 12, fontSize: 13 }}>
        <Link href="/import">Import</Link>
        <Link href="/subscriptions">Subscriptions</Link>
        <Link href="/upcoming">Upcoming</Link>
        <Link href="/settings">Settings</Link>
      </nav>
    </header>
  );
}