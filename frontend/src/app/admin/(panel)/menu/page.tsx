import type { Metadata } from "next";
import { MenuTable } from "@/components/admin/MenuTable";

export const metadata: Metadata = { title: "Menu" };

export default function AdminMenuPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display mb-4 text-2xl font-black text-ink-900">Menu management</h1>
      <MenuTable />
    </div>
  );
}
