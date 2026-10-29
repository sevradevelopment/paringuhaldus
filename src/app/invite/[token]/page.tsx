import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteAcceptForm } from "@/components/settings/invite-accept-form";
import { getInvitePreview } from "@/lib/actions/invites";

export const metadata: Metadata = {
  title: "Meeskonnakutse – Päringuhaldus.ee",
};

export const instant = false;

type Params = Promise<{ token: string }>;

export default async function InvitePage({ params }: { params: Params }) {
  const { token } = await params;
  const invite = await getInvitePreview(token);
  if (!invite) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
        Päringuhaldus.ee
      </Link>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-[var(--ink)]">
        Liitu meeskonnaga
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Kutse organisatsiooni <strong>{invite.organization.name}</strong> (
        {invite.email}).
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <InviteAcceptForm token={token} email={invite.email} />
      </div>
    </main>
  );
}
