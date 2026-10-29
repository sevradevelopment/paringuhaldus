import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatEtDate } from "@/lib/clients/labels";
import type { ClientListItem } from "@/lib/clients/queries";

export function ClientTable({ rows }: { rows: ClientListItem[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Kliente ei leitud"
        description="Muuda filtreid või lisa esimene klient, et CRM-i täita."
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
                <th className="px-5 py-3 font-semibold">Nimi</th>
                <th className="px-5 py-3 font-semibold">Ettevõte</th>
                <th className="px-5 py-3 font-semibold">Kontakt</th>
                <th className="px-5 py-3 font-semibold">Päringud</th>
                <th className="px-5 py-3 font-semibold">Lisatud</th>
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
                      href={`/app/kliendid/${row.id}`}
                      className="font-semibold text-[var(--ink)] hover:text-[var(--brand)]"
                    >
                      {row.name}
                      {row.archivedAt ? (
                        <span className="ml-2 text-xs font-medium text-[var(--ink-muted)]">
                          (arhiiv)
                        </span>
                      ) : null}
                    </Link>
                    {row.registryCode ? (
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                        Reg. {row.registryCode}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ink-muted)]">
                    {row.companyName ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ink-muted)]">
                    <div className="space-y-0.5">
                      <p>{row.email ?? "—"}</p>
                      {row.phone ? <p>{row.phone}</p> : null}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-[var(--ink-muted)]">
                    {row.inquiryCount}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-[var(--ink-muted)]">
                    {formatEtDate(row.createdAt)}
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
                href={`/app/kliendid/${row.id}`}
                className="block space-y-2 px-4 py-4 hover:bg-[var(--surface-muted)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--ink)]">{row.name}</p>
                  <span className="tabular-nums text-xs font-medium text-[var(--ink-muted)]">
                    {row.inquiryCount} päringut
                  </span>
                </div>
                <div className="space-y-1 text-sm text-[var(--ink-muted)]">
                  {row.companyName ? <p>{row.companyName}</p> : null}
                  <p>{row.email ?? "E-post puudub"}</p>
                  {row.archivedAt ? (
                    <p className="text-xs font-medium">Arhiveeritud</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
