"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useId, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Info, Loader2, PartyPopper, UtensilsCrossed } from "lucide-react";
import { login, signup } from "@/lib/api";
import { loginSchema, signupSchema } from "@/lib/validation";
import { buttonClasses, ButtonLink } from "@/components/ui/Button";
import { describedBy, Field, inputClass } from "@/components/forms/Field";
import { PasswordInput } from "@/components/forms/PasswordInput";

type Mode = "login" | "signup";

/** Both forms are flat string fields, so one simple value type covers them. */
type AuthValues = Record<string, string>;

interface FieldSpec {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "password";
  autoComplete: string;
  placeholder?: string;
  hint?: string;
}

const loginFields: FieldSpec[] = [
  { name: "identifier", label: "Email or mobile number", autoComplete: "username", placeholder: "you@example.com or 0300-1234567" },
  { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
];

const signupFields: FieldSpec[] = [
  { name: "name", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
  { name: "phone", label: "Mobile number", type: "tel", autoComplete: "tel-national", placeholder: "03XX-XXXXXXX" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 8 characters" },
  { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
];

/**
 * Login / signup, UI only (Constitution IX): validates like the real thing,
 * then explains that accounts go live with the backend. Nothing is stored.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const uid = useId();
  const [done, setDone] = useState(false);
  const isLogin = mode === "login";
  const fields = isLogin ? loginFields : signupFields;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    // The two schemas have different field sets; both validate flat string records.
    resolver: (isLogin ? zodResolver(loginSchema) : zodResolver(signupSchema)) as unknown as Resolver<AuthValues>,
    mode: "onTouched",
  });

  const onSubmit = async (values: AuthValues) => {
    const value = (key: string) => values[key] ?? "";
    if (isLogin) await login({ identifier: value("identifier"), password: value("password") });
    else await signup({ name: value("name"), email: value("email"), phone: value("phone"), password: value("password") });
    setDone(true);
  };

  if (done) {
    return (
      <div role="status" className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-flame-400 text-charcoal-950">
          <PartyPopper aria-hidden="true" className="size-8" />
        </span>
        <h2 className="font-display mt-4 text-3xl font-black text-ink-900">Accounts are coming soon</h2>
        <p className="mt-2 text-ink-600">
          {isLogin ? "Sign-in" : "Sign-up"} goes live with our ordering backend. Until then you can order as a guest — it
          only takes a minute.
        </p>
        <ButtonLink href="/menu" size="lg" className="mt-6" icon={<UtensilsCrossed aria-hidden="true" className="size-5" />}>
          Browse menu
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 flex gap-2 rounded-xl bg-cream-100 p-3 text-sm text-ink-900 ring-1 ring-cream-200">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ember-700" />
        Accounts go live with our ordering backend soon. You can already order as a guest.
      </p>

      <button
        type="button"
        disabled
        className="flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white font-bold text-ink-600 ring-1 ring-cream-200"
      >
        Continue with Google
        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs ring-1 ring-cream-200">Coming soon</span>
      </button>

      <div className="my-6 flex items-center gap-3 text-xs font-bold tracking-widest text-ink-600 uppercase" aria-hidden="true">
        <span className="h-px flex-1 bg-cream-200" /> or <span className="h-px flex-1 bg-cream-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {fields.map((field) => {
          const id = `${uid}-${field.name}`;
          const error = errors[field.name]?.message;
          const common = {
            id,
            autoComplete: field.autoComplete,
            placeholder: field.placeholder,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy(id, { hint: field.hint, error }),
            ...register(field.name),
          };
          return (
            <Field key={field.name} id={id} label={field.label} hint={field.hint} error={error}>
              {field.type === "password" ? (
                <PasswordInput {...common} />
              ) : (
                <input type={field.type ?? "text"} inputMode={field.type === "tel" ? "tel" : undefined} className={`${inputClass} min-h-12`} {...common} />
              )}
            </Field>
          );
        })}

        {isLogin && (
          <p className="text-right text-sm">
            <span className="font-semibold text-ink-600">Forgot password? Available when accounts launch.</span>
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={buttonClasses("primary", "lg", "w-full disabled:cursor-wait")}>
          {isSubmitting && <Loader2 aria-hidden="true" className="size-5 animate-spin" />}
          {isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        {isLogin ? "New to Karachi Burger & Grill? " : "Already have an account? "}
        <Link href={isLogin ? "/signup" : "/login"} className="font-bold text-ember-700 underline-offset-4 hover:underline">
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </>
  );
}
