"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app/seaded/ettevote", label: "Ettevõte" },
  { href: "/app/seaded/profiil", label: "Minu profiil" },
  { href: "/app/seaded/meeskond", label: "Meeskond" },
  { href: "/app/seaded/tellimus", label: "Tellimus" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Seaded">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-semibold transition",
              active
                ? "bg-[var(--brand)] text-white"
                : "bg-white text-[var(--ink-muted)] ring-1 ring-[var(--border)] hover:text-[var(--ink)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
