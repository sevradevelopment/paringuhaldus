import { ButtonLink } from "@/components/ui/button-link";

export function Hero() {
  return (
    <section className="relative flex flex-1 flex-col justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(15,118,110,0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_20%,rgba(15,23,42,0.06),transparent_50%),linear-gradient(180deg,var(--surface)_0%,var(--surface-muted)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28">
        <p className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
          Päringuhaldus
          <span className="text-[var(--brand)]">.ee</span>
        </p>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--ink)] sm:text-5xl md:text-6xl">
          Kõik kliendipäringud ühes kohas.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          Lihtne päringuhaldus Eesti ettevõtetele — hoia kliendipäringud,
          pakkumised ja järeltegevused korras ühes turvalises töökeskkonnas.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/register" variant="primary" size="lg">
            Alusta tasuta
          </ButtonLink>
          <ButtonLink href="#voimalused" variant="secondary" size="lg">
            Tutvu võimalustega
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
