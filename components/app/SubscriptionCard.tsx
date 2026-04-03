// components/app/SubscriptionCard.tsx
import Link from "next/link";
import type { SubscriptionRecord } from "@/lib/db/idb";

function money(n: number) {
  return `₱${n.toFixed(2)}`;
}

function Pill(props: { children: React.ReactNode }) {
  return (
    <span style={{ border: "1px solid #e5e7eb", borderRadius: 999, padding: "4px 8px" }}>
      {props.children}
    </span>
  );
}

export function SubscriptionCard({ s }: { s: SubscriptionRecord }) {
  return (
    <Link
      href={`/subscriptions/${encodeURIComponent(s.id)}`}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
        textDecoration: "none",
        color: "inherit",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <div style={{ fontWeight: 900 }}>{s.displayName}</div>
        <div style={{ fontWeight: 900 }}>{money(s.avgAmount)}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, opacity: 0.85 }}>
        <Pill>{s.status}</Pill>
        <Pill>{s.cadence}</Pill>
        <Pill>confidence {s.confidence}%</Pill>
        {s.nextRenewalAt && <Pill>next {s.nextRenewalAt}</Pill>}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Last: <b>{s.lastChargeAt}</b> • Last amount: <b>{money(s.lastAmount)}</b>
      </div>
    </Link>
  );
}