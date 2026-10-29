"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import { TextAreaField } from "@/components/ui/textarea";
import {
  createClientAction,
  updateClientAction,
} from "@/lib/actions/clients";
import {
  clientFormSchema,
  type ClientFormInput,
} from "@/lib/validations/client";

type ClientFormProps = {
  mode: "create" | "edit";
  clientId?: string;
  defaultValues?: Partial<ClientFormInput>;
};

export function ClientForm({
  mode,
  clientId,
  defaultValues,
}: ClientFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    kind: "email" | "company";
    clientId: string;
    clientName: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      registryCode: "",
      notes: "",
      confirmDuplicate: false,
      ...defaultValues,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setDuplicateWarning(null);
    startTransition(async () => {
      const payload = { ...values, confirmDuplicate };
      const result =
        mode === "create"
          ? await createClientAction(payload)
          : await updateClientAction(clientId!, payload);

      if (!result.ok) {
        setFormError(result.error);
        if (result.duplicateWarning) {
          setDuplicateWarning(result.duplicateWarning);
        }
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof ClientFormInput, {
                message: messages[0],
              });
            }
          }
        }
        return;
      }

      router.push(
        result.clientId
          ? `/app/kliendid/${result.clientId}`
          : "/app/kliendid",
      );
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nimi"
          placeholder="Nt. Mari Tamm"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Ettevõtte nimi"
          placeholder="Nt. Tamm OÜ"
          error={errors.companyName?.message}
          {...register("companyName")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="E-post"
          type="email"
          placeholder="mari@naide.ee"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label="Telefon"
          placeholder="+372 …"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      <TextField
        label="Registrikood"
        placeholder="Äriregistri kood"
        error={errors.registryCode?.message}
        {...register("registryCode")}
      />

      <TextAreaField
        label="Märkmed"
        placeholder="Sisemised märkmed kliendi kohta…"
        error={errors.notes?.message}
        {...register("notes")}
      />

      {formError ? (
        <div
          className="space-y-3 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700"
          role="alert"
        >
          <p>{formError}</p>
          {duplicateWarning?.kind === "company" ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/app/kliendid/${duplicateWarning.clientId}`}
                className="font-semibold underline"
              >
                Ava olemasolev klient
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setConfirmDuplicate(true);
                  setFormError(null);
                  setDuplicateWarning(null);
                  void onSubmit();
                }}
              >
                Salvesta ikkagi
              </Button>
            </div>
          ) : null}
          {duplicateWarning?.kind === "email" ? (
            <Link
              href={`/app/kliendid/${duplicateWarning.clientId}`}
              className="inline-block font-semibold underline"
            >
              Ava olemasolev klient ({duplicateWarning.clientName})
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvestan…"
            : mode === "create"
              ? "Lisa klient"
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
