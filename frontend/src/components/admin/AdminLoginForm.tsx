"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { CircleAlert, Loader2, LogIn } from "lucide-react";
import { adminLogin } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { loginSchema, type LoginFormValues } from "@/lib/validation";
import { useSession } from "@/stores/session";
import { Button } from "@/components/ui/Button";
import { describedBy, Field } from "@/components/forms/Field";
import { PasswordInput } from "@/components/forms/PasswordInput";

/** Sign-in for staff only — a separate flow from the customer login (Constitution IX). */
export function AdminLoginForm() {
  const uid = useId();
  const router = useRouter();
  const setUser = useSession((state) => state.setUser);
  const from = useSearchParams().get("from");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), mode: "onTouched" });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const user = await adminLogin(values);
      setUser(user);
      router.replace(from && from.startsWith("/admin") ? from : "/admin");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-ember-500/10 p-4 font-semibold text-ember-700 ring-1 ring-ember-500/30">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {formError}
        </p>
      )}
      <Field id={`${uid}-identifier`} label="Email or mobile number" error={errors.identifier?.message}>
        <input
          id={`${uid}-identifier`}
          autoComplete="username"
          aria-invalid={errors.identifier ? true : undefined}
          aria-describedby={describedBy(`${uid}-identifier`, { error: errors.identifier })}
          className="w-full rounded-xl border-0 bg-white px-4 py-3 text-ink-900 ring-1 ring-cream-200 placeholder:text-ink-600/70 focus:ring-2 focus:ring-ember-500 focus:outline-none aria-invalid:ring-2 aria-invalid:ring-ember-600"
          {...register("identifier")}
        />
      </Field>
      <Field id={`${uid}-password`} label="Password" error={errors.password?.message}>
        <PasswordInput
          id={`${uid}-password`}
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={describedBy(`${uid}-password`, { error: errors.password })}
          {...register("password")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} icon={isSubmitting ? undefined : <LogIn aria-hidden="true" className="size-5" />}>
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden="true" className="size-5 animate-spin" /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
