import { ArchFrame } from "@/components/decorative";

// Deity portrait in an arched shrine-niche frame, name set below in the
// display face — reverent and uncluttered, no card chrome.
export default function DeityCard({
  name,
  image,
  langClass,
  description,
}: {
  name: string;
  image?: string | null;
  langClass: string;
  description?: string;
}) {
  const headingClass = langClass ? "font-tamil-display" : "font-display";
  return (
    <figure className="group flex flex-col items-center text-center">
      <ArchFrame
        src={image}
        alt={name}
        variant="tile"
        className="aspect-[4/5] w-full transition-transform duration-500 group-hover:-translate-y-1"
      />
      <figcaption className="mt-5">
        <span className={`block text-lg font-semibold leading-snug text-text-primary ${headingClass}`}>{name}</span>
        {description && <span className={`mt-2 block text-sm text-text-secondary ${langClass}`}>{description}</span>}
      </figcaption>
    </figure>
  );
}
