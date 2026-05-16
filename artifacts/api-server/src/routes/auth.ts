import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { hashPassword, signToken, verifyPassword } from "../lib/auth";
import { authenticate, AuthenticatedRequest } from "../middlewares/authenticate";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;
const MAX_NAME_LEN = 100;
const MAX_PHONE_LEN = 20;
const MAX_PASSWORD_LEN = 128;

router.post("/register", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }
  if (email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return res.status(400).json({ error: "Password must be at most 128 characters" });
  }
  if (name.length < 2 || name.length > MAX_NAME_LEN) {
    return res.status(400).json({ error: "Name must be between 2 and 100 characters" });
  }
  if (phone && phone.length > MAX_PHONE_LEN) {
    return res.status(400).json({ error: "Phone number is too long" });
  }

  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        phone: phone || null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        workerProviderId: users.workerProviderId,
      });

    const token = signToken({ sub: user.id, email: user.email });
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, workerProviderId: user.workerProviderId },
    });
  } catch {
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ sub: user.id, email: user.email });
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, workerProviderId: user.workerProviderId },
    });
  } catch {
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.get("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, phone: users.phone, role: users.role, workerProviderId: users.workerProviderId })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof users.$inferInsert> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > MAX_NAME_LEN) {
      return res.status(400).json({ error: "Name must be between 2 and 100 characters" });
    }
    updates.name = name;
  }
  if (body.phone !== undefined) {
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (phone && phone.length > MAX_PHONE_LEN) {
      return res.status(400).json({ error: "Phone number is too long" });
    }
    updates.phone = phone || null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, req.userId!))
      .returning({ id: users.id, email: users.email, name: users.name, phone: users.phone, role: users.role, workerProviderId: users.workerProviderId });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
