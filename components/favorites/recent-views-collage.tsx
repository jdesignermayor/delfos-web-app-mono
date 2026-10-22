"use client";

import Image from "next/image";
import Link from "next/link";
import { History } from "lucide-react";

import type { Property } from "@/components/marketing/properties";
import { LISTING_IMAGE_QUALITY } from "@/lib/image-quality";

const TILE_COUNT = 4;

/** One quarter of the collage: the listing's first photo, or its tinted placeholder. */
function CollageTile({ property }: { property?: Property }) {
  const src = property?.images?.[0] ?? property?.image;
  if (src) {
    return (
      <div className="relative overflow-hidden bg-surface-secondary">
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 12vw, (min-width: 640px) 16vw, 25vw"
          quality={LISTING_IMAGE_QUALITY}
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="bg-surface-secondary"
      style={
        property
          ? { background: `linear-gradient(135deg, oklch(0.93 0.05 ${property.hue}), oklch(0.82 0.09 ${property.hue}))` }
          : undefined
      }
    />
  );
}

/**
 * A single card for every recently viewed property: a 2×2 collage of the latest ones that opens
 * their own page. Grey and inert while there are none.
 */
export function RecentViewsCollage({ properties }: { properties: Property[] }) {
  const count = properties.length;

  if (count === 0) {
    return (
      <div aria-disabled className="flex flex-col">
        <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface-secondary px-4 text-center text-muted">
          <History className="size-8" strokeWidth={1.75} />
          <p className="text-sm font-medium">Aún no hay vistos recientemente</p>
        </div>
        <div className="mt-3">
          <h3 className="truncate font-bold text-muted">Vistos recientemente</h3>
          <p className="mt-0.5 text-sm font-semibold text-muted">Sin propiedades</p>
        </div>
      </div>
    );
  }

  const tiles = Array.from({ length: TILE_COUNT }, (_, index) => properties[index]);

  return (
    <Link href="/favoritos/vistos-recientemente" className="group flex flex-col">
      <div className="grid aspect-square w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl transition-[filter] group-hover:brightness-95">
        {tiles.map((property, index) => (
          <CollageTile key={property?.slug ?? `empty-${index}`} property={property} />
        ))}
      </div>
      <div className="mt-3">
        <h3 className="truncate font-bold text-foreground">Vistos recientemente</h3>
        <p className="mt-0.5 text-sm font-semibold text-muted">
          {count} {count === 1 ? "propiedad" : "propiedades"}
        </p>
      </div>
    </Link>
  );
}
