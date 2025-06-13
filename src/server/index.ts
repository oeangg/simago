import { authRouter } from "./routers/auth";
import { employeeRouter } from "./routers/employee";
import { employmentRouter } from "./routers/employment";
import { positionRouter } from "./routers/position";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  User: userRouter,
  Auth: authRouter,
  Employee: employeeRouter,
  Employment: employmentRouter,
  Position: positionRouter,
});

export type AppRouter = typeof appRouter;
