import { DashboardPageSkeleton } from "@/components/dashboard/page-skeleton";

/**
 * Instant loading state for every `/dashboard/*` page. Sidebar links prefetch
 * it, so a click swaps to this skeleton immediately (the sidebar stays
 * interactive) while the page's data streams in.
 */
export default function DashboardLoading() {
  return <DashboardPageSkeleton />;
}
