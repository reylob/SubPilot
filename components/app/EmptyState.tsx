// components/app/EmptyState.tsx
import Link from "next/link";

export function EmptyState(props: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div style={{ marginTop: 16, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12 }}>
      <div style={{ fontWeight: 900 }}>{props.title}</div>
      {props.description && <p style={{ marginTop: 8, opacity: 0.8 }}>{props.description}</p>}

      {props.actionHref && props.actionLabel && (
        <div style={{ marginTop: 10 }}>
          <Link href={props.actionHref} style={{ fontWeight: 800 }}>
            {props.actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}