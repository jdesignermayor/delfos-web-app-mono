"use client";

import { MapPin, Search, Trees } from "lucide-react";

import { MEDELLIN_AREAS, NEARBY_MUNICIPALITIES } from "@/components/marketing/properties";
import { PlaceChip, type LucideIcon, type Tone } from "@/components/marketing/search-option-ui";

type PlaceGroup = {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  places: { label: string; location: string }[];
};

const PLACE_GROUPS: PlaceGroup[] = [
  {
    title: "Barrios de Medellín",
    icon: MapPin,
    tone: "indigo",
    // Neighbourhoods are searched as "<barrio>, Medellín".
    places: MEDELLIN_AREAS.map((area) => ({ label: area, location: `${area}, Medellín` })),
  },
  {
    title: "Municipios cercanos",
    icon: Trees,
    tone: "emerald",
    places: NEARBY_MUNICIPALITIES.map((municipality) => ({ label: municipality, location: municipality })),
  },
];

/** Location input + place shortcuts, shared by the full search and the mobile quick-search button. */
export function LocationFields({
  value,
  onValueChangeAction,
  onPickAction,
}: {
  value: string;
  onValueChangeAction: (value: string) => void;
  onPickAction: (location: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <label className="relative block">
        <span className="sr-only">Barrio, proyecto o ciudad</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(event) => onValueChangeAction(event.target.value)}
          placeholder="Barrio, proyecto o ciudad"
          className="w-full rounded-2xl border border-separator bg-white py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
      </label>

      {PLACE_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2.5 text-xs font-semibold text-muted">{group.title}</p>
          <div className="flex flex-wrap gap-2">
            {group.places.map(({ label, location }) => (
              <PlaceChip
                key={label}
                icon={group.icon}
                tone={group.tone}
                label={label}
                selected={value === location}
                onClick={() => onPickAction(location)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
