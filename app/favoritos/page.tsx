import type { Metadata } from "next";

import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: false },
};

/** Static shell: the lists are per user, so they're loaded from the client. */
export default function FavoritesPage() {
  return <FavoritesView />;
}
