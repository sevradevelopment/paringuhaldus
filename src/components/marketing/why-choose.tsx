import {
  ClipboardList,
  FileSpreadsheet,
  ListChecks,
  Users,
} from "lucide-react";
import { FeatureCard } from "@/components/marketing/feature-card";

const features = [
  {
    icon: ClipboardList,
    title: "Päringute haldamine",
    description:
      "Kogu uued kliendipäringud ühte selgesse vaatesse ning jälgi staatust algusest lõpuni.",
  },
  {
    icon: FileSpreadsheet,
    title: "Hinnapakkumiste koostamine",
    description:
      "Seo pakkumised päringutega, hoia summad ja staatused korras ning väldi unustatud follow-upe.",
  },
  {
    icon: Users,
    title: "Klientide haldamine",
    description:
      "Hoia kontaktid, ettevõtte andmed ja suhtlusajalugu ühes kohas, et meeskond oleks alati kursis.",
  },
  {
    icon: ListChecks,
    title: "Tööde jälgimine",
    description:
      "Planeeri järgmised tegevused, määra vastutajad ja näe, mis vajab täna tähelepanu.",
  },
] as const;

export function WhyChoose() {
  return (
    <section
      id="voimalused"
      className="scroll-mt-20 border-t border-[var(--border)]/80 bg-[var(--surface-muted)]/60"
      aria-labelledby="why-choose-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="why-choose-heading"
            className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl"
          >
            Miks valida Päringuhaldus.ee?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            Neli põhifunktsiooni, mis aitavad Eesti ettevõtetel hoida
            kliendipäringud, pakkumised ja tööd ühes kindlas süsteemis.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
