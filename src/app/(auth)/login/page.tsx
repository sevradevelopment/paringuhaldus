import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Logi sisse – Päringuhaldus.ee",
  description: "Logi sisse oma Päringuhaldus.ee töökeskkonda.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Logi sisse"
      subtitle="Sisene oma ettevõtte töökeskkonda."
      footer={
        <>
          Pole veel kontot?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
          >
            Registreeru
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
