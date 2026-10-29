import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import {
  getInquiryDetail,
  listOrgClients,
} from "@/lib/inquiries/queries";

export const metadata: Metadata = {
  title: "Muuda päringut – Päringuhaldus.ee",
};

export const instant = false;

type Params = Promise<{ id: string }>;

export default async function MuudaParingPage({
  params,
}: {
  params: Params;
}) {
  const session = await requireOrgSession();
  const { id } = await params;
  const [inquiry, clients] = await Promise.all([
    getInquiryDetail(session.organizationId, id),
    listOrgClients(session.organizationId),
  ]);

  if (!inquiry) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/app/paringud/${inquiry.id}`}
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← Tagasi päringu juurde
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Muuda päringut
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{inquiry.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-[var(--ink)]">
            Päringu andmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InquiryForm
            mode="edit"
            inquiryId={inquiry.id}
            clients={clients}
            defaultValues={{
              title: inquiry.title,
              description: inquiry.description ?? "",
              status: inquiry.status,
              priority: inquiry.priority,
              clientId: inquiry.clientId ?? "",
              newClientName: "",
              newClientEmail: "",
              newClientPhone: "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
