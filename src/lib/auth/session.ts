import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type OrgSession = {
  userId: string;
  organizationId: string;
  organizationName: string | null;
  name: string | null | undefined;
  email: string | null | undefined;
  role: string | null;
};

export async function requireOrgSession(): Promise<OrgSession> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    redirect("/login");
  }

  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName ?? null,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role ?? null,
  };
}
