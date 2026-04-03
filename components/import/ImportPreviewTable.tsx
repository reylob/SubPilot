// components/import/ImportPreviewTable.tsx
"use client";

export function ImportPreviewTable(props: { headers: string[]; rows: Record<string, string>[]; maxCols?: number }) {
  const maxCols = props.maxCols ?? 6;
  const headers = props.headers.slice(0, maxCols);
  const preview = props.rows.slice(0, 10);

  if (!props.headers.length || !props.rows.length) return null;

  return (
    <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>Preview (first 10 rows)</h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: 8,
                    borderBottom: "1px solid #e5e7eb",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((r, idx) => (
              <tr key={idx}>
                {headers.map((h) => (
                  <td
                    key={h}
                    style={{
                      padding: 8,
                      borderBottom: "1px solid #f3f4f6",
                      whiteSpace: "nowrap",
                      opacity: 0.9,
                    }}
                  >
                    {String(r[h] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Tip: if your amounts are split into separate Debit/Credit columns, we’ll adjust the importer.
      </p>
    </div>
  );
}