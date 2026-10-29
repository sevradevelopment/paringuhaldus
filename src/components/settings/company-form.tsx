"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import { TextAreaField } from "@/components/ui/textarea";
import {
  updateCompanyProfileAction,
  uploadCompanyLogoAction,
} from "@/lib/actions/settings";
import {
  companyProfileSchema,
  type CompanyProfileInput,
} from "@/lib/validations/settings";

export function CompanyForm({
  defaults,
  logoUrl,
}: {
  defaults: CompanyProfileInput;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<CompanyProfileInput>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: defaults,
  });

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit((values) => {
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const result = await updateCompanyProfileAction(values);
            if (!result.ok) {
              setError(result.error);
              if (result.fieldErrors) {
                for (const [field, messages] of Object.entries(
                  result.fieldErrors,
                )) {
                  if (messages?.[0]) {
                    setFieldError(field as keyof CompanyProfileInput, {
                      message: messages[0],
                    });
                  }
                }
              }
              return;
            }
            setMessage("Ettevõtte andmed salvestatud.");
            router.refresh();
          });
        })}
        className="space-y-4"
      >
        <TextField label="Ettevõtte nimi" error={errors.name?.message} {...register("name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Registrikood" error={errors.registryCode?.message} {...register("registryCode")} />
          <TextField label="KMKR" error={errors.vatNumber?.message} {...register("vatNumber")} />
        </div>
        <TextAreaField label="Aadress" error={errors.address?.message} {...register("address")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="E-post" type="email" error={errors.email?.message} {...register("email")} />
          <TextField label="Telefon" error={errors.phone?.message} {...register("phone")} />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvestan…" : "Salvesta"}
        </Button>
      </form>

      <div className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          Logo (kasutatakse PDF kirjaplangil)
        </h3>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Ettevõtte logo" className="h-16 object-contain" />
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">Logot pole üles laaditud.</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const result = await uploadCompanyLogoAction(data);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setMessage("Logo üles laaditud.");
              router.refresh();
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <input name="logo" type="file" accept="image/*" className="text-sm" />
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            Laadi üles
          </Button>
        </form>
      </div>
    </div>
  );
}
