import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id}`, robots: { index: false } };
}

/** Order confirmation + tracker. Orders live on the customer's device in this phase. */
export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  return <OrderConfirmation id={decodeURIComponent(id)} />;
}
