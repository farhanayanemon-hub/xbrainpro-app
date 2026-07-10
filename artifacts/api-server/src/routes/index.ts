import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import playerRouter from "./player";
import npcRouter from "./npc";
import adminRouter from "./admin";
import worldRouter from "./world";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(playerRouter);
router.use(npcRouter);
router.use(adminRouter);
router.use(worldRouter);

export default router;
