import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import pathsRouter from "./paths";
import programsRouter from "./programs";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";
import remindersRouter from "./reminders";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(pathsRouter);
router.use(programsRouter);
router.use(tasksRouter);
router.use(dashboardRouter);
router.use(remindersRouter);
router.use(chatRouter);

export default router;
