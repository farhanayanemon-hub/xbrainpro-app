import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import playerRouter from "./player";
import npcRouter from "./npc";
import adminRouter from "./admin";
import worldRouter from "./world";
import assetsRouter from "./assets";
import friendsRouter from "./friends";
import dmRouter from "./dm";
import moderationRouter from "./moderation";
import walletRouter from "./wallet";
import engagementRouter from "./engagement";
import apartmentRouter from "./apartment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(playerRouter);
router.use(npcRouter);
router.use(adminRouter);
router.use(worldRouter);
router.use(assetsRouter);
router.use(friendsRouter);
router.use(dmRouter);
router.use(moderationRouter);
router.use(walletRouter);
router.use(engagementRouter);
router.use(apartmentRouter);

export default router;
