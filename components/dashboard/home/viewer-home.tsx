import { FavoritePropertiesGrid } from "@/components/dashboard/home/favorite-properties-grid";
import { getFavoriteProperties } from "@/lib/favorites/favorites";

/** Account home for viewers: a greeting and the properties they saved. */
export async function ViewerHome({ userId, name }: { userId: string; name: string | null }) {
  const favorites = await getFavoriteProperties(userId).catch(() => null);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{name ? `Hola, ${name.split(" ")[0]}` : "Inicio"}</h1>
        <p className="mt-1 text-sm text-muted">Tus propiedades favoritas.</p>
      </div>

      {favorites ? (
        <FavoritePropertiesGrid properties={favorites} />
      ) : (
        <p className="text-sm text-danger">No pudimos cargar tus favoritos. Intenta de nuevo.</p>
      )}
    </div>
  );
}
