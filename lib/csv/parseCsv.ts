// lib/csv/parseCsv.ts
import Papa, { type ParseResult } from "papaparse";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  const text = await file.text();

  return new Promise<ParsedCsv>((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h: string) => (h ?? "").trim(),
      complete: (results: ParseResult<Record<string, string>>) => {
        if (results.errors.length) {
          reject(new Error(results.errors[0]?.message || "CSV parse error"));
          return;
        }

        const rows: Record<string, string>[] = (results.data || [])
          .filter((r: Record<string, string> | null | undefined) => !!r)
          .map((r: Record<string, string>) => {
            const out: Record<string, string> = {};
            for (const [k, v] of Object.entries(r)) {
              out[String(k).trim()] = String(v ?? "").trim();
            }
            return out;
          });

        const headers: string[] =
          results.meta.fields?.map((f: string) => (f ?? "").trim()).filter(Boolean) ??
          (rows[0] ? Object.keys(rows[0]) : []);

        resolve({ headers, rows });
      },
    });
  });
}

export function inferMapping(headers: string[]) {
  const h = headers.map((x) => x.toLowerCase());

  const find = (candidates: string[]) => {
    for (const c of candidates) {
      const idx = h.findIndex((x) => x === c || x.includes(c));
      if (idx >= 0) return headers[idx] ?? "";
    }
    return "";
  };

  return {
    dateKey: find(["date", "posted", "transaction date", "booking date"]),
    descriptionKey: find(["description", "details", "narration", "memo", "reference"]),
    amountKey: find(["amount", "debit", "credit", "value"]),
    merchantKey: find(["merchant", "payee"]),
  };
}