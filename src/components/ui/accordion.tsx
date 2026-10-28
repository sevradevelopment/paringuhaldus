"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type AccordionContextValue = {
  openItem: string | null;
  toggle: (value: string) => void;
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within Accordion.");
  }
  return context;
}

type AccordionProps = {
  children: ReactNode;
  className?: string;
  defaultValue?: string | null;
};

export function Accordion({
  children,
  className,
  defaultValue = null,
}: AccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(defaultValue);
  const baseId = useId();

  const toggle = useCallback((value: string) => {
    setOpenItem((current) => (current === value ? null : value));
  }, []);

  const value = useMemo(
    () => ({ openItem, toggle, baseId }),
    [openItem, toggle, baseId],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div className={cn("flex flex-col gap-3", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = {
  value: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function AccordionItem({
  value,
  title,
  children,
  className,
}: AccordionItemProps) {
  const { openItem, toggle, baseId } = useAccordionContext();
  const open = openItem === value;
  const triggerId = `${baseId}-trigger-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--border)] bg-white/80 shadow-sm transition-colors duration-200",
        open && "border-[var(--brand)]/35 bg-white",
        className,
      )}
    >
      <h3>
        <button
          id={triggerId}
          type="button"
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-[var(--surface-muted)]/50 sm:px-6 sm:py-5"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => toggle(value)}
        >
          <span className="font-display text-base font-bold tracking-tight text-[var(--ink)] sm:text-lg">
            {title}
          </span>
          <span
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--brand)] transition-all duration-200",
              open && "border-[var(--brand)]/30 bg-[var(--brand)]/10 rotate-180",
            )}
          >
            <ChevronDown className="h-4 w-4" aria-hidden strokeWidth={2} />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)]/80 px-5 pb-5 pt-3 text-sm leading-relaxed text-[var(--ink-muted)] sm:px-6 sm:pb-6 sm:text-[0.9375rem]">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
