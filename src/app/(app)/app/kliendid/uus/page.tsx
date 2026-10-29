import type { Metadata } from "next";
import Link from "next/link";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Uus klient – Päringuhaldus.ee",
};

export const instant = false;

export default async function UusKlientPage() {
  await requireOrgSession();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/app/kliendid"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← Tagasi klientide juurde
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Lisa klient
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Sisesta kontaktandmed, ettevõte ja märkmed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-[var(--ink)]">
            Kliendi andmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
