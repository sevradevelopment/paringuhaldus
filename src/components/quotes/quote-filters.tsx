"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { quoteStatusLabel, QUOTE_STATUSES } from "@/lib/quotes/labels";

const sorts = [
  { value: "createdAt_desc", label: "Uuemad ees" },
  { value: "createdAt_asc", label: "Vanemad ees" },
  { value: "number_asc", label: "Number A–Z" },
  { value: "number_desc", label: "Number Z–A" },
  { value: "total_desc", label: "Suurim summa" },
];

export function QuoteFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (
      !value ||
      value === "ALL" ||
      (key === "archived" && value === "active") ||
      (key === "sort" && value === "createdAt_desc")
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`/app/hinnapakkumised?${params.toString()}`);
    });
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update("q", String(form.get("q") ?? "").trim());
  }

  return (
    <div
      className={`space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm ${pending ? "opacity-70" : ""}`}
    >
      <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Otsi numbri, pealkirja või kliendi järgi…"
          className="h-11 flex-1 rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--ring)]/25"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]"
        >
          Otsi
        </button>
      </form>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-[var(--ink-muted)]">Staatus</span>
          <select
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
            value={searchParams.get("status") ?? "ALL"}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="ALL">Kõik</option>
            {QUOTE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {quoteStatusLabel[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-[var(--ink-muted)]">Vaade</span>
          <select
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
            value={searchParams.get("archived") ?? "active"}
            onChange={(e) => update("archived", e.target.value)}
          >
            <option value="active">Aktiivsed</option>
            <option value="archived">Arhiveeritud</option>
            <option value="all">Kõik</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-[var(--ink-muted)]">Sorteeri</span>
          <select
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
            value={searchParams.get("sort") ?? "createdAt_desc"}
            onChange={(e) => update("sort", e.target.value)}
          >
            {sorts.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
