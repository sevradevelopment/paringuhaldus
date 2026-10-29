"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import { PasswordInput } from "@/components/auth/password-input";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.push("/app");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      {formError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sisselogimine…" : "Logi sisse"}
      </Button>
    </form>
  );
}
