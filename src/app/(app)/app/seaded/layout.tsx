import { SettingsNav } from "@/components/settings/settings-nav";

export default function SeadedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Seaded
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)] sm:text-base">
          Ettevõtte andmed, profiil, meeskond ja tellimus.
        </p>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
