import { authRouter } from "./routers/auth";
import { cityRouter } from "./routers/city";
import { customerRouter } from "./routers/customer";
import { employeeRouter } from "./routers/employee";
import { employmentRouter } from "./routers/employment";
import { positionRouter } from "./routers/position";
import { supplierRouter } from "./routers/supplier";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  Auth: authRouter,
  User: userRouter,
  Customer: customerRouter,
  City: cityRouter,
  Employee: employeeRouter,
  Employment: employmentRouter,
  Position: positionRouter,
  Supplier: supplierRouter,
});

export type AppRouter = typeof appRouter;
