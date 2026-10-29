import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { InquiryActivityList } from "@/components/inquiries/inquiry-activity";
import { InquiryArchiveButton } from "@/components/inquiries/inquiry-archive-button";
import { InquiryNoteForm } from "@/components/inquiries/inquiry-note-form";
import { InquiryNotesList } from "@/components/inquiries/inquiry-notes-list";
import { InquiryStatusForm } from "@/components/inquiries/inquiry-status-form";
import { PriorityBadge } from "@/components/dashboard/priority-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { formatEtDateTime } from "@/lib/inquiries/labels";
import { getInquiryDetail } from "@/lib/inquiries/queries";

export const instant = false;

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Päring ${id.slice(0, 8)} – Päringuhaldus.ee` };
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await requireOrgSession();
  const { id } = await params;
  const inquiry = await getInquiryDetail(session.organizationId, id);
  if (!inquiry) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/app/paringud"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            ← Tagasi päringute juurde
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={inquiry.status} />
            <PriorityBadge priority={inquiry.priority} />
            {inquiry.archivedAt ? (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200">
                Arhiveeritud
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            {inquiry.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Loodud {formatEtDateTime(inquiry.createdAt)}
            {inquiry.client ? ` · ${inquiry.client.name}` : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/paringud/${inquiry.id}/muuda`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm font-semibold text-[var(--ink)] hover:border-[var(--border-strong)]"
          >
            <Pencil className="size-4" aria-hidden />
            Muuda
          </Link>
          <InquiryArchiveButton
            inquiryId={inquiry.id}
            archived={!!inquiry.archivedAt}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Kirjeldus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inquiry.description?.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                  {inquiry.description}
                </p>
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">
                  Kirjeldust pole lisatud.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Klient
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inquiry.client ? (
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-[var(--ink-muted)]">Nimi</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      <Link
                        href={`/app/kliendid/${inquiry.client.id}`}
                        className="hover:text-[var(--brand)]"
                      >
                        {inquiry.client.name}
                      </Link>
                    </dd>
                  </div>
                  {inquiry.client.companyName ? (
                    <div>
                      <dt className="text-[var(--ink-muted)]">Ettevõte</dt>
                      <dd className="text-[var(--ink)]">
                        {inquiry.client.companyName}
                      </dd>
                    </div>
                  ) : null}
                  {inquiry.client.email ? (
                    <div>
                      <dt className="text-[var(--ink-muted)]">E-post</dt>
                      <dd className="text-[var(--ink)]">{inquiry.client.email}</dd>
                    </div>
                  ) : null}
                  {inquiry.client.phone ? (
                    <div>
                      <dt className="text-[var(--ink-muted)]">Telefon</dt>
                      <dd className="text-[var(--ink)]">{inquiry.client.phone}</dd>
                    </div>
                  ) : null}
                  <div className="pt-1">
                    <Link
                      href={`/app/kliendid/${inquiry.client.id}`}
                      className="text-sm font-semibold text-[var(--brand)] hover:underline"
                    >
                      Ava kliendi profiil →
                    </Link>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">
                  Klienti pole seotud.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Märkmed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <InquiryNoteForm inquiryId={inquiry.id} />
              <InquiryNotesList notes={inquiry.notes} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Staatus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InquiryStatusForm
                inquiryId={inquiry.id}
                status={inquiry.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-[var(--ink)]">
                Tegevusajalugu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InquiryActivityList items={inquiry.activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
