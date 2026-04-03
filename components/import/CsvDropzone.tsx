// components/import/CsvDropzone.tsx
"use client";

import { useRef } from "react";

export function CsvDropzone(props: {
  file: File | null;
  disabled?: boolean;
  onPickFile: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div>
          <div style={{ fontWeight: 900 }}>CSV file</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Upload a CSV export from your bank/e-wallet.
          </div>
        </div>

        <button
          type="button"
          onClick={openPicker}
          disabled={props.disabled}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111827",
            background: "white",
            fontWeight: 900,
            cursor: props.disabled ? "not-allowed" : "pointer",
            opacity: props.disabled ? 0.6 : 1,
          }}
        >
          Choose file
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => props.onPickFile(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
      />

      {props.file ? (
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          Selected: <b>{props.file.name}</b>
          <button
            type="button"
            onClick={() => props.onPickFile(null)}
            disabled={props.disabled}
            style={{
              marginLeft: 10,
              fontSize: 12,
              border: "none",
              background: "transparent",
              textDecoration: "underline",
              cursor: props.disabled ? "not-allowed" : "pointer",
              opacity: props.disabled ? 0.6 : 1,
            }}
          >
            clear
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 12, opacity: 0.7 }}>No file chosen</div>
      )}
    </div>
  );
}