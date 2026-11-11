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
import { SEARCH_BRUTAL, useBrutalSearch } from "@/components/marketing/search-style";

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

/** Lowercase without accents, for matching typed text to place names ("Envigado" ← "envi"). */
function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
  autoFocus = true,
  scrollRows = false,
}: {
  places: string[];
  onPlacesChangeAction: (places: string[]) => void;
  text: string;
  onTextChangeAction: (text: string) => void;
  /** Focus the input on mount (desktop panel). Off in the phone sheet, where the keyboard would cover the other filters. */
  autoFocus?: boolean;
  /** Each group of shortcuts as one row that scrolls sideways (the phone sheet: calmer than a wall of chips). */
  scrollRows?: boolean;
}) {
  const brutal = useBrutalSearch();

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
                className={
                  brutal
                    ? `group check-in inline-flex min-h-12 items-center gap-2 bg-ink px-5 py-2 text-base font-medium text-white transition-[background-color,scale] duration-200 hover:bg-ink/85 active:scale-[0.96] active:duration-75 ${SEARCH_BRUTAL.focus}`
                    : "inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background transition-opacity hover:opacity-80"
                }
              >
                {place}
                <X className={brutal ? "size-4 transition-transform duration-200 group-hover:rotate-90" : "size-3.5"} />
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
        autoFocus={autoFocus}
        scrollRows={scrollRows}
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
  autoFocus = true,
  scrollRows = false,
}: {
  value: string;
  onValueChangeAction: (value: string) => void;
  onPickAction: (location: string) => void;
  /** Places already picked, for multi-select; when absent, the shortcut matching `value` shows as picked. */
  selected?: string[];
  placeholder?: string;
  autoFocus?: boolean;
  scrollRows?: boolean;
}) {
  const brutal = useBrutalSearch();
  // Typing narrows the shortcuts to the places that match (accents and case ignored), so a place is
  // a couple of letters and a tap away.
  const query = normalize(value);
  const groups = PLACE_GROUPS.map((group) => ({
    ...group,
    places: query ? group.places.filter(({ label }) => normalize(label).includes(query)) : group.places,
  })).filter((group) => group.places.length > 0);
  return (
    <div className="flex flex-col gap-5">
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${brutal ? "size-6 text-ink" : "size-4 text-muted"}`} />
        <input
          autoFocus={autoFocus}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(event) => onValueChangeAction(event.target.value)}
          placeholder={placeholder}
          className={
            brutal
              ? // Square hairline frame that turns ink on focus; no halo.
                "w-full border-[1.5px] border-ink/20 bg-white py-4 pl-14 pr-4 text-xl text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink/45 focus:border-ink focus:shadow-[inset_0_-3px_0_0_var(--color-ink)]"
              : "w-full rounded-2xl border border-separator bg-white py-3 pl-11 pr-4 text-base text-foreground sm:text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
          }
        />
      </label>

      {query && groups.length === 0 ? (
        <p className={brutal ? "text-base text-ink/60" : "text-sm text-muted"}>
          Sin atajos para «{value.trim()}». Busca igual y te mostramos lo que coincida.
        </p>
      ) : null}
      {groups.map((group) => (
        <div key={group.title}>
          <p className={brutal ? "mb-3 text-base font-semibold text-ink/70" : "mb-2.5 text-xs font-semibold text-muted"}>{group.title}</p>
          <div
            className={
              scrollRows
                ? "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 [&>*]:shrink-0"
                : `flex flex-wrap gap-2 ${brutal ? "stagger-in" : ""}`
            }
          >
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
