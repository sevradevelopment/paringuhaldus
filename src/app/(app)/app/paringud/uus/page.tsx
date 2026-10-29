import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import {
  getMonthlyInquiryUsage,
  listOrgClients,
} from "@/lib/inquiries/queries";

export const metadata: Metadata = {
  title: "Uus päring – Päringuhaldus.ee",
};

export const instant = false;

export default async function UusParingPage() {
  const session = await requireOrgSession();
  const [clients, usage] = await Promise.all([
    listOrgClients(session.organizationId),
    getMonthlyInquiryUsage(session.organizationId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/app/paringud"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← Tagasi päringute juurde
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Uus päring
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Lisa pealkiri, kirjeldus, prioriteet ja soovi korral klient.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-[var(--ink)]">
            Päringu andmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InquiryForm
            mode="create"
            clients={clients}
            monthlyLimit={usage.limit}
            monthlyRemaining={usage.remaining}
          />
        </CardContent>
      </Card>
    </div>
  );
}
