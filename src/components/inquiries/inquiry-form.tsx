"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import { TextAreaField } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import {
  createInquiryAction,
  updateInquiryAction,
} from "@/lib/actions/inquiries";
import {
  inquiryFormSchema,
  type InquiryFormInput,
} from "@/lib/validations/inquiry";
import {
  inquiryPriorityLabel,
  inquiryStatusLabel,
  INQUIRY_PRIORITIES,
  INQUIRY_STATUSES,
} from "@/lib/inquiries/labels";

type ClientOption = {
  id: string;
  name: string;
  email: string | null;
};

type InquiryFormProps = {
  mode: "create" | "edit";
  inquiryId?: string;
  clients: ClientOption[];
  defaultValues?: Partial<InquiryFormInput>;
  monthlyRemaining?: number;
  monthlyLimit?: number;
};

export function InquiryForm({
  mode,
  inquiryId,
  clients,
  defaultValues,
  monthlyRemaining,
  monthlyLimit,
}: InquiryFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<InquiryFormInput>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "UUS",
      priority: "TAVALINE",
      clientId: "",
      newClientName: "",
      newClientEmail: "",
      newClientPhone: "",
      ...defaultValues,
    },
  });

  const clientId = watch("clientId");

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createInquiryAction(values)
          : await updateInquiryAction(inquiryId!, values);

      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof InquiryFormInput, {
                message: messages[0],
              });
            }
          }
        }
        return;
      }

      router.push(
        result.inquiryId
          ? `/app/paringud/${result.inquiryId}`
          : "/app/paringud",
      );
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {mode === "create" && monthlyLimit != null && monthlyRemaining != null ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 px-4 py-3 text-sm text-[var(--ink-muted)]">
          Sellel kuul jäänud uute päringute limiit:{" "}
          <span className="font-semibold text-[var(--ink)]">
            {monthlyRemaining}/{monthlyLimit}
          </span>
        </p>
      ) : null}

      <TextField
        label="Pealkiri"
        placeholder="Nt. Küttesüsteemi paigaldus"
        error={errors.title?.message}
        {...register("title")}
      />

      <TextAreaField
        label="Kirjeldus"
        placeholder="Lühike kokkuvõte päringust…"
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Staatus"
          error={errors.status?.message}
          options={INQUIRY_STATUSES.map((status) => ({
            value: status,
            label: inquiryStatusLabel[status],
          }))}
          {...register("status")}
        />
        <SelectField
          label="Prioriteet"
          error={errors.priority?.message}
          options={INQUIRY_PRIORITIES.map((priority) => ({
            value: priority,
            label: inquiryPriorityLabel[priority],
          }))}
          {...register("priority")}
        />
      </div>

      <SelectField
        label="Klient"
        error={errors.clientId?.message}
        options={[
          { value: "", label: "Klient määramata" },
          ...clients.map((client) => ({
            value: client.id,
            label: client.email
              ? `${client.name} (${client.email})`
              : client.name,
          })),
          { value: "__new__", label: "+ Lisa uus klient" },
        ]}
        {...register("clientId")}
      />

      {clientId === "__new__" ? (
        <div className="grid gap-4 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/40 p-4 sm:grid-cols-3">
          <TextField
            label="Kliendi nimi"
            error={errors.newClientName?.message}
            {...register("newClientName")}
          />
          <TextField
            label="E-post"
            type="email"
            error={errors.newClientEmail?.message}
            {...register("newClientEmail")}
          />
          <TextField
            label="Telefon"
            error={errors.newClientPhone?.message}
            {...register("newClientPhone")}
          />
        </div>
      ) : null}

      {formError ? (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvestan…"
            : mode === "create"
              ? "Loo päring"
              : "Salvesta muudatused"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => router.back()}
        >
          Tühista
        </Button>
      </div>
    </form>
  );
}
