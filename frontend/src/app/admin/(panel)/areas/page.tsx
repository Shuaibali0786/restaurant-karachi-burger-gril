import type { Metadata } from "next";
import { AreasTable } from "@/components/admin/AreasTable";

export const metadata: Metadata = { title: "Delivery areas" };

export default function AdminAreasPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-4 text-2xl font-black text-ink-900">Delivery areas</h1>
      <AreasTable />
    </div>
  );
}
