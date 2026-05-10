import { Router, type IRouter } from "express";
import authRouter from "./auth";
import bookingsRouter from "./bookings";
import categoriesRouter from "./categories";
import healthRouter from "./health";
import providersRouter from "./providers";
import servicesRouter from "./services";
import workerRouter from "./worker";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/services", servicesRouter);
router.use("/providers", providersRouter);
router.use("/bookings", bookingsRouter);
router.use("/worker", workerRouter);

export default router;
