import Image from "next/image";
import { cn } from "@/lib/cn";

const photos = [
  {
    src: "/images/smash-burger.jpg",
    alt: "Smoky Smash Beef burger",
    className: "top-0 left-[4%] w-[52%] -rotate-6 z-20",
    position: "object-center",
  },
  {
    src: "/images/grill-platter.jpg",
    alt: "Grill Mix Platter sizzling off the coals",
    className: "top-[10%] right-0 w-[46%] rotate-3 z-10",
    position: "object-[center_62%]",
  },
  {
    src: "/images/chicken-wings.jpg",
    alt: "Fire Wings in hot sauce",
    className: "bottom-0 left-[30%] w-[44%] rotate-2 z-30",
    position: "object-center",
  },
];

/** Three tilted food photos with an ember glow — the menu header's visual. */
export function MenuHeroCollage() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-lg">
      <div aria-hidden="true" className="absolute inset-[15%] rounded-full bg-ember-500/35 blur-3xl" />
      {photos.map((photo) => (
        <div
          key={photo.src}
          className={cn(
            "absolute aspect-[4/3] overflow-hidden rounded-card shadow-[0_24px_50px_-18px_rgb(0_0_0/0.8)] ring-4 ring-charcoal-800 transition duration-500 hover:z-40 hover:scale-105 hover:rotate-0 motion-reduce:transition-none",
            photo.className,
          )}
        >
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 18rem, 40vw" className={cn("object-cover", photo.position)} />
        </div>
      ))}
    </div>
  );
}
