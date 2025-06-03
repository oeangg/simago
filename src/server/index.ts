import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { router } from "./trpc";

export const appRouter = router({
  users: usersRouter,
  Auth: authRouter,
});

export type AppRouter = typeof appRouter;
