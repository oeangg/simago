import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const usersRouter = router({
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
});
