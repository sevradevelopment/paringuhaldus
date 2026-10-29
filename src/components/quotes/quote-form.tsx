"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import { TextAreaField } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import {
  createQuoteAction,
  updateQuoteAction,
} from "@/lib/actions/quotes";
import { quoteStatusLabel, QUOTE_STATUSES } from "@/lib/quotes/labels";
import { computeQuoteTotals, formatMoney } from "@/lib/quotes/money";
import {
  quoteFormSchema,
  type QuoteFormInput,
} from "@/lib/validations/quote";

type Option = { id: string; name: string; email?: string | null };

type QuoteFormProps = {
  mode: "create" | "edit";
  quoteId?: string;
  clients: Option[];
  inquiries: Option[];
  defaultValues?: Partial<QuoteFormInput>;
  lockedAccepted?: boolean;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function QuoteForm({
  mode,
  quoteId,
  clients,
  inquiries,
  defaultValues,
  lockedAccepted,
}: QuoteFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<QuoteFormInput>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      inquiryId: "",
      status: "PENDING",
      issueDate: todayIso(),
      validUntil: "",
      lineItems: [
        { name: "", quantity: "1", unitPrice: "0", vatRate: "22" },
      ],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedLines = watch("lineItems");
  const totals = useMemo(() => {
    try {
      return computeQuoteTotals(
        (watchedLines ?? []).map((line) => ({
          name: line.name || "—",
          quantity: String(line.quantity || "0").replace(",", "."),
          unitPrice: String(line.unitPrice || "0").replace(",", "."),
          vatRate: String(line.vatRate || "0").replace(",", "."),
        })),
      );
    } catch {
      return null;
    }
  }, [watchedLines]);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createQuoteAction(values)
          : await updateQuoteAction(quoteId!, values);
      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof QuoteFormInput, { message: messages[0] });
            }
          }
        }
        return;
      }
      router.push(
        result.quoteId
          ? `/app/hinnapakkumised/${result.quoteId}`
          : "/app/hinnapakkumised",
      );
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {lockedAccepted ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          See pakkumine on kinnitatud. Salvestamisel luuakse uus versioon;
          algne jääb ajalukku.
        </p>
      ) : null}

      <TextField
        label="Pealkiri"
        error={errors.title?.message}
        {...register("title")}
      />
      <TextAreaField
        label="Kirjeldus"
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Klient"
          error={errors.clientId?.message}
          options={[
            { value: "", label: "Klient määramata" },
            ...clients.map((c) => ({
              value: c.id,
              label: c.email ? `${c.name} (${c.email})` : c.name,
            })),
          ]}
          {...register("clientId")}
        />
        <SelectField
          label="Seotud päring"
          error={errors.inquiryId?.message}
          options={[
            { value: "", label: "Päringut pole" },
            ...inquiries.map((i) => ({ value: i.id, label: i.name })),
          ]}
          {...register("inquiryId")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Staatus"
          error={errors.status?.message}
          options={QUOTE_STATUSES.map((s) => ({
            value: s,
            label: quoteStatusLabel[s],
          }))}
          {...register("status")}
        />
        <TextField
          label="Kuupäev"
          type="date"
          error={errors.issueDate?.message}
          {...register("issueDate")}
        />
        <TextField
          label="Kehtib kuni"
          type="date"
          error={errors.validUntil?.message}
          {...register("validUntil")}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Read</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              append({
                name: "",
                quantity: "1",
                unitPrice: "0",
                vatRate: "22",
              })
            }
          >
            <Plus className="size-4" aria-hidden />
            Lisa rida
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-xl border border-[var(--border)] p-3 sm:grid-cols-[1.4fr_0.7fr_0.9fr_0.7fr_auto]"
          >
            <TextField
              label="Nimetus"
              error={errors.lineItems?.[index]?.name?.message}
              {...register(`lineItems.${index}.name`)}
            />
            <TextField
              label="Kogus"
              error={errors.lineItems?.[index]?.quantity?.message}
              {...register(`lineItems.${index}.quantity`)}
            />
            <TextField
              label="Ühikuhind"
              error={errors.lineItems?.[index]?.unitPrice?.message}
              {...register(`lineItems.${index}.unitPrice`)}
            />
            <TextField
              label="KM %"
              error={errors.lineItems?.[index]?.vatRate?.message}
              {...register(`lineItems.${index}.vatRate`)}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
                aria-label="Kustuta rida"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {errors.lineItems?.root?.message || errors.lineItems?.message ? (
          <p className="text-sm text-red-600">
            {errors.lineItems?.root?.message || errors.lineItems?.message}
          </p>
        ) : null}
      </div>

      {totals ? (
        <div className="rounded-xl bg-[var(--surface-muted)]/70 px-4 py-3 text-sm text-[var(--ink)]">
          <p>Vahesumma: {formatMoney(totals.subtotal)}</p>
          <p>KM: {formatMoney(totals.vatTotal)}</p>
          <p className="font-semibold">Kokku: {formatMoney(totals.total)}</p>
        </div>
      ) : null}

      {formError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvestan…"
            : lockedAccepted
              ? "Loo uus versioon"
              : mode === "create"
                ? "Loo hinnapakkumine"
                : "Salvesta"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Tühista
        </Button>
      </div>
    </form>
  );
}
