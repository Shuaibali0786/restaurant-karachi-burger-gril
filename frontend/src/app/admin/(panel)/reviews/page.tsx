import type { Metadata } from "next";
import { ReviewsQueue } from "@/components/admin/ReviewsQueue";

export const metadata: Metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display mb-4 text-2xl font-black text-ink-900">Reviews</h1>
      <ReviewsQueue />
    </div>
  );
}
