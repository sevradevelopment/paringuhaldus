import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { getClientDetail } from "@/lib/clients/queries";

export const metadata: Metadata = {
  title: "Muuda klienti – Päringuhaldus.ee",
};

export const instant = false;

type Params = Promise<{ id: string }>;

export default async function MuudaKlientPage({
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/app/kliendid/${client.id}`}
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← Tagasi kliendi juurde
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Muuda klienti
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{client.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-[var(--ink)]">
            Kliendi andmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            mode="edit"
            clientId={client.id}
            defaultValues={{
              name: client.name,
              companyName: client.companyName ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              registryCode: client.registryCode ?? "",
              notes: client.notes ?? "",
              confirmDuplicate: false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
