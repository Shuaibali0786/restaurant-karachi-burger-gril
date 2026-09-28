"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { CircleAlert, Loader2, Star } from "lucide-react";
import type { Order } from "@/lib/types";
import { submitReview } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";

const MAX_COMMENT = 500;

const STATE_TEXT = {
  pending: "Thanks! Your review is awaiting approval.",
  approved: "Your review is published on our home page. Shukriya!",
  rejected: "Your review was not published.",
} as const;

/** Star rating (arrow keys work) plus a short comment, for a Delivered order with no review yet.
 * Once sent — or if one already exists — it shows the review's state instead. */
export function ReviewForm({ orderId, existing }: { orderId: string; existing?: Order["review"] }) {
  const uid = useId();
  const [review, setReview] = useState(existing ?? null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (review) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <span className="flex text-flame-400" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={cn("size-4", n <= review.rating ? "fill-current" : "text-cream-200")} />
          ))}
        </span>
        <span className="sr-only">You rated this order {review.rating} out of 5.</span>
        {review.status === "pending" ? "Awaiting approval" : STATE_TEXT[review.status]}
      </p>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") setRating((r) => Math.min(5, r + 1));
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") setRating((r) => Math.max(1, r - 1));
    else return;
    event.preventDefault();
  };

  const send = async () => {
    if (rating < 1) {
      setError("Please choose 1 to 5 stars.");
      return;
    }
    if (comment.trim().length < 3) {
      setError("Please add a short comment.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setReview(await submitReview(orderId, { rating, comment: comment.trim() }));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Could not send your review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl bg-cream-50 p-3 ring-1 ring-cream-200">
      <p id={`${uid}-label`} className="text-sm font-bold text-ink-900">
        How was this order?
      </p>
      <div role="radiogroup" aria-labelledby={`${uid}-label`} onKeyDown={onKeyDown} className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            tabIndex={rating === n || (rating === 0 && n === 1) ? 0 : -1}
            onClick={() => setRating(n)}
            className="flex size-11 items-center justify-center rounded-full text-flame-400 focus-visible:outline-2 focus-visible:outline-ember-500"
          >
            <Star aria-hidden="true" className={cn("size-7", n <= rating ? "fill-current" : "text-cream-200")} />
          </button>
        ))}
      </div>
      <div>
        <label htmlFor={`${uid}-comment`} className="mb-1 block text-sm font-semibold text-ink-900">
          A short comment
        </label>
        <textarea
          id={`${uid}-comment`}
          value={comment}
          maxLength={MAX_COMMENT}
          rows={3}
          onChange={(event) => setComment(event.target.value)}
          className="w-full rounded-xl border-0 bg-white px-3 py-2 text-ink-900 ring-1 ring-cream-200 focus:ring-2 focus:ring-ember-500 focus:outline-none"
        />
        <p className="text-right text-xs text-ink-600">
          {comment.length}/{MAX_COMMENT}
        </p>
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-ember-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <button type="button" onClick={() => void send()} disabled={busy} className={buttonClasses("primary", "md", "disabled:cursor-wait")}>
        {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Send review
      </button>
    </div>
  );
}
