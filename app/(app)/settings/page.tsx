// app/(app)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { settingsGet, settingsSet, settingsInitDefaults } from "@/lib/db/settingsRepo";
import { txClearAll } from "@/lib/db/transactionsRepo";
import { subClearAll } from "@/lib/db/subscriptionsRepo";

export default function SettingsPage() {
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [days, setDays] = useState(3);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);

  useEffect(() => {
    (async () => {
      setBusy(true);
      setMsg("");
      await settingsInitDefaults();

      const c = await settingsGet("currency");
      const d = await settingsGet("reminderDaysBefore");
      const p = await settingsGet("remindViaPush");
      const e = await settingsGet("remindViaEmail");

      setCurrency(c?.value ?? "PHP");
      setDays(d?.value ?? 3);
      setPush(p?.value ?? true);
      setEmail(e?.value ?? false);
      setBusy(false);
    })();
  }, []);

  async function save() {
    setMsg("");
    setBusy(true);
    await settingsSet({ key: "currency", value: currency });
    await settingsSet({ key: "reminderDaysBefore", value: days });
    await settingsSet({ key: "remindViaPush", value: push });
    await settingsSet({ key: "remindViaEmail", value: email });
    setBusy(false);
    setMsg("Saved.");
    setTimeout(() => setMsg(""), 1200);
  }

  async function resetAllData() {
    const ok = confirm("Delete all imported data on this device?");
    if (!ok) return;

    setBusy(true);
    await txClearAll();
    await subClearAll();
    setBusy(false);
    setMsg("All local data cleared.");
    setTimeout(() => setMsg(""), 1500);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Settings</h1>

      {busy && (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          Loading…
        </div>
      )}

      {!busy && (
        <>
          <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
            <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Currency</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="PHP"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", width: 120 }}
            />

            <div style={{ height: 12 }} />

            <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Reminder days before</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(0, Math.min(30, Number(e.target.value))))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", width: 120 }}
            />

            <div style={{ height: 12 }} />

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
              <span style={{ fontWeight: 700 }}>Enable push reminders (later)</span>
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
              <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
              <span style={{ fontWeight: 700 }}>Enable email reminders (later)</span>
            </label>

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={save}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              {msg && <span style={{ fontSize: 12, opacity: 0.75 }}>{msg}</span>}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 16, border: "1px solid #fee2e2", borderRadius: 12 }}>
            <div style={{ fontWeight: 900, color: "#991b1b" }}>Danger zone</div>
            <p style={{ marginTop: 8, opacity: 0.85 }}>
              Clears everything stored on this device (transactions + detected subscriptions).
            </p>
            <button
              onClick={resetAllData}
              style={{
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #991b1b",
                background: "white",
                color: "#991b1b",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Reset local data
            </button>
          </div>
        </>
      )}
    </main>
  );
}