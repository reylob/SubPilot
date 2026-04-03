// app/(app)/upcoming/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { subListAll } from "@/lib/db/subscriptionsRepo";
import type { SubscriptionRecord } from "@/lib/db/idb";

function money(n: number) {
  return `₱${n.toFixed(2)}`;
}

function daysUntil(isoDate: string) {
  const target = new Date(isoDate + "T00:00:00Z").getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / 86400000);
}

export default function UpcomingPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setError("");
      try {
        const all = await subListAll();
        setSubs(all);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load upcoming renewals");
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const upcoming = useMemo(() => {
    return subs
      .filter((s) => s.status !== "canceled")
      .filter((s) => !!s.nextRenewalAt)
      .map((s) => ({ ...s, d: daysUntil(s.nextRenewalAt!) }))
      .filter((s) => s.d >= -7 && s.d <= 60) // show near past week to next 60 days
      .sort((a, b) => a.d - b.d);
  }, [subs]);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Upcoming renewals</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>Based on detected next renewal dates (best-effort for MVP).</p>

      {busy && (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          Loading…
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            borderRadius: 12,
          }}
        >
          <b style={{ color: "#991b1b" }}>Error:</b> <span style={{ color: "#991b1b" }}>{error}</span>
        </div>
      )}

      {!busy && !error && upcoming.length === 0 && (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          No upcoming renewals found yet. Import more history so we can estimate renewal dates.
          <div style={{ marginTop: 10 }}>
            <Link href="/import" style={{ fontWeight: 700 }}>
              Import a statement
            </Link>
          </div>
        </div>
      )}

      {!busy && !error && upcoming.length > 0 && (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {upcoming.map((s) => (
            <Link
              key={s.id}
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

              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Next: <b>{s.nextRenewalAt}</b> •{" "}
                <b>{s.d >= 0 ? `${s.d} day(s) left` : `${Math.abs(s.d)} day(s) ago`}</b>
              </div>

              <div style={{ fontSize: 12, opacity: 0.7 }}>
                cadence: <b>{s.cadence}</b> • confidence: <b>{s.confidence}%</b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}