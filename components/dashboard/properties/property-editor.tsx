"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Card, Skeleton } from "@heroui/react";

import type { PropertyRecord } from "@/components/dashboard/properties/property-form";
import type { PropertyFormOptions } from "@/lib/data/property-form-options";

const loadPropertyForm = () => import("@/components/dashboard/properties/property-form");

/**
 * Starts downloading the (large) property form bundle without rendering it,
 * so pressing "Editar" doesn't wait for the network.
 */
export function preloadPropertyEditor() {
  void loadPropertyForm();
}

/** Placeholder shown while the form bundle or its select options load. */
export function PropertyEditorSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-5" aria-busy="true">
      <span className="sr-only">Cargando editor…</span>
      <Skeleton className="h-6 w-40 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </Card>
  );
}

const PropertyForm = dynamic(() => loadPropertyForm().then((module) => module.PropertyForm), {
  loading: PropertyEditorSkeleton,
});

/**
 * Edit mode of the property detail page. The select options arrive as a
 * promise started on the server alongside the page, so the read view never
 * waits for them; `use()` suspends here only if they're still in flight.
 * Render inside a `<Suspense>` boundary.
 */
export function PropertyEditor({
  property,
  formOptionsPromise,
  openSeo,
}: {
  property: PropertyRecord;
  formOptionsPromise: Promise<PropertyFormOptions>;
  openSeo: boolean;
}) {
  const options = use(formOptionsPromise);
  return <PropertyForm {...options} property={property} openSeo={openSeo} />;
}
