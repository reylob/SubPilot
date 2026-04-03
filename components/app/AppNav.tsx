// components/app/AppNav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const pathname = usePathname();

  const items = [
    { href: "/import", label: "Import" },
    { href: "/subscriptions", label: "Subscriptions" },
    { href: "/upcoming", label: "Upcoming" },
    { href: "/settings", label: "Settings" },
  ] as const;

  return (
    <nav style={{ display: "flex", gap: 12, fontSize: 13 }}>
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            style={{
              textDecoration: "none",
              color: "inherit",
              fontWeight: active ? 900 : 600,
              opacity: active ? 1 : 0.85,
            }}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}