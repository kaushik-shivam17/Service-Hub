import { bookings, db, users } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middlewares/authenticate";

const router = Router();

router.use(authenticate);

router.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      workerProviderId: users.workerProviderId,
    }).from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "worker") return res.status(403).json({ error: "Not a worker account" });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to fetch worker profile" });
  }
});

router.get("/bookings", async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db.select({ role: users.role, workerProviderId: users.workerProviderId })
      .from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user || user.role !== "worker") return res.status(403).json({ error: "Not a worker account" });
    if (!user.workerProviderId) return res.json([]);

    const rows = await db.select().from(bookings)
      .where(eq(bookings.providerId, user.workerProviderId))
      .orderBy(desc(bookings.createdAt));
    return res.json(rows.map(toApi));
  } catch {
    return res.status(500).json({ error: "Failed to fetch worker bookings" });
  }
});

router.patch("/bookings/:id/status", async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const { status } = req.body as { status: string };

  const VALID_TRANSITIONS: Record<string, string[]> = {
    upcoming: ["in_progress", "cancelled"],
    in_progress: ["completed"],
  };

  if (!status) return res.status(400).json({ error: "status is required" });

  try {
    const [user] = await db.select({ role: users.role, workerProviderId: users.workerProviderId })
      .from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user || user.role !== "worker") return res.status(403).json({ error: "Not a worker account" });
    if (!user.workerProviderId) return res.status(403).json({ error: "No provider linked" });

    const [booking] = await db.select().from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.providerId, user.workerProviderId)))
      .limit(1);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const allowed = VALID_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${booking.status}' to '${status}'`,
      });
    }

    const [updated] = await db.update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return res.json(toApi(updated));
  } catch {
    return res.status(500).json({ error: "Failed to update booking status" });
  }
});

function toApi(row: typeof bookings.$inferSelect) {
  return {
    id: row.id,
    serviceId: row.serviceId ?? "",
    serviceName: row.serviceName,
    categoryName: row.categoryName,
    providerId: row.providerId ?? undefined,
    providerName: row.providerName ?? undefined,
    date: row.date,
    time: row.time,
    address: row.address,
    status: row.status,
    totalPrice: row.totalPrice,
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
