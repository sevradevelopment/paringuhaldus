import { Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatEtDate } from "@/lib/dashboard/labels";
import type { RecentInquiryRow } from "@/lib/dashboard/queries";

export function RecentInquiries({ rows }: { rows: RecentInquiryRow[] }) {
  return (
    <Card>
      <CardHeader className="border-b border-[var(--border)]/70 pb-4">
        <CardTitle className="text-base font-extrabold text-[var(--ink)]">
          Viimased päringud
        </CardTitle>
        <p className="text-sm text-[var(--ink-muted)]">
          Viimati lisatud päringud sinu organisatsioonis
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Inbox}
              title="Päringuid pole veel"
              description="Kui lisad esimese päringu, ilmub see siia koos kliendi, kuupäeva ja staatusega."
              className="border-0 bg-transparent py-10 shadow-none"
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)]/40 text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Pealkiri</th>
                    <th className="px-5 py-3 font-semibold">Klient</th>
                    <th className="px-5 py-3 font-semibold">Kuupäev</th>
                    <th className="px-5 py-3 font-semibold">Staatus</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border)]/60 last:border-0"
                    >
                      <td className="px-5 py-3.5 font-medium text-[var(--ink)]">
                        {row.title}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--ink-muted)]">
                        {row.clientName ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-[var(--ink-muted)]">
                        {formatEtDate(row.createdAt)}
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
                <li key={row.id} className="space-y-2 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[var(--ink)]">{row.title}</p>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--ink-muted)]">
                    <span>{row.clientName ?? "Klient määramata"}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {formatEtDate(row.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
