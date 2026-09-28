"use client";

import { useEffect, useState } from "react";
import { Loader2, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import type { AdminReview } from "@/lib/types";
import { getAdminReviews, moderateReview } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";

const stamp = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", timeZone: "Asia/Karachi" });

const STATUS_TONE = {
  pending: "bg-flame-400 text-charcoal-950",
  approved: "bg-ember-500 text-charcoal-950",
  rejected: "bg-ember-700/10 text-ember-700",
} as const;

/** Reviews waiting for a decision come first. Approving puts a review on the home page once there
 * are at least three approved; rejecting keeps it off. Either can be changed later. */
export function ReviewsQueue() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getAdminReviews()
      .then((list) => active && setReviews(list))
      .catch(() => active && setError("Could not load reviews."));
    return () => {
      active = false;
    };
  }, []);

  const decide = async (id: number, status: "approved" | "rejected") => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await moderateReview(id, status);
      setReviews((prev) => prev?.map((r) => (r.id === id ? updated : r)) ?? prev);
    } catch {
      setError("Could not save that decision. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!reviews) {
    return error ? (
      <p role="alert" className="font-semibold text-ember-700">
        {error}
      </p>
    ) : (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 aria-label="Loading reviews" className="size-6 animate-spin text-ember-700" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return <EmptyState icon={<Star aria-hidden="true" className="size-9" />} title="No reviews yet" text="Reviews from customers with a delivered order show up here." />;
  }

  const approved = reviews.filter((r) => r.status === "approved").length;

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-ink-600">
        {approved} approved. The home page shows real reviews once at least 3 are approved; until then it shows labelled samples.
      </p>
      {error && (
        <p role="alert" className="mb-3 font-semibold text-ember-700">
          {error}
        </p>
      )}
      <ul className="space-y-3">
        {reviews.map((review) => (
          <li key={review.id} className={cn("rounded-card bg-white p-4 shadow-card ring-1", review.status === "pending" ? "ring-2 ring-flame-400" : "ring-cream-200")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-extrabold text-ink-900">
                  {review.customerName} <span className="font-semibold text-ink-600">· {review.areaName}</span>
                </p>
                <p className="text-sm text-ink-600 tabular-nums">
                  {review.orderId} · {stamp.format(new Date(review.createdAt))}
                </p>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold capitalize", STATUS_TONE[review.status])}>{review.status}</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-flame-400" role="img" aria-label={`Rated ${review.rating} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} aria-hidden="true" className={cn("size-4", n <= review.rating ? "fill-current" : "text-cream-200")} />
              ))}
            </p>
            {review.comment && <p className="mt-2 whitespace-pre-wrap text-ink-900">{review.comment}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {review.status !== "approved" && (
                <button
                  type="button"
                  disabled={busyId === review.id}
                  onClick={() => void decide(review.id, "approved")}
                  className="flex min-h-11 items-center gap-1.5 rounded-full bg-ember-500 px-4 text-sm font-bold text-charcoal-950 transition hover:bg-flame-400 disabled:cursor-wait"
                >
                  <ThumbsUp aria-hidden="true" className="size-4" /> Approve
                </button>
              )}
              {review.status !== "rejected" && (
                <button
                  type="button"
                  disabled={busyId === review.id}
                  onClick={() => void decide(review.id, "rejected")}
                  className="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-ember-700 ring-1 ring-ember-500/40 hover:bg-ember-500/10 disabled:cursor-wait"
                >
                  <ThumbsDown aria-hidden="true" className="size-4" /> Reject
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
