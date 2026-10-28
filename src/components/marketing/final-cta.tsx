import { ButtonLink } from "@/components/ui/button-link";

export function FinalCta() {
  return (
    <section
      id="alusta"
      className="scroll-mt-20 border-t border-[var(--border)]/80 bg-[var(--surface)]"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--brand)]/20 bg-[linear-gradient(135deg,rgba(15,118,110,0.12)_0%,rgba(247,248,246,0.95)_45%,rgba(238,241,238,1)_100%)] px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14 lg:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(15,23,42,0.06),transparent_35%)]"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="final-cta-heading"
              className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl"
            >
              Muuda päringute haldamine lihtsamaks
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
              Kogu kliendipäringud, pakkumised ja järeltegevused ühte selgesse
              töökeskkonda — et ükski oluline kontakt ei jääks vastamata.
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/register" variant="primary" size="lg">
                Alusta kohe
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-[var(--ink-muted)]">
              Registreerimine avatakse peagi. Nupp viib registreerimislehele.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
