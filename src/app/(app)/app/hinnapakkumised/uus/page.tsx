import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { listOrgClients } from "@/lib/clients/queries";
import { listInquiries } from "@/lib/inquiries/queries";

export const metadata: Metadata = {
  title: "Uus hinnapakkumine – Päringuhaldus.ee",
};

export const instant = false;

type SearchParams = Promise<{
  clientId?: string;
  inquiryId?: string;
}>;

export default async function UusHinnapakkuminePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireOrgSession();
  const params = await searchParams;
  const [clients, inquiries] = await Promise.all([
    listOrgClients(session.organizationId),
    listInquiries(session.organizationId, { archived: "active" }),
  ]);

  const clientId = params.clientId?.trim() || "";
  const inquiryId = params.inquiryId?.trim() || "";
  const validClient = clients.some((c) => c.id === clientId) ? clientId : "";
  const validInquiry = inquiries.some((i) => i.id === inquiryId)
    ? inquiryId
    : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/app/hinnapakkumised"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← Tagasi hinnapakkumiste juurde
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Uus hinnapakkumine
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-[var(--ink)]">
            Pakkumise andmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteForm
            mode="create"
            clients={clients}
            inquiries={inquiries.map((i) => ({ id: i.id, name: i.title }))}
            defaultValues={{
              clientId: validClient,
              inquiryId: validInquiry,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
