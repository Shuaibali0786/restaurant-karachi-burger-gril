import type { Metadata } from "next";
import { MessagesList } from "@/components/admin/MessagesList";

export const metadata: Metadata = { title: "Messages" };

export default function AdminMessagesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display mb-4 text-2xl font-black text-ink-900">Messages</h1>
      <MessagesList />
    </div>
  );
}
