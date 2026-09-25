"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Chip } from "@heroui/react";

import { ArrowRightIcon } from "@/components/icons";
import { PropertyForm, type PropertyRecord } from "@/components/dashboard/properties/property-form";
import { parseAmenities } from "@/lib/amenities";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

function PropertyReadView({ property }: { property: PropertyRecord }) {
  const amenities = parseAmenities(property.amenities);
  const typologies = Array.isArray(property.typologies)
    ? (property.typologies as {
        name: string;
        area: string;
        bedrooms: string;
        bathrooms: string;
        study: string;
      }[])
    : [];
  const additionalImages = property.additional_images ?? [];

  return (
    <div className="flex flex-col gap-6">
      {property.image ? (
        <div className="overflow-hidden rounded-xl border border-separator">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.image}
            alt={property.title}
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : null}

      {additionalImages.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {additionalImages.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="aspect-square w-full rounded-lg border border-separator object-cover"
            />
          ))}
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-2xl font-semibold">{currency.format(Number(property.price))}</p>
          <div className="flex flex-wrap gap-2">
            <Chip variant="soft" size="sm">
              {property.property_type ?? property.type}
            </Chip>
            {property.housing_type ? (
              <Chip variant="soft" size="sm">
                {property.housing_type}
              </Chip>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Alcobas" value={property.bedrooms} />
          <Field label="Baños" value={property.bathrooms} />
          <Field label="Parqueaderos" value={property.parking} />
          <Field label="Área" value={`${property.area} m²`} />
          <Field label="Estrato" value={property.stratum} />
          <Field label="Año de construcción" value={property.year_built} />
          <Field label="Estudio" value={property.study} />
          <Field label="Área alterna" value={property.meters ? `${property.meters} m²` : null} />
        </div>

        {property.description ? (
          <p className="mt-5 text-sm text-muted">{property.description}</p>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Ubicación</h2>
        {property.address ? (
          <p className="mt-3 font-medium text-foreground">
            {property.address}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted italic">
            Dirección no especificada
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Dirección" value={property.address} />
          <Field label="Ubicación" value={property.location} />
          <Field label="Ciudad" value={property.city} />
          <Field label="Comuna" value={property.commune} />
          <Field label="Barrio" value={property.neighborhood} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Constructora y proyecto</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Constructora" value={property.developers?.name} />
          <Field label="Proyecto" value={property.project_name} />
          <Field label="Torre" value={property.tower_name} />
          <Field label="Cantidad de torres" value={property.tower_count} />
          <Field label="Gerencia" value={property.construction_company} />
          <Field label="Banco constructor" value={property.construction_bank} />
          <Field label="Fiducia" value={property.trust_company} />
          <Field
            label="Fecha de entrega"
            value={
              property.delivery_date
                ? new Date(property.delivery_date).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                  })
                : null
            }
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Financiación</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label="Cuota inicial"
            value={
              property.initial_fee_amount
                ? currency.format(Number(property.initial_fee_amount))
                : null
            }
          />
          <Field
            label="% cuota inicial"
            value={property.initial_fee_percentage ? `${property.initial_fee_percentage}%` : null}
          />
          <Field
            label="Crédito"
            value={property.credit_amount ? currency.format(Number(property.credit_amount)) : null}
          />
          <Field
            label="% crédito"
            value={property.credit_percentage ? `${property.credit_percentage}%` : null}
          />
          <Field
            label="Separación"
            value={
              property.separation_amount
                ? currency.format(Number(property.separation_amount))
                : null
            }
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Sala de ventas</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Dirección" value={property.sales_room_address} />
          <Field label="Teléfono" value={property.sales_room_phone} />
          <Field label="Correo" value={property.sales_room_email} />
          <Field label="Horario" value={property.sales_room_hours} />
        </div>
      </Card>

      {amenities.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-base font-semibold">Amenidades</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <Chip key={amenity.id || amenity.name} variant="soft" size="sm">
                {amenity.name}
              </Chip>
            ))}
          </div>
        </Card>
      ) : null}

      {typologies.length > 0 ? (
        <Card className="p-0">
          <h2 className="p-5 pb-0 text-base font-semibold">Tipologías</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-separator text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-2.5 font-medium">Nombre / Modelo</th>
                  <th className="px-5 py-2.5 font-medium">Área (m²)</th>
                  <th className="px-5 py-2.5 font-medium">Alcobas</th>
                  <th className="px-5 py-2.5 font-medium">Baños</th>
                  <th className="px-5 py-2.5 font-medium">Estudio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {typologies.map((typology, index) => (
                  <tr key={`${typology.name}-${index}`}>
                    <td className="px-5 py-2.5 font-medium">{typology.name}</td>
                    <td className="px-5 py-2.5 text-muted">{typology.area}</td>
                    <td className="px-5 py-2.5 text-muted">{typology.bedrooms}</td>
                    <td className="px-5 py-2.5 text-muted">{typology.bathrooms}</td>
                    <td className="px-5 py-2.5 text-muted">{typology.study}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="h-5" />
        </Card>
      ) : null}
    </div>
  );
}

export function PropertyDetailView({
  property,
  developers,
  realEstateAgencies,
  trustCompanies,
  commonAreas,
}: {
  property: PropertyRecord;
  developers: { id: number; name: string }[];
  realEstateAgencies: { id: string; name: string }[];
  trustCompanies: { id: string; name: string }[];
  commonAreas: { id: string; name: string }[];
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/properties"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowRightIcon className="size-4 rotate-180" />
          Volver a propiedades
        </Link>

        <Button
          type="button"
          variant={isEditing ? "outline" : "primary"}
          size="sm"
          onPress={() => setIsEditing((v) => !v)}
        >
          {isEditing ? "Cancelar" : "Editar"}
        </Button>
      </div>

      {!isEditing ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{property.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {[property.neighborhood, property.city].filter(Boolean).join(", ") ||
              property.address ||
              "Sin ubicación"}
          </p>
        </div>
      ) : null}

      {isEditing ? (
        <PropertyForm
          developers={developers}
          realEstateAgencies={realEstateAgencies}
          trustCompanies={trustCompanies}
          commonAreas={commonAreas}
          property={property}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <PropertyReadView property={property} />
      )}
    </div>
  );
}
