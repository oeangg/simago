"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";

import { trpc } from "./client";
import superjson from "superjson";
import { Prisma } from "@prisma/client";

// Register Prisma Decimal untuk serialization/deserialization
superjson.registerClass(Prisma.Decimal, {
  identifier: "PrismaDecimal",
  allowProps: ["d", "e", "s"],
});

// Date sudah di-handle otomatis oleh SuperJSON, tidak perlu custom handler

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.PRODUCTION_URL)
      return `https://${process.env.PRODUCTION_URL}`;
    return "http://localhost:3000/";
  })();
  return `${base}/api/trpc`;
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (dulu namanya cacheTime)
            refetchOnWindowFocus: false, // Optional: disable refetch on window focus
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getUrl(),
          // Transformer dipindahkan ke dalam httpBatchLink di v10+
          transformer: superjson,
          // Optional: Add headers if needed
          headers() {
            return {
              // Add any headers here
            };
          },
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
