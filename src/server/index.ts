import { authRouter } from "./routers/auth";
import { cityRouter } from "./routers/city";
import { customerRouter } from "./routers/customer";
import { divisionRouter } from "./routers/division";
import { driverRouter } from "./routers/driver";
import { employeeRouter } from "./routers/employee";
import { employmentRouter } from "./routers/employment";
import { materialRouter } from "./routers/material";
import { materialInRouter } from "./routers/materialIn";
import { positionRouter } from "./routers/position";
import { supplierRouter } from "./routers/supplier";
import { surveyRouter } from "./routers/survey";
import { userRouter } from "./routers/user";
import { vehicleRouter } from "./routers/vehicle";
import { vendorRouter } from "./routers/vendor";
import { router } from "./trpc";

export const appRouter = router({
  Auth: authRouter,
  User: userRouter,
  Customer: customerRouter,
  City: cityRouter,
  Employee: employeeRouter,
  Employment: employmentRouter,
  Position: positionRouter,
  Division: divisionRouter,
  Supplier: supplierRouter,
  Driver: driverRouter,
  Vendor: vendorRouter,
  Vehicle: vehicleRouter,
  Material: materialRouter,
  MaterialIn: materialInRouter,
  survey: surveyRouter,
});

export type AppRouter = typeof appRouter;
