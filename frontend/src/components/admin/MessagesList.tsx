"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, MailOpen, Phone } from "lucide-react";
import type { ContactMessage, NewsletterSubscriber } from "@/lib/types";
import {
  getContactMessages,
  getNewsletterSubscribers,
  markMessageRead,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";

const stamp = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

type Tab = "messages" | "subscribers";

const tabClass = (active: boolean) =>
  cn(
    "min-h-11 rounded-full px-4 text-sm font-bold transition",
    active
      ? "bg-ember-500 text-charcoal-950"
      : "bg-white text-ink-900 ring-1 ring-cream-200 hover:ring-ember-500",
  );

/** Contact-form messages (newest first, with an unread marker, a read/unread toggle and an unread
 * filter) and the newsletter sign-ups. Message text is shown as plain text: React escapes it. */
export function MessagesList() {
  const [tab, setTab] = useState<Tab>("messages");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getContactMessages()
      .then((list) => active && setMessages(list))
      .catch(() => active && setError("Could not load messages."));
    getNewsletterSubscribers()
      .then((list) => active && setSubscribers(list))
      .catch(() => active && setError("Could not load sign-ups."));
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (message: ContactMessage) => {
    try {
      const updated = await markMessageRead(message.id, !message.isRead);
      setMessages(
        (prev) => prev?.map((m) => (m.id === updated.id ? updated : m)) ?? prev,
      );
    } catch {
      setError("Could not update that message. Please try again.");
    }
  };

  const unreadCount = messages?.filter((m) => !m.isRead).length ?? 0;
  const shown = unreadOnly ? messages?.filter((m) => !m.isRead) : messages;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Messages and sign-ups"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "messages"}
            onClick={() => setTab("messages")}
            className={tabClass(tab === "messages")}
          >
            Messages{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "subscribers"}
            onClick={() => setTab("subscribers")}
            className={tabClass(tab === "subscribers")}
          >
            Newsletter sign-ups{subscribers ? ` (${subscribers.length})` : ""}
          </button>
        </div>
        {tab === "messages" && (
          <label className="ml-auto flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-900">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => setUnreadOnly(event.target.checked)}
              className="size-5 accent-ember-500"
            />
            Unread only
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-3 font-semibold text-ember-700">
          {error}
        </p>
      )}

      {tab === "messages" &&
        (!shown ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2
              aria-label="Loading messages"
              className="size-6 animate-spin text-ember-700"
            />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<MailOpen aria-hidden="true" className="size-9" />}
            title={unreadOnly ? "No unread messages" : "No messages yet"}
            text="Messages from the website's contact form show up here."
          />
        ) : (
          <ul className="space-y-3">
            {shown.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "rounded-card bg-white p-4 shadow-card ring-1",
                  message.isRead ? "ring-cream-200" : "ring-2 ring-flame-400",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-extrabold text-ink-900">
                      {message.name}
                      {!message.isRead && (
                        <span className="rounded-full bg-flame-400 px-2 py-0.5 text-[10px] font-black text-charcoal-950 uppercase">
                          New
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-600">
                      {stamp.format(new Date(message.createdAt))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggle(message)}
                    className="min-h-11 rounded-full px-4 text-sm font-bold text-ember-700 ring-1 ring-ember-500/40 hover:bg-ember-500/10"
                  >
                    {message.isRead ? "Mark as unread" : "Mark as read"}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-ink-900">
                  {message.message}
                </p>
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-ink-600">
                  {message.phone && (
                    <a
                      href={`tel:${message.phone}`}
                      className="flex items-center gap-1.5 hover:text-ember-700"
                    >
                      <Phone aria-hidden="true" className="size-4" />{" "}
                      {message.phone}
                    </a>
                  )}
                  {message.email && (
                    <a
                      href={`mailto:${message.email}`}
                      className="flex items-center gap-1.5 hover:text-ember-700"
                    >
                      <Mail aria-hidden="true" className="size-4" />{" "}
                      {message.email}
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ul>
        ))}

      {tab === "subscribers" &&
        (!subscribers ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2
              aria-label="Loading sign-ups"
              className="size-6 animate-spin text-ember-700"
            />
          </div>
        ) : subscribers.length === 0 ? (
          <EmptyState
            icon={<Mail aria-hidden="true" className="size-9" />}
            title="No sign-ups yet"
            text="Emails from the footer sign-up show up here."
          />
        ) : (
          <ul className="divide-y divide-cream-200 rounded-card bg-white shadow-card ring-1 ring-cream-200">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.email}
                className="flex flex-wrap justify-between gap-2 p-4 text-sm"
              >
                <span className="font-bold text-ink-900">
                  {subscriber.email}
                </span>
                <span className="text-ink-600">
                  {stamp.format(new Date(subscriber.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
