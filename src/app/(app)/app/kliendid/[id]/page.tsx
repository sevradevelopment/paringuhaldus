import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { ClientActivityList } from "@/components/clients/client-activity";
import { ClientArchiveButton } from "@/components/clients/client-archive-button";
import { PriorityBadge } from "@/components/dashboard/priority-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { formatEtDate, formatEtDateTime } from "@/lib/clients/labels";
import { getClientDetail } from "@/lib/clients/queries";

export const instant = false;

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Klient ${id.slice(0, 8)} – Päringuhaldus.ee` };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await requireOrgSession();
  const { id } = await params;
  const client = await getClientDetail(session.organizationId, id);
  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/app/kliendid"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            ← Tagasi klientide juurde
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {client.archivedAt ? (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200">
                Arhiveeritud
              </span>
            ) : (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                Aktiivne
              </span>
            )}
            <span className="text-xs font-medium text-[var(--ink-muted)]">
              {client._count.inquiries} seotud päringut
            </span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            {client.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {client.companyName ? `${client.companyName} · ` : null}
            Lisatud {formatEtDateTime(client.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!client.archivedAt ? (
            <Link
              href={`/app/paringud/uus?clientId=${client.id}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]"
            >
              <Plus className="size-4" aria-hidden />
              Uus päring
            </Link>
          ) : null}
          <Link
            href={`/app/kliendid/${client.id}/muuda`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm font-semibold text-[var(--ink)] hover:border-[var(--border-strong)]"
          >
            <Pencil className="size-4" aria-hidden />
            Muuda
          </Link>
          <ClientArchiveButton
            clientId={client.id}
            archived={!!client.archivedAt}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Kontaktandmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-[var(--ink-muted)]">Nimi</dt>
                  <dd className="mt-0.5 font-medium text-[var(--ink)]">
                    {client.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--ink-muted)]">Ettevõte</dt>
                  <dd className="mt-0.5 text-[var(--ink)]">
                    {client.companyName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--ink-muted)]">E-post</dt>
                  <dd className="mt-0.5 text-[var(--ink)]">
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:text-[var(--brand)]"
                      >
                        {client.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--ink-muted)]">Telefon</dt>
                  <dd className="mt-0.5 text-[var(--ink)]">
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="hover:text-[var(--brand)]"
                      >
                        {client.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--ink-muted)]">Registrikood</dt>
                  <dd className="mt-0.5 text-[var(--ink)]">
                    {client.registryCode ?? "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Märkmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.notes?.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                  {client.notes}
                </p>
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">
                  Märkmeid pole lisatud.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Seotud päringud
              </CardTitle>
              {!client.archivedAt ? (
                <Link
                  href={`/app/paringud/uus?clientId=${client.id}`}
                  className="text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  Uus päring
                </Link>
              ) : null}
            </CardHeader>
            <CardContent>
              {client.inquiries.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">
                  Sellel kliendil pole veel päringuid.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]/70">
                  {client.inquiries.map((inquiry) => (
                    <li key={inquiry.id}>
                      <Link
                        href={`/app/paringud/${inquiry.id}`}
                        className="flex flex-col gap-2 py-3 hover:bg-[var(--surface-muted)]/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--ink)]">
                            {inquiry.title}
                            {inquiry.archivedAt ? (
                              <span className="ml-2 text-xs font-medium text-[var(--ink-muted)]">
                                (arhiiv)
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-[var(--ink-muted)]">
                            {formatEtDate(inquiry.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={inquiry.priority} />
                          <StatusBadge status={inquiry.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Tegevusajalugu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientActivityList items={client.activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
