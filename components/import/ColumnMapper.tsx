// components/import/ColumnMapper.tsx
"use client";

export type ColumnMapping = {
  dateKey: string;
  descriptionKey: string;
  amountKey: string;
  merchantKey: string; // optional
};

function FieldSelect(props: {
  label: string;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>{props.label}</div>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
      >
        {props.allowEmpty ? <option value="">(none)</option> : <option value="">Select…</option>}
        {props.headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ColumnMapper(props: {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (next: ColumnMapping) => void;
  disabled?: boolean;
}) {
  const { mapping } = props;

  return (
    <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>Column mapping</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, opacity: props.disabled ? 0.7 : 1 }}>
        <FieldSelect
          label="Date column"
          headers={props.headers}
          value={mapping.dateKey}
          onChange={(v) => props.onChange({ ...mapping, dateKey: v })}
        />
        <FieldSelect
          label="Amount column"
          headers={props.headers}
          value={mapping.amountKey}
          onChange={(v) => props.onChange({ ...mapping, amountKey: v })}
        />
        <FieldSelect
          label="Description column"
          headers={props.headers}
          value={mapping.descriptionKey}
          onChange={(v) => props.onChange({ ...mapping, descriptionKey: v })}
        />
        <FieldSelect
          label="Merchant column (optional)"
          headers={props.headers}
          value={mapping.merchantKey}
          allowEmpty
          onChange={(v) => props.onChange({ ...mapping, merchantKey: v })}
        />
      </div>
    </div>
  );
}