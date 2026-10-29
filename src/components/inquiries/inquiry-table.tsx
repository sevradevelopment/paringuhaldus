import Link from "next/link";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { PriorityBadge } from "@/components/dashboard/priority-badge";
import { formatEtDate } from "@/lib/inquiries/labels";
import type { InquiryListItem } from "@/lib/inquiries/queries";

export function InquiryTable({ rows }: { rows: InquiryListItem[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Päringuid ei leitud"
        description="Muuda filtreid või loo esimene päring, et töövoog käima saada."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)]/40 text-[var(--ink-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Pealkiri</th>
                <th className="px-5 py-3 font-semibold">Klient</th>
                <th className="px-5 py-3 font-semibold">Kuupäev</th>
                <th className="px-5 py-3 font-semibold">Prioriteet</th>
                <th className="px-5 py-3 font-semibold">Staatus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-muted)]/30"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/app/paringud/${row.id}`}
                      className="font-semibold text-[var(--ink)] hover:text-[var(--brand)]"
                    >
                      {row.title}
                      {row.archivedAt ? (
                        <span className="ml-2 text-xs font-medium text-[var(--ink-muted)]">
                          (arhiiv)
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ink-muted)]">
                    {row.clientName ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-[var(--ink-muted)]">
                    {formatEtDate(row.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <PriorityBadge priority={row.priority} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-[var(--border)]/70 md:hidden">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/app/paringud/${row.id}`}
                className="block space-y-2 px-4 py-4 hover:bg-[var(--surface-muted)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--ink)]">{row.title}</p>
                  <StatusBadge status={row.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ink-muted)]">
                  <span>{row.clientName ?? "Klient määramata"}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">
                    {formatEtDate(row.createdAt)}
                  </span>
                  <PriorityBadge priority={row.priority} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
