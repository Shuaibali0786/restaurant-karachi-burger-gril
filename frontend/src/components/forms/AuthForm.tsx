"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { CircleAlert, Loader2 } from "lucide-react";
import { login, signup } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { loginSchema, signupSchema } from "@/lib/validation";
import { useSession } from "@/stores/session";
import { buttonClasses } from "@/components/ui/Button";
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
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com", hint: "Email or mobile number — at least one" },
  { name: "phone", label: "Mobile number", type: "tel", autoComplete: "tel-national", placeholder: "03XX-XXXXXXX" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 8 characters" },
  { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
];

/** Only same-site paths, so a crafted `?from=` can never bounce someone to another website. */
function safeDestination(from: string | null): string {
  return from && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/admin") ? from : "/account/orders";
}

/** Customer login and signup (email or mobile number plus password). Sets the session and goes on to
 * where the visitor came from, or "My orders". */
export function AuthForm({ mode }: { mode: Mode }) {
  const uid = useId();
  const router = useRouter();
  const from = useSearchParams().get("from");
  const setUser = useSession((state) => state.setUser);
  const [formError, setFormError] = useState<string | null>(null);
  const isLogin = mode === "login";
  const fields = isLogin ? loginFields : signupFields;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    // The two schemas have different field sets; both validate flat string records.
    resolver: (isLogin ? zodResolver(loginSchema) : zodResolver(signupSchema)) as unknown as Resolver<AuthValues>,
    mode: "onTouched",
  });

  const onSubmit = async (values: AuthValues) => {
    const value = (key: string) => values[key] ?? "";
    setFormError(null);
    try {
      const user = isLogin
        ? await login({ identifier: value("identifier"), password: value("password") })
        : await signup({ name: value("name"), email: value("email"), phone: value("phone"), password: value("password") });
      setUser(user);
      router.replace(safeDestination(from));
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      if (error.code === "VALIDATION_FAILED" && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          if (field === "email" || field === "phone") setError(field, { message });
        }
      }
      setFormError(error.message);
    }
  };

  return (
    <>
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
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-ember-500/10 p-4 font-semibold text-ember-700 ring-1 ring-ember-500/30">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {formError}
          </p>
        )}
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
            <span className="font-semibold text-ink-600">Forgot your password? Contact us and we&apos;ll help.</span>
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
