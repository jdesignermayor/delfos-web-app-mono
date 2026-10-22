import type { Metadata } from "next";

import { RecentViewsView } from "@/components/favorites/recent-views-view";

export const metadata: Metadata = {
  title: "Vistos recientemente",
  robots: { index: false, follow: false },
};

/** Static shell: the list is per user, so it's loaded from the client. */
export default function RecentViewsPage() {
  return <RecentViewsView />;
}
