import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";

export const userRouter = router({
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany();

    return users;
  }),

  getUserbyId: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userById = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
        },
        select: {
          fullname: true,
          email: true,
          profilPic: true,
          role: true,
        },
      });

      return userById;
    }),

  updateRoleUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(Role).default(Role.USER),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.user.update({
          where: {
            id: input.userId,
          },
          data: {
            role: input.role,
          },
        });
        return { message: "Berhasil update Role User!" };
      } catch {
        throw new TRPCError({
          code: "PARSE_ERROR",
          message: "Gagal Update Role",
        });
      }
    }),

  updateStatusActiveUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.user.update({
          where: {
            id: input.userId,
          },
          data: {
            isActive: input.status,
          },
        });
        return { message: "Berhasil update Status User!" };
      } catch {
        throw new TRPCError({
          code: "PARSE_ERROR",
          message: "Gagal Update Status",
        });
      }
    }),
});
