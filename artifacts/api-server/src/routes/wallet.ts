import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import {
  getOrCreateWallet,
  spend,
  InsufficientFundsError,
} from "../lib/wallet";
import { getAvatarPrice } from "../lib/storeCatalog";

const router: IRouter = Router();

/** The authenticated player's coin + gem balance (grants a wallet if new). */
router.get("/wallet", requireAuth, async (req, res): Promise<void> => {
  const balance = await getOrCreateWallet(req.user!.id);
  res.json(balance);
});

/**
 * Buy an avatar look with the player's currency. The price is resolved
 * server-side from the catalog; the deduction is atomic and idempotent per
 * avatar (retries never double-charge). Returns the updated balance.
 */
router.post(
  "/store/avatars/:avatarId/purchase",
  requireAuth,
  async (req, res): Promise<void> => {
    const avatarId = String(req.params.avatarId);
    const priced = getAvatarPrice(avatarId);
    if (!priced) {
      res.status(404).json({ error: "Unknown avatar" });
      return;
    }

    const userId = req.user!.id;

    if (priced.price <= 0) {
      const balance = await getOrCreateWallet(userId);
      res.json({ ...balance, avatarId, owned: true });
      return;
    }

    try {
      const { balance } = await spend(
        userId,
        priced.currency,
        priced.price,
        `purchase:avatar:${avatarId}`,
        `purchase:avatar:${avatarId}`,
      );
      res.json({ ...balance, avatarId, owned: true });
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        res.status(400).json({
          error: `Not enough ${err.currency} — need ${err.required}, you have ${err.available}`,
        });
        return;
      }
      throw err;
    }
  },
);

export default router;
