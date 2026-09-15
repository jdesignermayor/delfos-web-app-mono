import Link from "next/link";

import { BuildingIcon } from "@/components/icons";
import { formatPrice, type Property } from "@/components/marketing/properties";

export function PropertyCard({
  property,
  active = false,
  onActivate,
  onDeactivate,
}: {
  property: Property;
  active?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
}) {
  return (
    <Link
      href={`/propiedades/${property.slug}`}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      className="group flex flex-col"
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl transition-shadow ${
          active ? "ring-2 ring-accent" : ""
        }`}
        style={
          property.image
            ? undefined
            : {
                background: `linear-gradient(135deg, oklch(0.93 0.05 ${property.hue}), oklch(0.82 0.09 ${property.hue}))`,
              }
        }
      >
        {property.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.image}
            alt={property.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <BuildingIcon className="absolute -bottom-6 -right-4 size-40 text-white/25" />
        )}
      </div>

      <div className="mt-3">
        <h3 className="truncate font-medium text-foreground">{property.title}</h3>
        <p className="mt-0.5 text-sm text-muted">Desde {formatPrice(property)}</p>
      </div>
    </Link>
  );
}
