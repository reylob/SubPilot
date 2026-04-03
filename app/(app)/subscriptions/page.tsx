// app/(app)/subscriptions/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { txListAll } from "@/lib/db/transactionsRepo";
import { subPutMany, subListAll } from "@/lib/db/subscriptionsRepo";
import type { SubscriptionRecord, TransactionRecord } from "@/lib/db/idb";
import { detectRecurring } from "@/lib/detect/detectRecurring";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { SubscriptionCard } from "@/components/app/SubscriptionCard";
import { settingsGet, settingsInitDefaults, settingsSet } from "@/lib/db/settingsRepo";

function money(n: number) {
  return `₱${n.toFixed(2)}`;
}

function mergeSub(existing: SubscriptionRecord, detected: SubscriptionRecord): SubscriptionRecord {
  // Preserve user choices
  const preservedStatus = existing.status;
  const preservedReminderDays = existing.reminderDaysBefore;
  const preservedPush = existing.remindViaPush;
  const preservedEmail = existing.remindViaEmail;

  return {
    ...detected,

    // preserve identity + user prefs
    id: existing.id,
    status: preservedStatus,
    reminderDaysBefore: preservedReminderDays,
    remindViaPush: preservedPush,
    remindViaEmail: preservedEmail,

    // preserve createdAt (first seen)
    createdAt: existing.createdAt ?? detected.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export default function SubscriptionsPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);
  const [txCount, setTxCount] = useState(0);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    (async () => {
      setError("");
      setBusy(true);
      try {
        const txs: TransactionRecord[] = await txListAll();
        setTxCount(txs.length);

        // Load existing subs first (to preserve user edits)
        const existing = await subListAll();
        const existingByMerchant = new Map<string, SubscriptionRecord>();
        for (const s of existing) existingByMerchant.set(s.merchantCanonical, s);

        // Detect fresh values
        const detected = detectRecurring(txs);

        // Merge detected into existing
        const mergedByMerchant = new Map<string, SubscriptionRecord>();

        // Start by keeping all existing (including canceled)
        for (const s of existing) mergedByMerchant.set(s.merchantCanonical, s);

        // Upsert detected (merge if exists), but FREEZE canceled
        for (const d of detected) {
          const ex = existingByMerchant.get(d.merchantCanonical);

          if (ex?.status === "canceled") {
            mergedByMerchant.set(ex.merchantCanonical, ex);
            continue;
          }

          if (ex) mergedByMerchant.set(d.merchantCanonical, mergeSub(ex, d));
          else mergedByMerchant.set(d.merchantCanonical, d);
        }

        const merged = Array.from(mergedByMerchant.values());

        // Persist merged
        await subPutMany(merged);

        // Display: non-canceled first, then canceled
        merged.sort((a, b) => {
          const aCanceled = a.status === "canceled" ? 1 : 0;
          const bCanceled = b.status === "canceled" ? 1 : 0;
          if (aCanceled !== bCanceled) return aCanceled - bCanceled;
          return (b.confidence - a.confidence) || (b.avgAmount - a.avgAmount);
        });

        setSubs(merged);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load subscriptions");
      } finally {
        setBusy(false);
      }
      await settingsInitDefaults();
      const sc = await settingsGet("showCanceled");
      setShowCanceled(sc?.value ?? false);

      async function reloadSubsFromDb() {
  const stored = await subListAll();

  stored.sort((a, b) => {
    const aCanceled = a.status === "canceled" ? 1 : 0;
    const bCanceled = b.status === "canceled" ? 1 : 0;
    if (aCanceled !== bCanceled) return aCanceled - bCanceled;
    return (b.confidence - a.confidence) || (b.avgAmount - a.avgAmount);
  });

  setSubs(stored);
}
    })();
  }, []);

  const monthlyTotal = useMemo(() => {
    return subs
      .filter((s) => s.status !== "canceled")
      .filter((s) => s.cadence === "monthly")
      .reduce((acc, s) => acc + (s.avgAmount || 0), 0);
  }, [subs]);

  const visibleSubs = useMemo(() => {
    return showCanceled ? subs : subs.filter((s) => s.status !== "canceled");
  }, [subs, showCanceled]);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "baseline",
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Recurring charges</h1>
          <p style={{ opacity: 0.8, marginTop: 6 }}>
            Imported transactions: <b>{txCount}</b>
          </p>
        </div>

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
          Import again
        </Link>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <StatCard
          label="Estimated monthly (monthly only)"
          value={money(monthlyTotal)}
        />
        <StatCard label="Subscriptions tracked" value={String(subs.length)} />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={showCanceled}
            onChange={async (e) => {
              const v = e.target.checked;
              setShowCanceled(v);
              await settingsSet({ key: "showCanceled", value: v });
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 13 }}>Show canceled</span>
        </label>

        <span style={{ fontSize: 12, opacity: 0.75 }}>
          Showing <b>{visibleSubs.length}</b> of <b>{subs.length}</b>
        </span>
      </div>

      {busy && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
          }}
        >
          Detecting & merging…
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
          <b style={{ color: "#991b1b" }}>Error:</b>{" "}
          <span style={{ color: "#991b1b" }}>{error}</span>
        </div>
      )}

      {!busy && !error && visibleSubs.length === 0 && (
        <EmptyState
          title={
            subs.length === 0
              ? "No recurring charges detected yet"
              : "Nothing to show (canceled hidden)"
          }
          description={
            subs.length === 0
              ? "Import a longer date range and ensure expenses are negative amounts (debits)."
              : "Enable “Show canceled” to view items you’ve canceled."
          }
          actionHref="/import"
          actionLabel="Import a statement"
        />
      )}

      {!busy && !error && visibleSubs.length > 0 && (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {visibleSubs.map((s) => (
            <SubscriptionCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </main>
  );
}