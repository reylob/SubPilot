// components/app/StatCard.tsx
export function StatCard(props: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>{props.label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{props.value}</div>
    </div>
  );
}