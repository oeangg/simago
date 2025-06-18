import { authRouter } from "./routers/auth";
import { cityRouter } from "./routers/city";
import { customerRouter } from "./routers/customer";
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
  Customer: customerRouter,
  City: cityRouter,
});

export type AppRouter = typeof appRouter;
