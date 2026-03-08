import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { getLoginUrl } from "./const";
import "./index.css";
import "./styles/theme-dark-premium.css";
import "./styles/theme-light.css";

// LIGHTSPEED: React Query SWR configuration for sub-100ms perceived loads
// Data stays "fresh" for 5 min (no refetch), then serves stale while revalidating in background
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min — data is "fresh", no refetch
      gcTime: 30 * 60 * 1000,           // 30 min — keep unused data in cache
      refetchOnWindowFocus: false,       // Don't refetch on tab switch
      refetchOnReconnect: "always",      // Always refetch after disconnect
      retry: 1,                          // Fast fail — don't retry 3x
      retryDelay: 500,                   // Quick retry
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Add test user header if in testing mode
        const testUser = localStorage.getItem('test_user');
        const headers: Record<string, string> = {
          ...(init?.headers as Record<string, string> || {}),
        };
        
        if (testUser) {
          headers['x-test-user'] = testUser;
        }
        
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers,
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
