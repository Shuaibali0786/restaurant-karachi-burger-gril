import { Flame } from "lucide-react";

export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-charcoal-950 text-cream-50">
      <p className="container-page flex items-center justify-center gap-2 py-2 text-center text-xs font-semibold sm:text-sm">
        <Flame aria-hidden="true" className="size-4 shrink-0 text-flame-400" />
        <span>{text}</span>
      </p>
    </div>
  );
}
