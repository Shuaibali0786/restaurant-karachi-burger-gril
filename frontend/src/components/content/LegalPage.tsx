import type { ReactNode } from "react";
import { PageHero } from "@/components/ui/PageHero";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

/** Plain, readable policy page (Privacy, Terms). */
export function LegalPage({ title, intro, updated, sections }: { title: string; intro: string; updated: string; sections: LegalSection[] }) {
  return (
    <>
      <PageHero title={title} intro={intro} />
      <div className="bg-cream-50">
        <article className="container-page max-w-3xl py-12 sm:py-16">
          <p className="mb-8 text-sm font-semibold text-ink-600">Last updated {updated}</p>
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-extrabold text-ink-900">{section.heading}</h2>
                <div className="mt-2 space-y-3 leading-relaxed text-ink-600 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink-900">{section.body}</div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}
