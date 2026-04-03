// app/(app)/import/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseCsvFile, inferMapping } from "@/lib/csv/parseCsv";
import { settingsInitDefaults } from "@/lib/db/settingsRepo";
import { txClearAll, txPutMany } from "@/lib/db/transactionsRepo";
import type { TransactionRecord, TxDirection } from "@/lib/db/idb";

import { CsvDropzone } from "@/components/import/CsvDropzone";
import { ColumnMapper, type ColumnMapping } from "@/components/import/ColumnMapper";
import { ImportPreviewTable } from "@/components/import/ImportPreviewTable";

function uuid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function toIsoDate(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "1970-01-01";

  const t = Date.parse(raw);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);

  const m = raw.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})$/);
  if (!m) return "1970-01-01";

  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  const c = parseInt(m[3], 10);

  if (m[1].length === 4) {
    const yyyy = a;
    const mm = b;
    const dd = c;
    return new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().slice(0, 10);
  }

  const yyyy = m[3].length === 4 ? c : a;
  let mm = a;
  let dd = b;

  if (mm > 12 && dd <= 12) {
    const tmp = mm;
    mm = dd;
    dd = tmp;
  }

  return new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().slice(0, 10);
}

function parseAmount(input: string): number {
  const raw = (input || "").trim();
  if (!raw) return 0;

  const isParenNeg = raw.startsWith("(") && raw.endsWith(")");
  const cleaned = raw.replace(/[(),]/g, "").replace(/[₱$€£]/g, "").replace(/\s+/g, "");

  const n = Number.parseFloat(cleaned);
  if (Number.isNaN(n)) return 0;
  return isParenNeg ? -n : n;
}

function canonicalizeMerchant(input: string): string {
  const s = (input || "")
    .toUpperCase()
    .replace(/[\d]/g, " ")
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\b(POS|DEBIT|CREDIT|PAYMENT|PURCHASE|ONLINE|TRANSFER|BANK|ATM|BILL)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (s.slice(0, 40) || "UNKNOWN").trim();
}

export default function ImportPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateKey: "",
    descriptionKey: "",
    amountKey: "",
    merchantKey: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const canImport =
    !!file && !!mapping.dateKey && !!mapping.descriptionKey && !!mapping.amountKey && rows.length > 0;

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);

  async function onPickFile(f: File | null) {
    setError("");
    setFile(f);
    setHeaders([]);
    setRows([]);
    setMapping({ dateKey: "", descriptionKey: "", amountKey: "", merchantKey: "" });

    if (!f) return;

    try {
      setBusy(true);
      const parsed = await parseCsvFile(f);
      setHeaders(parsed.headers);
      setRows(parsed.rows);

      const guess = inferMapping(parsed.headers);
      setMapping({
        dateKey: guess.dateKey,
        descriptionKey: guess.descriptionKey,
        amountKey: guess.amountKey,
        merchantKey: guess.merchantKey,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to parse CSV";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    if (!canImport) return;
    setError("");

    try {
      setBusy(true);
      await settingsInitDefaults();

      const txs: TransactionRecord[] = rows
        .map((r: Record<string, string>): TransactionRecord => {
          const postedAt = toIsoDate(r[mapping.dateKey] ?? "");
          const descriptionRaw = r[mapping.descriptionKey] ?? "";
          const amount = parseAmount(r[mapping.amountKey] ?? "");

          const merchantRaw = mapping.merchantKey ? r[mapping.merchantKey] ?? "" : "";
          const merchantCanonical = canonicalizeMerchant(merchantRaw || descriptionRaw);

          const direction: TxDirection = amount < 0 ? "debit" : "credit";

          return {
            id: uuid(),
            postedAt,
            descriptionRaw,
            merchantRaw,
            merchantCanonical,
            amount,
            currency: "PHP",
            direction,
            createdAt: new Date().toISOString(),
          };
        })
        .filter((t: TransactionRecord) => t.postedAt !== "1970-01-01" && t.descriptionRaw.trim().length > 0);

      await txClearAll();
      await txPutMany(txs);

      router.push("/subscriptions");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Import failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Import statement (CSV)</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Upload a CSV export from your bank/e-wallet. Map the columns, then we’ll detect recurring charges.
      </p>

      <CsvDropzone file={file} disabled={busy} onPickFile={onPickFile} />

      {headers.length > 0 && (
        <>
          <ColumnMapper headers={headers} mapping={mapping} onChange={setMapping} disabled={busy} />

          <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={onImport}
              disabled={!canImport || busy}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111827",
                background: canImport && !busy ? "#111827" : "#9ca3af",
                color: "white",
                cursor: canImport && !busy ? "pointer" : "not-allowed",
                fontWeight: 900,
              }}
            >
              {busy ? "Working..." : "Import & Continue"}
            </button>

            <span style={{ fontSize: 12, opacity: 0.75 }}>
              Rows detected: <b>{rows.length}</b>
            </span>
          </div>

          <ImportPreviewTable headers={headers} rows={previewRows} />
        </>
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
    </main>
  );
}