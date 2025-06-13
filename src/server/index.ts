import { authRouter } from "./routers/auth";
import { employeeRouter } from "./routers/employee";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  User: userRouter,
  Auth: authRouter,
  Employee: employeeRouter,
});

export type AppRouter = typeof appRouter;
