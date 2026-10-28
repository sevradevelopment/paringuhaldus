import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privaatsuspoliitika – Päringuhaldus.ee",
  description: "Päringuhaldus.ee privaatsuspoliitika (ettevalmistamisel).",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <p className="text-sm font-medium text-[var(--brand)]">Juriidiline</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
        Privaatsuspoliitika
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)]">
        Privaatsuspoliitika täistekst on ettevalmistamisel ja avaldatakse enne
        teenuse registreerimise avamist. Praegu ei koguta selle lehe kaudu
        isikuandmeid peale tavapärase veebimajutuse tehnilise logimise.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
      >
        Tagasi avalehele
      </Link>
    </section>
  );
}
