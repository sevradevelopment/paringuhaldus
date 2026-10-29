import type { Metadata } from "next";
import { CompanyForm } from "@/components/settings/company-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { getOrganizationSettings } from "@/lib/settings/queries";

export const metadata: Metadata = {
  title: "Ettevõte – Seaded – Päringuhaldus.ee",
};

export const instant = false;

export default async function EttevoteSettingsPage() {
  const session = await requireOrgSession();
  const org = await getOrganizationSettings(session.organizationId);
  if (!org) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-extrabold">
          Ettevõtte profiil / kirjaplank
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CompanyForm
          logoUrl={org.logoUrl}
          defaults={{
            name: org.name,
            registryCode: org.registryCode ?? "",
            vatNumber: org.vatNumber ?? "",
            address: org.address ?? "",
            email: org.email ?? "",
            phone: org.phone ?? "",
          }}
        />
      </CardContent>
    </Card>
  );
}
