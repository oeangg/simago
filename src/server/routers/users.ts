import { publicProcedure, router } from "../trpc";
import { db } from "@/lib/prisma";

export const usersRouter = router({
  getUsers: publicProcedure.query(async () => {
    const users = await db.user.findMany();

    return users;
  }),
});
