import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/forms/AuthForm";
import { AuthLayout } from "@/components/forms/AuthLayout";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Karachi Burger & Grill.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to reorder your Karachi favourites." image="/images/smash-burger.jpg">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthLayout>
  );
}
