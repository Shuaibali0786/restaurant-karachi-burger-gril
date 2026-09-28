"use client";

import { getTodaySummary } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { TodayStats } from "@/components/admin/TodayStats";

export default function AdminDashboardPage() {
  const { data: summary } = usePolling({ fetcher: getTodaySummary });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="sr-only">Orders dashboard</h1>
      <TodayStats summary={summary} />
      <OrdersBoard />
    </div>
  );
}
