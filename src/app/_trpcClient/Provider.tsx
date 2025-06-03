"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";

import { trpc } from "./client";

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.PRODUCTION_URL)
      return `https://${process.env.PRODUCTION_ULR}`;
    return "http://localhost:3000/";
  })();
  return `${base}/api/trpc`;
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({}));
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
          url: getUrl(),
        }),
      ],
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
