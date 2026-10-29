import type { Metadata } from "next";
import { ProfileForms } from "@/components/settings/profile-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Minu profiil – Seaded – Päringuhaldus.ee",
};

export const instant = false;

export default async function ProfiilSettingsPage() {
  const session = await requireOrgSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });
  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-extrabold">Minu profiil</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForms name={user.name ?? ""} email={user.email} />
      </CardContent>
    </Card>
  );
}
