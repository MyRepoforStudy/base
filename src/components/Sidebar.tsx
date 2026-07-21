"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/servers", label: "Servers" },
  { href: "/admin", label: "Admin" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 shrink-0 border-r border-black/10 bg-white px-3 py-6">
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-3 py-2 text-sm font-semibold uppercase tracking-wide ${
                active ? "bg-red-600 text-white" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
