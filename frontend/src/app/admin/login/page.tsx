import type { Metadata } from "next";
import { Suspense } from "react";
import { Flame } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-charcoal-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-card bg-cream-50 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-ember-500 text-charcoal-950">
            <Flame aria-hidden="true" className="size-6" />
          </span>
          <h1 className="font-display mt-3 text-3xl font-black text-ink-900">Staff sign in</h1>
          <p className="mt-1 text-sm text-ink-600">Karachi Burger &amp; Grill admin panel</p>
        </div>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
