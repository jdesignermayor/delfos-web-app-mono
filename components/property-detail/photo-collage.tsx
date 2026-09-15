import { BuildingIcon } from "@/components/icons";
import type { Property } from "@/components/marketing/properties";

function Tile({
  property,
  src,
  hueOffset,
  className,
  iconClassName,
}: {
  property: Property;
  src?: string;
  hueOffset: number;
  className: string;
  iconClassName: string;
}) {
  const hue = property.hue + hueOffset;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={
        src
          ? undefined
          : { background: `linear-gradient(135deg, oklch(0.93 0.05 ${hue}), oklch(0.82 0.09 ${hue}))` }
      }
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={property.title} className="size-full object-cover" />
      ) : (
        <BuildingIcon className={iconClassName} />
      )}
    </div>
  );
}

/**
 * Photo collage: one large image on the right, four smaller square tiles on
 * the left. Falls back to tinted placeholders when the listing has no real
 * photos yet — this mock catalogue never does.
 */
export function PhotoCollage({ property }: { property: Property }) {
  const images = property.images ?? [];

  return (
    <div className="grid grid-cols-1 gap-1 overflow-hidden rounded-2xl border border-separator sm:aspect-[16/9] sm:grid-cols-2">
      <div className="grid grid-cols-2 grid-rows-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <Tile
            key={i}
            property={property}
            src={images[i + 1]}
            hueOffset={[-25, 15, 40, -45][i]}
            className="aspect-square sm:aspect-auto"
            iconClassName="absolute -bottom-5 -right-3 size-24 text-white/25"
          />
        ))}
      </div>

      <Tile
        property={property}
        src={images[0] ?? property.image}
        hueOffset={0}
        className="aspect-video sm:aspect-auto"
        iconClassName="absolute -bottom-10 -right-6 size-56 text-white/25"
      />
    </div>
  );
}
