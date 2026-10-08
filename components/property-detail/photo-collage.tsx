import Image from "next/image";

import { BuildingIcon } from "@/components/icons";
import type { Property } from "@/components/marketing/properties";
import { GalleryHeroVideo } from "@/components/property-detail/gallery-video";

function Tile({
  property,
  src,
  hueOffset,
  className,
  iconClassName,
  sizes,
  hero = false,
  onOpen,
}: {
  property: Property;
  src?: string;
  hueOffset: number;
  className: string;
  iconClassName: string;
  sizes: string;
  /** The large photo is fetched first; every tile is above the fold, so none lazy-load. */
  hero?: boolean;
  onOpen?: () => void;
}) {
  const hue = property.hue + hueOffset;
  const clickable = Boolean(src && onOpen);
  const Wrapper = clickable ? "button" : "div";
  return (
    <Wrapper
      {...(clickable
        ? { type: "button" as const, onClick: onOpen, "aria-label": `Ver fotos de ${property.title}` }
        : {})}
      className={`relative overflow-hidden ${clickable ? "group cursor-pointer" : ""} ${className}`}
      style={
        src
          ? undefined
          : { background: `linear-gradient(135deg, oklch(0.93 0.05 ${hue}), oklch(0.82 0.09 ${hue}))` }
      }
    >
      {src ? (
        <Image
          src={src}
          alt={property.title}
          fill
          sizes={sizes}
          loading="eager"
          fetchPriority={hero ? "high" : undefined}
          className="object-cover transition-[filter] duration-200 group-hover:brightness-90"
        />
      ) : (
        <BuildingIcon className={iconClassName} />
      )}
    </Wrapper>
  );
}

/**
 * Photo collage: one large image (or the autoplaying YouTube video) on the
 * left, four smaller square tiles on the right. Falls back to tinted placeholders when the listing has no real
 * photos yet — this mock catalogue never does. Tiles with a real photo call
 * `onOpen`.
 */
export function PhotoCollage({
  property,
  videoId,
  onOpen,
}: {
  property: Property;
  /** When set, the YouTube video takes the large tile and the photos shift to the small ones. */
  videoId?: string | null;
  onOpen?: () => void;
}) {
  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const firstSmall = videoId ? 0 : 1;

  return (
    <div className="grid grid-cols-1 gap-1 overflow-hidden rounded-2xl border border-separator sm:h-[28rem] sm:grid-cols-2">
      {videoId ? (
        <GalleryHeroVideo
          videoId={videoId}
          title={property.seo?.youtube.videoTitle || property.title}
          onOpen={onOpen}
        />
      ) : (
        <Tile
          property={property}
          src={images[0]}
          hueOffset={0}
          className="aspect-video sm:aspect-auto"
          iconClassName="absolute -bottom-10 -right-6 size-56 text-white/25"
          sizes="(min-width: 1152px) 576px, (min-width: 640px) 50vw, 100vw"
          hero
          onOpen={onOpen}
        />
      )}

      <div className="grid grid-cols-2 grid-rows-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <Tile
            key={i}
            property={property}
            src={images[i + firstSmall]}
            hueOffset={[-25, 15, 40, -45][i]}
            className="aspect-square sm:aspect-auto"
            iconClassName="absolute -bottom-5 -right-3 size-24 text-white/25"
            sizes="(min-width: 1152px) 288px, (min-width: 640px) 25vw, 50vw"
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}
