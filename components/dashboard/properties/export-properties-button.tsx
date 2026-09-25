"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Download } from "lucide-react";

import { exportProperties, type ExportPropertiesResult } from "@/app/actions/export-properties";
import { useToast } from "@/components/providers/toast-provider";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function downloadFile(fileName: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: XLSX_MIME }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function ExportButtonView({
  isPending = false,
  onPress,
  error,
}: {
  isPending?: boolean;
  onPress?: () => void;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        isPending={isPending}
        isDisabled={isPending}
        onPress={onPress}
      >
        {isPending ? (
          <>
            <Spinner size="sm" color="current" />
            Exportando…
          </>
        ) : (
          <>
            <Download className="size-4" />
            Exportar propiedades
          </>
        )}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

/**
 * Suspends on the export promise via `use()`, so while the server action runs
 * the surrounding <Suspense> shows its fallback: the button in its loading state.
 */
function ExportAction({
  promise,
  onExport,
}: {
  promise: Promise<ExportPropertiesResult> | null;
  onExport: () => void;
}) {
  const result = promise ? use(promise) : null;
  const toast = useToast();
  // Guards against Strict Mode re-running the effect and downloading/notifying twice.
  const handled = useRef<ExportPropertiesResult | null>(null);

  useEffect(() => {
    if (!result || handled.current === result) return;
    handled.current = result;
    if (!result.success) {
      toast.error("No se pudo exportar", result.error);
      return;
    }
    try {
      downloadFile(result.fileName, result.base64);
      toast.success("Exportación completada", `Se ha descargado ${result.fileName}`);
    } catch {
      toast.error("No se pudo exportar", "No se pudo descargar el archivo.");
    }
  }, [result, toast]);

  return <ExportButtonView onPress={onExport} error={result?.success === false ? result.error : null} />;
}

export function ExportPropertiesButton() {
  const [promise, setPromise] = useState<Promise<ExportPropertiesResult> | null>(null);

  // Deliberately not wrapped in startTransition: a plain state update lets the
  // Suspense fallback show instead of React holding the previous UI.
  function handleExport() {
    setPromise(
      exportProperties().catch(() => ({
        success: false as const,
        error: "No se pudieron exportar las propiedades.",
      })),
    );
  }

  return (
    <Suspense fallback={<ExportButtonView isPending />}>
      <ExportAction promise={promise} onExport={handleExport} />
    </Suspense>
  );
}
