// app/(app)/subscriptions/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { SubscriptionRecord, TransactionRecord } from "@/lib/db/idb";
import { subGet, subUpdateStatus, subPutOne } from "@/lib/db/subscriptionsRepo";
import { txListByMerchantCanonical } from "@/lib/db/transactionsRepo";

function money(n: number) {
  return `₱${n.toFixed(2)}`;
}

function Pill(props: { children: React.ReactNode }) {
  return (
    <span style={{ border: "1px solid #e5e7eb", borderRadius: 999, padding: "4px 8px", fontSize: 12, opacity: 0.9 }}>
      {props.children}
    </span>
  );
}

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(params.id);

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [sub, setSub] = useState<SubscriptionRecord | null>(null);
  const [charges, setCharges] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setError("");
      try {
        const s = await subGet(id);
        if (!s) {
          setError("Subscription not found. Re-run detection from Subscriptions page.");
          setBusy(false);
          return;
        }
        setSub(s);

        const txs = await txListByMerchantCanonical(s.merchantCanonical);
        setCharges(txs);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load subscription");
      } finally {
        setBusy(false);
      }
    })();
  }, [id]);

  const last3 = useMemo(() => charges.slice(0, 6), [charges]);

  async function setStatus(status: SubscriptionRecord["status"]) {
    if (!sub) return;
    await subUpdateStatus(sub.id, status);
    const updated = { ...sub, status, updatedAt: new Date().toISOString() };
    setSub(updated);
  }

  async function tweakReminder(days: number) {
    if (!sub) return;
    const next = { ...sub, reminderDaysBefore: days, updatedAt: new Date().toISOString() };
    await subPutOne(next);
    setSub(next);
  }

  if (busy) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>Loading…</div>
      </main>
    );
  }

  if (error || !sub) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
        <div style={{ padding: 14, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 12 }}>
          <b style={{ color: "#991b1b" }}>Error:</b>{" "}
          <span style={{ color: "#991b1b" }}>{error || "Not found"}</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/subscriptions" style={{ fontWeight: 800 }}>
            Back to subscriptions
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>{sub.displayName}</h1>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill>{sub.status}</Pill>
            <Pill>{sub.cadence}</Pill>
            <Pill>confidence {sub.confidence}%</Pill>
            {sub.nextRenewalAt && <Pill>next {sub.nextRenewalAt}</Pill>}
          </div>
        </div>

        <button
          onClick={() => router.push(`/subscriptions?ts=${Date.now()}`)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #111827", background: "white", fontWeight: 800 }}
        >
          Back
        </button>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Stat label="Avg" value={money(sub.avgAmount)} />
        <Stat label="Last" value={`${sub.lastChargeAt} • ${money(sub.lastAmount)}`} />
        <Stat label="Reminder" value={`${sub.reminderDaysBefore} day(s) before`} />
      </div>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <div style={{ fontWeight: 900 }}>Actions</div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setStatus("active")}
            style={btn(sub.status === "active")}
          >
            Mark Active
          </button>
          <button
            onClick={() => setStatus("possible")}
            style={btn(sub.status === "possible")}
          >
            Mark Possible
          </button>
          <button
            onClick={() => setStatus("canceled")}
            style={btn(sub.status === "canceled", true)}
          >
            Mark Canceled
          </button>
        </div>

        <div style={{ marginTop: 14, opacity: 0.8, fontSize: 12 }}>
          Reminder days before:
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[0, 1, 3, 7, 14].map((d) => (
            <button key={d} onClick={() => tweakReminder(d)} style={chip(sub.reminderDaysBefore === d)}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <div style={{ fontWeight: 900 }}>Recent charges</div>
        {last3.length === 0 ? (
          <p style={{ marginTop: 8, opacity: 0.8 }}>No matching transactions found for this merchant.</p>
        ) : (
          <div style={{ marginTop: 10, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={th()}>Date</th>
                  <th style={th()}>Amount</th>
                  <th style={th()}>Description</th>
                </tr>
              </thead>
              <tbody>
                {last3.map((t) => (
                  <tr key={t.id}>
                    <td style={td()}>{t.postedAt}</td>
                    <td style={td()}>{money(Math.abs(t.amount))}</td>
                    <td style={td()}>{t.descriptionRaw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Merchant key: <b>{sub.merchantCanonical}</b>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <div style={{ fontWeight: 900 }}>Cancel kit (stub)</div>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Next step: add a merchant directory in <code>data/merchants.json</code> and show cancel link + support email here.
        </p>
      </div>
    </main>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>{props.label}</div>
      <div style={{ fontSize: 14, fontWeight: 900, marginTop: 6 }}>{props.value}</div>
    </div>
  );
}

function btn(active: boolean, danger = false): React.CSSProperties {
  const border = danger ? "#991b1b" : "#111827";
  const bg = active ? (danger ? "#991b1b" : "#111827") : "white";
  const color = active ? "white" : border;

  return {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: bg,
    color,
    fontWeight: 900,
    cursor: "pointer",
  };
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: active ? "#111827" : "white",
    color: active ? "white" : "#111827",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
  };
}

function th(): React.CSSProperties {
  return { textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" };
}

function td(): React.CSSProperties {
  return { padding: 8, borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", opacity: 0.9 };
}