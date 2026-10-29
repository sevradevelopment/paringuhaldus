import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { QuoteActionButtons } from "@/components/quotes/quote-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { formatEtDate, formatEtDateTime } from "@/lib/quotes/labels";
import { formatMoney } from "@/lib/quotes/money";
import { getQuoteDetail } from "@/lib/quotes/queries";
import { QuoteStatusBadge } from "@/lib/quotes/status-badge";

export const instant = false;

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pakkumine ${id.slice(0, 8)} – Päringuhaldus.ee` };
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await requireOrgSession();
  const { id } = await params;
  const quote = await getQuoteDetail(session.organizationId, id);
  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/app/hinnapakkumised"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            ← Tagasi hinnapakkumiste juurde
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <QuoteStatusBadge status={quote.status} />
            {quote.archivedAt ? (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                Arhiveeritud
              </span>
            ) : null}
            <span className="text-xs text-[var(--ink-muted)]">
              v{quote.version}
            </span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">
            {quote.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {quote.number} · {formatEtDate(quote.issueDate)}
            {quote.validUntil
              ? ` · kehtib kuni ${formatEtDate(quote.validUntil)}`
              : ""}
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href={`/app/hinnapakkumised/${quote.id}/muuda`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm font-semibold"
          >
            <Pencil className="size-4" />
            Muuda
          </Link>
          <QuoteActionButtons
            quoteId={quote.id}
            archived={!!quote.archivedAt}
            defaultEmail={quote.client?.email}
            quoteNumber={quote.number}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Klient</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {quote.client ? (
                <div className="space-y-1">
                  <Link
                    href={`/app/kliendid/${quote.client.id}`}
                    className="font-semibold text-[var(--brand)] hover:underline"
                  >
                    {quote.client.name}
                  </Link>
                  {quote.client.email ? <p>{quote.client.email}</p> : null}
                </div>
              ) : (
                <p className="text-[var(--ink-muted)]">Klienti pole seotud.</p>
              )}
              {quote.inquiry ? (
                <p className="mt-3">
                  Päring:{" "}
                  <Link
                    href={`/app/paringud/${quote.inquiry.id}`}
                    className="font-semibold text-[var(--brand)] hover:underline"
                  >
                    {quote.inquiry.title}
                  </Link>
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-[var(--border)]/70 text-sm">
                {quote.lineItems.map((line) => (
                  <li
                    key={line.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[var(--ink)]">{line.name}</p>
                      <p className="text-[var(--ink-muted)]">
                        {line.quantity.toString()} ×{" "}
                        {formatMoney(line.unitPrice.toString())} · KM{" "}
                        {line.vatRate.toString()}%
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {formatMoney(line.lineTotal.toString())}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-[var(--border)] pt-4 text-sm">
                <p>Vahesumma: {formatMoney(quote.subtotal.toString())}</p>
                <p>KM: {formatMoney(quote.vatTotal.toString())}</p>
                <p className="text-base font-bold">
                  Kokku: {formatMoney(quote.total.toString())}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold">
                Saatmise ajalugu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {quote.sendLogs.length === 0 ? (
                <p className="text-[var(--ink-muted)]">Saatmisi pole.</p>
              ) : (
                quote.sendLogs.map((log) => (
                  <div key={log.id}>
                    <p className="font-medium">
                      {log.success ? "Saadetud" : "Ebaõnnestus"} → {log.toEmail}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {formatEtDateTime(log.createdAt)}
                      {log.errorMessage ? ` · ${log.errorMessage}` : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-extrabold">
                Tegevusajalugu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {quote.activities.map((item) => (
                <div key={item.id}>
                  <p className="font-medium">{item.message}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {formatEtDateTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
