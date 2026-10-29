import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { QuoteStatusBadge } from "@/lib/quotes/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatEtDate } from "@/lib/quotes/labels";
import { formatMoney } from "@/lib/quotes/money";
import type { QuoteListItem } from "@/lib/quotes/queries";

export function QuoteTable({ rows }: { rows: QuoteListItem[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Hinnapakkumisi ei leitud"
        description="Muuda filtreid või loo esimene hinnapakkumine."
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
                <th className="px-5 py-3 font-semibold">Number</th>
                <th className="px-5 py-3 font-semibold">Pealkiri</th>
                <th className="px-5 py-3 font-semibold">Klient</th>
                <th className="px-5 py-3 font-semibold">Kuupäev</th>
                <th className="px-5 py-3 font-semibold">Summa</th>
                <th className="px-5 py-3 font-semibold">Staatus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-muted)]/30"
                >
                  <td className="px-5 py-3.5 font-medium text-[var(--ink)]">
                    <Link
                      href={`/app/hinnapakkumised/${row.id}`}
                      className="hover:text-[var(--brand)]"
                    >
                      {row.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/app/hinnapakkumised/${row.id}`}
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
                    {formatEtDate(row.issueDate)}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-[var(--ink)]">
                    {formatMoney(row.total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <QuoteStatusBadge status={row.status} />
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
                href={`/app/hinnapakkumised/${row.id}`}
                className="block space-y-2 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--ink)]">{row.title}</p>
                  <QuoteStatusBadge status={row.status} />
                </div>
                <p className="text-sm text-[var(--ink-muted)]">
                  {row.number} · {row.clientName ?? "Klient puudub"} ·{" "}
                  {formatMoney(row.total)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
