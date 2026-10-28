"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 border-b border-[var(--border)]/80 bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
        <SiteLogo />

        <nav
          className="hidden items-center gap-2 sm:flex"
          aria-label="Põhinavigatsioon"
        >
          <ButtonLink href="/login" variant="ghost" size="sm">
            Logi sisse
          </ButtonLink>
          <ButtonLink href="/register" variant="primary" size="sm">
            Alusta tasuta
          </ButtonLink>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ink)] hover:bg-[var(--surface-muted)] sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Sulge menüü" : "Ava menüü"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-[var(--border)] bg-[var(--surface)] sm:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4"
          aria-label="Mobiilimenüü"
        >
          <Link
            href="/login"
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            onClick={() => setOpen(false)}
          >
            Logi sisse
          </Link>
          <ButtonLink
            href="/register"
            variant="primary"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Alusta tasuta
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
