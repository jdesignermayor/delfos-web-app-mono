"use client";

import { MapPin, Search, Trees, X } from "lucide-react";

import {
  MEDELLIN_AREAS,
  NEARBY_MUNICIPALITIES,
  locationsParam,
  placeShortName,
  withPlace,
} from "@/components/marketing/properties";
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

/**
 * Several places at once: the picked ones as removable chips on top, then the input and shortcuts
 * (a shortcut toggles its place). Typed text stays in `text` until the caller adds it, usually
 * when searching.
 */
export function MultiLocationFields({
  places,
  onPlacesChangeAction,
  text,
  onTextChangeAction,
}: {
  places: string[];
  onPlacesChangeAction: (places: string[]) => void;
  text: string;
  onTextChangeAction: (text: string) => void;
}) {
  function toggle(place: string) {
    onPlacesChangeAction(places.includes(place) ? places.filter((item) => item !== place) : withPlace(places, place));
  }

  return (
    <div className="flex flex-col gap-4">
      {places.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Ubicaciones seleccionadas">
          {places.map((place) => (
            <li key={place}>
              <button
                type="button"
                onClick={() => toggle(place)}
                aria-label={`Quitar ${place}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background transition-opacity hover:opacity-80"
              >
                {place}
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <LocationFields
        value={text}
        onValueChangeAction={onTextChangeAction}
        onPickAction={toggle}
        selected={places}
        placeholder={places.length ? "Agrega otro barrio o ciudad" : "Barrio, proyecto o ciudad"}
      />
    </div>
  );
}

/** Places picked plus whatever is still typed in the box, as the `ubicacion` param. */
export function locationsWithText(places: string[], text: string) {
  const typed = text.trim();
  return locationsParam(typed ? withPlace(places, typed) : places);
}

/** "El Poblado, Medellín", or "El Poblado +2" for several; "" for none. */
export function locationsLabel(places: string[], text = "") {
  if (places.length > 1) return `${placeShortName(places[0])} +${places.length - 1}`;
  return places[0] ?? text.trim();
}

/**
 * Location input + place shortcuts, shared by the full search, the mobile quick-search button and
 * the /search filter bar. With `selected`, several shortcuts can be on at once (multi-select).
 */
export function LocationFields({
  value,
  onValueChangeAction,
  onPickAction,
  selected,
  placeholder = "Barrio, proyecto o ciudad",
}: {
  value: string;
  onValueChangeAction: (value: string) => void;
  onPickAction: (location: string) => void;
  /** Places already picked, for multi-select; when absent, the shortcut matching `value` shows as picked. */
  selected?: string[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(event) => onValueChangeAction(event.target.value)}
          placeholder={placeholder}
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
                selected={selected ? selected.includes(location) : value === location}
                onClick={() => onPickAction(location)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
