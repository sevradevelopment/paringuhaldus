import { ClipboardList, FilePenLine, UserPlus } from "lucide-react";
import { ProcessStep } from "@/components/marketing/process-step";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Loo konto",
    description:
      "Registreeri oma ettevõte ja seadista töökeskkond.",
  },
  {
    step: 2,
    icon: ClipboardList,
    title: "Halda päringuid",
    description:
      "Kogu ja organiseeri klientide päringud ühte keskkonda.",
  },
  {
    step: 3,
    icon: FilePenLine,
    title: "Koosta pakkumisi",
    description:
      "Vasta päringutele, koosta hinnapakkumisi ja jälgi nende staatuseid.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="kuidas"
      className="scroll-mt-20 border-t border-[var(--border)]/80 bg-[var(--surface)]"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-it-works-heading"
            className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl"
          >
            Kuidas see töötab?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            Kolm lihtsat sammu, et alustada päringute haldamist ilma keeruka
            seadistuseta.
          </p>
        </div>

        <ol className="relative mt-10 grid list-none gap-4 p-0 sm:mt-12 sm:gap-5 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[calc(16.666%+0.5rem)] right-[calc(16.666%+0.5rem)] top-10 hidden h-px bg-[linear-gradient(90deg,transparent,var(--border-strong)_12%,var(--border-strong)_88%,transparent)] md:block"
          />

          {steps.map((item) => (
            <li key={item.step} className="relative">
              <ProcessStep
                step={item.step}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
