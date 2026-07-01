import { Router, type IRouter } from "express";
import { PATHS } from "../lib/paths";

const router: IRouter = Router();

router.get("/paths", async (_req, res): Promise<void> => {
  res.json(
    PATHS.map((p) => ({
      key: p.key,
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      accent: p.accent,
      outcomes: p.outcomes,
    })),
  );
});

export default router;
