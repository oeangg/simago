import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import superjson from "superjson";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

// Solusi untuk menangani data type Decimal dari Prisma
// Date sudah di-handle otomatis oleh SuperJSON, tidak perlu register
superjson.registerClass(Prisma.Decimal, {
  identifier: "PrismaDecimal",
  allowProps: ["d", "e", "s"],
});

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not Authenticated" });
  }
  return next();
});
