"use client";

import {
  ShieldCheckIcon,
  MapPinIcon,
  FlameIcon,
  BicepsFlexedIcon,
  UsersIcon,
  ZapIcon,
  WavesIcon,
  WindIcon,
  SquareActivityIcon,
  LaptopMinimalCheckIcon,
} from "lucide-animated";
import { LeafIcon, CheckCircleIcon } from "lucide-react";

interface Amenity {
  label: string;
  icon: React.ComponentType<any>;
  isAnimated?: boolean;
}

const AMENITIES: Amenity[] = [
  { label: "Portería 24 horas", icon: ShieldCheckIcon, isAnimated: true },
  { label: "Parqueadero de visitantes", icon: MapPinIcon, isAnimated: true },
  { label: "Zona BBQ", icon: FlameIcon, isAnimated: true },
  { label: "Gimnasio", icon: BicepsFlexedIcon, isAnimated: true },
  { label: "Salón social", icon: UsersIcon, isAnimated: true },
  { label: "Ascensor", icon: ZapIcon, isAnimated: true },
  { label: "Piscina", icon: WavesIcon, isAnimated: true },
  { label: "Sauna", icon: WindIcon, isAnimated: true },
  { label: "Cancha deportiva", icon: SquareActivityIcon, isAnimated: true },
  { label: "Parqueadero", icon: MapPinIcon, isAnimated: true },
  { label: "Jardín", icon: LeafIcon, isAnimated: false },
  { label: "Vigilancia", icon: ShieldCheckIcon, isAnimated: true },
  { label: "Área común", icon: UsersIcon, isAnimated: true },
  { label: "Parque infantil", icon: LeafIcon, isAnimated: false },
  { label: "Cowork", icon: LaptopMinimalCheckIcon, isAnimated: true },
  { label: "Terraza", icon: WindIcon, isAnimated: true },
  // Names used by the common areas catalogue in the dashboard.
  { label: "Coworking", icon: LaptopMinimalCheckIcon, isAnimated: true },
  { label: "Portería", icon: ShieldCheckIcon, isAnimated: true },
  { label: "Juegos infantiles", icon: LeafIcon, isAnimated: false },
  { label: "Placa polideportiva", icon: SquareActivityIcon, isAnimated: true },
];

/** "Salon social " and "Salón social" are the same amenity: ignore case, accents and stray spaces. */
const normalize = (label: string) =>
  label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const AMENITY_MAP = new Map(AMENITIES.map((a) => [normalize(a.label), a]));

/** An amenity of the listing. Ones without a dedicated icon get a generic check, never a "missing" style. */
export function AmenityItem({ label }: { label: string }) {
  const amenity = AMENITY_MAP.get(normalize(label));
  const Icon: Amenity["icon"] = amenity?.icon || CheckCircleIcon;
  const isAnimated = amenity?.isAnimated ?? false;

  return (
    <li className="flex items-center gap-3">
      <div className="shrink-0">
        {isAnimated ? (
          <Icon size={20} animateOnHover={true} />
        ) : (
          <Icon className="size-5 text-foreground" />
        )}
      </div>
      <span className="text-foreground">{label}</span>
    </li>
  );
}
