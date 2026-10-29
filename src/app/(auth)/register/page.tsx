import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Registreerimine – Päringuhaldus.ee",
  description: "Loo ettevõtte konto ja alusta päringute haldamist.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Loo konto"
      subtitle="Registreeri oma ettevõte ja saa juurdepääs töökeskkonnale."
      footer={
        <>
          Sul on juba konto?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
          >
            Logi sisse
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
