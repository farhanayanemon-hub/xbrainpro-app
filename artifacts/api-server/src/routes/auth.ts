import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, profilesTable, programsTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  resolveUser,
} from "../lib/auth";
import { serializeUser } from "../lib/serialize";

const router: IRouter = Router();

const SESSION_COOKIE = "xbp_session";

async function userState(userId: number): Promise<{
  hasProgram: boolean;
  onboarded: boolean;
}> {
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));
  const programs = await db
    .select({ id: programsTable.id })
    .from(programsTable)
    .where(eq(programsTable.userId, userId));
  return {
    hasProgram: programs.length > 0,
    onboarded: profile?.onboarded ?? false,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name: parsed.data.name.trim() })
    .returning();

  await db.insert(profilesTable).values({ userId: user.id });

  const token = await createSession(user.id);
  setSessionCookie(res, token);

  res.status(201).json({
    user: serializeUser(user, false, false),
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const state = await userState(user.id);
  const token = await createSession(user.id);
  setSessionCookie(res, token);

  res.json({
    user: serializeUser(user, state.hasProgram, state.onboarded),
    token,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
    SESSION_COOKIE
  ];
  const header = req.headers.authorization;
  const token =
    cookieToken ||
    (header?.startsWith("Bearer ") ? header.slice(7).trim() : null);
  if (token) {
    await destroySession(token);
  }
  clearSessionCookie(res);
  res.sendStatus(204);
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const state = await userState(user.id);
  res.json(serializeUser(user, state.hasProgram, state.onboarded));
});

export default router;
