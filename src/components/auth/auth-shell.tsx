import { SiteLogo } from "@/components/site-logo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-full flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(15,118,110,0.14),transparent_55%),linear-gradient(180deg,var(--surface)_0%,var(--surface-muted)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.3] [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 flex justify-center">
          <SiteLogo />
        </div>

        <div className="rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)]/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-[1.65rem]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            {subtitle}
          </p>
          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          {footer}
        </div>
      </div>
    </div>
  );
}
