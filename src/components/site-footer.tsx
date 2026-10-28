import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { CopyrightYear } from "@/components/copyright-year";

const navLinks = [
  { href: "#voimalused", label: "Võimalused" },
  { href: "#kuidas", label: "Kuidas töötab" },
  { href: "#hinnad", label: "Hinnad" },
  { href: "/login", label: "Logi sisse" },
  { href: "/register", label: "Alusta tasuta" },
] as const;

const legalLinks = [
  { href: "/tingimused", label: "Kasutustingimused" },
  { href: "/privaatsus", label: "Privaatsuspoliitika" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)]/80 bg-[var(--surface-muted)]/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-2">
            <SiteLogo />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
              Päringuhaldus.ee aitab Eesti ettevõtetel hoida kliendipäringud,
              pakkumised ja järeltegevused ühes turvalises töökeskkonnas.
            </p>
          </div>

          <div>
            <p className="font-display text-sm font-bold tracking-tight text-[var(--ink)]">
              Navigeerimine
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-bold tracking-tight text-[var(--ink)]">
              Kontakt ja juriidiline
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              Avalikud kontaktandmed lisatakse peagi. Seni kasuta
              registreerimise või sisselogimise lehti, kui need on avatud.
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--border)]/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ink-muted)]">
            © <CopyrightYear /> Päringuhaldus.ee. Kõik õigused kaitstud.
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Juriidilised dokumendid on ettevalmistamisel.
          </p>
        </div>
      </div>
    </footer>
  );
}

