import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { listOrgClients } from "@/lib/clients/queries";
import { listInquiries } from "@/lib/inquiries/queries";
import { getQuoteDetail } from "@/lib/quotes/queries";

export const metadata: Metadata = {
  title: "Muuda hinnapakkumist – Päringuhaldus.ee",
};

export const instant = false;

type Params = Promise<{ id: string }>;

export default async function MuudaHinnapakkuminePage({
  params,
}: {
  params: Params;
}) {
  const session = await requireOrgSession();
  const { id } = await params;
  const quote = await getQuoteDetail(session.organizationId, id);
  if (!quote) notFound();

  const [clients, inquiries] = await Promise.all([
    listOrgClients(session.organizationId, {
      includeArchivedIds: quote.clientId ? [quote.clientId] : [],
    }),
    listInquiries(session.organizationId, { archived: "all" }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/app/hinnapakkumised/${quote.id}`}
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← Tagasi pakkumise juurde
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">
          Muuda hinnapakkumist
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{quote.number}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold">Andmed</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteForm
            mode="edit"
            quoteId={quote.id}
            clients={clients}
            inquiries={inquiries.map((i) => ({ id: i.id, name: i.title }))}
            lockedAccepted={quote.status === "ACCEPTED"}
            defaultValues={{
              title: quote.title,
              description: quote.description ?? "",
              clientId: quote.clientId ?? "",
              inquiryId: quote.inquiryId ?? "",
              status: quote.status,
              issueDate: quote.issueDate.toISOString().slice(0, 10),
              validUntil: quote.validUntil
                ? quote.validUntil.toISOString().slice(0, 10)
                : "",
              lineItems: quote.lineItems.map((line) => ({
                name: line.name,
                quantity: line.quantity.toString(),
                unitPrice: line.unitPrice.toString(),
                vatRate: line.vatRate.toString(),
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
