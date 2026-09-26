import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/AuthForm";
import { AuthLayout } from "@/components/forms/AuthLayout";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Karachi Burger & Grill account.",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <AuthLayout title="Create account" subtitle="Join us for faster checkout and one-tap reorders." image="/images/fried-chicken.jpg">
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
