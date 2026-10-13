"use client";

import { environmentManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Pages arrive with server-rendered data: don't refetch it straight away on mount.
      queries: { staleTime: 60 * 1000 },
    },
  });
}

let browserQueryClient: { userId: string; client: QueryClient } | undefined;

/**
 * A fresh client per server render (so users never share a cache) and a
 * single one in the browser (so it survives Suspense re-renders). The
 * browser client is replaced when the signed-in user changes: signing out
 * is a client-side navigation, and cached data is scoped per user.
 */
function getQueryClient(userId: string) {
  if (environmentManager.isServer()) return makeQueryClient();
  if (browserQueryClient?.userId !== userId) {
    browserQueryClient?.client.clear();
    browserQueryClient = { userId, client: makeQueryClient() };
  }
  return browserQueryClient.client;
}

/** TanStack Query for client-side data fetching and mutations. Devtools render in development only. */
export function QueryProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const queryClient = getQueryClient(userId);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
