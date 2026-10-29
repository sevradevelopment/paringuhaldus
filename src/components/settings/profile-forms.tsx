"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/auth/text-field";
import {
  changePasswordAction,
  updatePersonalProfileAction,
} from "@/lib/actions/settings";
import {
  passwordChangeSchema,
  personalProfileSchema,
  type PasswordChangeInput,
  type PersonalProfileInput,
} from "@/lib/validations/settings";

export function ProfileForms({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);

  const profileForm = useForm<PersonalProfileInput>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: { name, email },
  });

  const passwordForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="space-y-10">
      <form
        className="space-y-4"
        onSubmit={profileForm.handleSubmit((values) => {
          setProfileErr(null);
          setProfileMsg(null);
          startTransition(async () => {
            const result = await updatePersonalProfileAction(values);
            if (!result.ok) {
              setProfileErr(result.error);
              return;
            }
            setProfileMsg("Profiil salvestatud.");
            router.refresh();
          });
        })}
      >
        <h3 className="text-sm font-semibold text-[var(--ink)]">Isikuandmed</h3>
        <TextField
          label="Nimi"
          error={profileForm.formState.errors.name?.message}
          {...profileForm.register("name")}
        />
        <TextField
          label="E-post"
          type="email"
          error={profileForm.formState.errors.email?.message}
          {...profileForm.register("email")}
        />
        {profileErr ? <p className="text-sm text-red-600">{profileErr}</p> : null}
        {profileMsg ? <p className="text-sm text-emerald-700">{profileMsg}</p> : null}
        <Button type="submit" disabled={pending}>
          Salvesta profiil
        </Button>
      </form>

      <form
        className="space-y-4"
        onSubmit={passwordForm.handleSubmit((values) => {
          setPassErr(null);
          setPassMsg(null);
          startTransition(async () => {
            const result = await changePasswordAction(values);
            if (!result.ok) {
              setPassErr(result.error);
              return;
            }
            setPassMsg("Parool muudetud.");
            passwordForm.reset();
          });
        })}
      >
        <h3 className="text-sm font-semibold text-[var(--ink)]">Parooli vahetus</h3>
        <TextField
          label="Praegune parool"
          type="password"
          error={passwordForm.formState.errors.currentPassword?.message}
          {...passwordForm.register("currentPassword")}
        />
        <TextField
          label="Uus parool"
          type="password"
          error={passwordForm.formState.errors.newPassword?.message}
          {...passwordForm.register("newPassword")}
        />
        <TextField
          label="Uus parool uuesti"
          type="password"
          error={passwordForm.formState.errors.confirmPassword?.message}
          {...passwordForm.register("confirmPassword")}
        />
        {passErr ? <p className="text-sm text-red-600">{passErr}</p> : null}
        {passMsg ? <p className="text-sm text-emerald-700">{passMsg}</p> : null}
        <Button type="submit" variant="secondary" disabled={pending}>
          Muuda parool
        </Button>
      </form>
    </div>
  );
}
