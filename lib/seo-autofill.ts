import { slugify } from "@/lib/slug";

/** What the SEO autofill needs from the property form. */
export type SeoAutofillInput = {
  projectName: string;
  propertyType: string;
  housingType: string;
  location: string;
  city: string;
  neighborhood: string;
  price: string;
  stratum: string;
  /** "YYYY-MM" from the form's month picker. */
  deliveryDate: string;
  developerName?: string;
  description: string;
  amenities: string[];
  typologies: { area: string; bedrooms: string; bathrooms: string }[];
};

export type SeoTexts = {
  meta: { ogTitle: string; ogDescription: string; campaign: string };
  google: { metaTitle: string; slug: string; metaDescription: string; keywords: string };
  youtube: { videoTitle: string; tags: string; videoDescription: string };
  linkedin: { title: string; description: string };
};

const TYPE_PLURAL: Record<string, string> = {
  apartamento: "Apartamentos",
  casa: "Casas",
  apartaestudio: "Apartaestudios",
  proyecto: "Vivienda nueva",
};

const monthYear = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

/** Cuts at the last whole word that fits, adding "…" only when something was cut. */
function fit(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Joins sentences, dropping ones that no longer fit under `max`. */
function fitSentences(sentences: (string | false | undefined)[], max: number) {
  let result = "";
  for (const sentence of sentences) {
    if (!sentence) continue;
    const next = result ? `${result} ${sentence}` : sentence;
    if (next.length > max) continue;
    result = next;
  }
  return result;
}

const range = (values: number[], unit = "") => {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const format = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 1 });
  return `${min === max ? format(min) : `${format(min)} a ${format(max)}`}${unit}`;
};

const numbers = (values: string[]) =>
  values.map((value) => Number(String(value).replace(",", "."))).filter((n) => Number.isFinite(n) && n > 0);

/** "$464 millones" / "$1.250 millones". */
const priceText = (price: number) => `$${Math.round(price / 1_000_000).toLocaleString("es-CO")} millones`;

/**
 * Suggested SEO copy for every platform, built only from the listing's own
 * data (no external service). Each value respects the length the SEO step
 * recommends for its field.
 */
export function buildSeoTexts(input: SeoAutofillInput): SeoTexts {
  const project = input.projectName.trim() || "Proyecto de vivienda";
  const kind = TYPE_PLURAL[input.propertyType] ?? "Vivienda";
  // "La Estrella" from "La Estrella, Antioquia"; the neighbourhood when there's one.
  const municipality = input.city.trim() || input.location.split(",")[0]?.trim() || "";
  const place = [input.neighborhood.trim(), municipality].filter(Boolean).join(", ") || input.location.trim();
  const region = input.location.split(",")[1]?.trim() ?? "";

  const price = Number(input.price);
  const beds = range(numbers(input.typologies.map((t) => t.bedrooms)));
  const baths = range(numbers(input.typologies.map((t) => t.bathrooms)));
  const area = range(numbers(input.typologies.map((t) => t.area)), " m²");
  const delivery = /^\d{4}-\d{2}$/.test(input.deliveryDate)
    ? monthYear.format(new Date(`${input.deliveryDate}-01T00:00:00Z`))
    : "";
  const affordable = /^\s*vi[sp]\b/i.test(input.housingType);
  const topAmenities = input.amenities.map((a) => a.trim()).filter(Boolean).slice(0, 3);
  const developer = input.developerName?.trim();

  const specs = [
    beds && `${beds} ${beds === "1" ? "habitación" : "habitaciones"}`,
    baths && `${baths} ${baths === "1" ? "baño" : "baños"}`,
    area,
  ].filter(Boolean);

  const sentences = [
    `${kind} en venta en ${place}${price > 0 ? ` desde ${priceText(price)}` : ""}.`,
    specs.length > 0 && `${specs.join(", ")}.`,
    delivery && `Entrega en ${delivery}.`,
    affordable && "Vivienda VIS.",
    topAmenities.length > 0 && `Con ${topAmenities.join(", ").toLowerCase()}.`,
    developer && `Por ${developer}.`,
  ];

  const keywords = [
    `${kind.toLowerCase()} en ${municipality}`.trim(),
    `${kind.toLowerCase()} nuevos`,
    project.toLowerCase(),
    municipality.toLowerCase(),
    region.toLowerCase(),
    "proyecto de vivienda",
    affordable ? "vivienda vis" : "vivienda no vis",
    input.stratum ? `estrato ${input.stratum}` : "",
    developer ?? "",
  ];
  const uniqueKeywords = [...new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))];

  const videoDescription = [
    `${project}: ${sentences.filter(Boolean).join(" ")}`,
    input.description.trim(),
    topAmenities.length > 0 ? `Zonas comunes: ${input.amenities.join(", ")}.` : "",
    "Conoce más y agenda tu visita en Delfos.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    meta: {
      ogTitle: fit(`${project}: ${kind.toLowerCase()} en venta en ${municipality || place}`, 60),
      ogDescription: fitSentences(sentences, 160),
      campaign: slugify(project),
    },
    google: {
      // Phrased like the query ("apartamentos en venta en La Estrella"), which is what Google and ChatGPT's searches match.
      metaTitle: fit(`${project}: ${kind.toLowerCase()} en venta en ${municipality || place}`, 60),
      slug: slugify([project, municipality].filter(Boolean).join(" ")),
      metaDescription: fitSentences(sentences, 160),
      keywords: uniqueKeywords.join(", "),
    },
    youtube: {
      videoTitle: fit(`${project} – Recorrido por ${kind.toLowerCase()} en ${municipality || place}`, 100),
      tags: uniqueKeywords.slice(0, 8).join(", "),
      videoDescription: fit(videoDescription, 5000),
    },
    linkedin: {
      title: fit(`${project}: ${kind.toLowerCase()} nuevos en venta en ${municipality || place}`, 70),
      description: fitSentences(sentences, 150),
    },
  };
}
