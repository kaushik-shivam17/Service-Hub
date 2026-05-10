import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { hashPassword, signToken, verifyPassword } from "../lib/auth";
import { authenticate, AuthenticatedRequest } from "../middlewares/authenticate";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  const { email, password, name, phone } = req.body as Record<string, string>;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters" });
  }

  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim() || null,
    }).returning({ id: users.id, email: users.email, name: users.name, phone: users.phone });

    const token = signToken({ sub: user.id, email: user.email });
    return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
  } catch {
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as Record<string, string>;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ sub: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
  } catch {
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.get("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name, phone: users.phone })
      .from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  const { name, phone } = req.body as Record<string, string>;
  const updates: Partial<typeof users.$inferInsert> = {};
  if (name !== undefined) {
    if (name.trim().length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
    updates.name = name.trim();
  }
  if (phone !== undefined) updates.phone = phone?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const [user] = await db.update(users).set(updates).where(eq(users.id, req.userId!))
      .returning({ id: users.id, email: users.email, name: users.name, phone: users.phone });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
