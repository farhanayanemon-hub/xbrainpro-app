import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { getVipStatus, purchaseVip } from "../lib/vip";
import { InsufficientFundsError } from "../lib/wallet";

const router: IRouter = Router();

/** The authenticated player's VIP status (active flag, expiry, offer terms). */
router.get("/vip", requireAuth, async (req, res): Promise<void> => {
  const status = await getVipStatus(req.user!.id);
  res.json(status);
});

/**
 * Buy (or extend) VIP with gems. Atomic and server-authoritative: charges the
 * gem cost and pushes the expiry forward, stacking onto any remaining time.
 * Rejects with 400 when the player can't afford it.
 */
router.post("/vip/purchase", requireAuth, async (req, res): Promise<void> => {
  try {
    const result = await purchaseVip(req.user!.id);
    res.json(result);
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      res.status(400).json({
        error: `Not enough gems — need ${err.required}, you have ${err.available}`,
      });
      return;
    }
    throw err;
  }
});

export default router;
