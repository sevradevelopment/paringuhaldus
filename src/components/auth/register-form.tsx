"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import { PasswordInput } from "@/components/auth/password-input";
import { registerAction } from "@/lib/actions/auth";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      companyName: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof RegisterInput, { message: messages[0] });
            }
          }
        }
        return;
      }
      router.push("/app");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <TextField
        label="Nimi"
        autoComplete="name"
        placeholder="Mari Mets"
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label="E-post"
        type="email"
        autoComplete="email"
        placeholder="mari@ettevote.ee"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordInput
        label="Parool"
        autoComplete="new-password"
        placeholder="Vähemalt 8 tähemärki"
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="Ettevõtte nimi"
        autoComplete="organization"
        placeholder="Minu Ettevõte OÜ"
        error={errors.companyName?.message}
        {...register("companyName")}
      />

      {formError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Konto loomine…" : "Loo konto"}
      </Button>
    </form>
  );
}
