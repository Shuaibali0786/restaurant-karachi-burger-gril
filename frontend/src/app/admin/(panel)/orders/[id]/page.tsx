import type { Metadata } from "next";
import { AdminOrderView } from "@/components/admin/AdminOrderView";

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminOrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${decodeURIComponent(id)}` };
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  return <AdminOrderView id={decodeURIComponent(id)} />;
}
