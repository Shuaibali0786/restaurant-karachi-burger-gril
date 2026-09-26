import { Leaf, ShieldCheck, Smartphone, Timer } from "lucide-react";

const features = [
  { Icon: Leaf, title: "Fresh Ingredients", text: "Sourced fresh every morning" },
  { Icon: ShieldCheck, title: "100% Halal", text: "Certified halal, always" },
  { Icon: Timer, title: "30 Min Delivery", text: "Hot at your door across Karachi" },
  { Icon: Smartphone, title: "Easy Online Ordering", text: "Order in a few taps" },
];

export function Features() {
  return (
    <section aria-label="Why Karachi Burger & Grill" className="relative z-10 -mt-14 sm:-mt-16">
      <div className="container-page">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-cream-200 shadow-[0_24px_60px_-24px_rgb(30_23_18/0.45)] ring-1 ring-cream-200 lg:grid-cols-4">
          {features.map(({ Icon, title, text }) => (
            <li key={title} className="flex flex-col items-center gap-3 bg-white p-5 text-center sm:flex-row sm:text-left lg:p-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ember-500/10 text-ember-700 ring-1 ring-ember-500/25">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <span>
                <span className="block font-extrabold text-ink-900">{title}</span>
                <span className="block text-sm text-ink-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
