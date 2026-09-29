import { Flame } from "lucide-react";

export function AnnouncementBar({ text, demoNotice }: { text: string; demoNotice: string }) {
  return (
    <div className="bg-charcoal-950 text-cream-50">
      <p className="container-page flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 py-2 text-center text-xs font-semibold sm:text-sm">
        <Flame aria-hidden="true" className="size-4 shrink-0 text-flame-400" />
        <span>{text}</span>
        <span aria-hidden="true" className="hidden text-charcoal-700 sm:inline">|</span>
        <span className="rounded-full bg-flame-400/15 px-2.5 py-0.5 text-flame-400 ring-1 ring-flame-400/30">{demoNotice}</span>
      </p>
    </div>
  );
}
