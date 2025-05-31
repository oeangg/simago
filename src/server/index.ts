import { authLoginRouter, authRegisterRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { router } from "./trpc";

export const appRouter = router({
  users: usersRouter,
  Register: authRegisterRouter,
  Login: authLoginRouter,
});

export type AppRouter = typeof appRouter;
