import type { Metadata } from "next";
import { BillingPanel } from "@/components/settings/billing-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { getOrganizationSettings } from "@/lib/settings/queries";
import { isStripeConfigured } from "@/lib/stripe/client";

export const metadata: Metadata = {
  title: "Tellimus – Seaded – Päringuhaldus.ee",
};

export const instant = false;

type SearchParams = Promise<{ checkout?: string }>;

export default async function TellimusSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireOrgSession();
  const params = await searchParams;
  const org = await getOrganizationSettings(session.organizationId);
  if (!org) return null;

  const notice =
    params.checkout === "success"
      ? "Checkout õnnestus. Staatus uueneb pärast Stripe webhooki."
      : params.checkout === "cancel"
        ? "Checkout tühistati."
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-extrabold">Tellimus</CardTitle>
      </CardHeader>
      <CardContent>
        <BillingPanel
          plan={org.plan}
          subscriptionStatus={org.subscriptionStatus}
          billingInterval={org.billingInterval}
          currentPeriodEnd={org.currentPeriodEnd}
          stripeConfigured={isStripeConfigured()}
          checkoutNotice={notice}
        />
      </CardContent>
    </Card>
  );
}
