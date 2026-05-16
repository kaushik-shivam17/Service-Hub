import { bookings, db, users } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middlewares/authenticate";

const router = Router();

router.use(authenticate);

const VALID_TRANSITIONS: Record<string, string[]> = {
  upcoming: ["in_progress", "cancelled"],
  in_progress: ["completed"],
};

const ALL_VALID_STATUSES = new Set(
  Object.values(VALID_TRANSITIONS).flat().concat(Object.keys(VALID_TRANSITIONS))
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NANOID_RE = /^[a-zA-Z0-9_-]{10,40}$/;
function isValidId(id: string): boolean {
  return UUID_RE.test(id) || NANOID_RE.test(id);
}

router.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        workerProviderId: users.workerProviderId,
      })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "worker") return res.status(403).json({ error: "Not a worker account" });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to fetch worker profile" });
  }
});

router.get("/bookings", async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select({ role: users.role, workerProviderId: users.workerProviderId })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user || user.role !== "worker") return res.status(403).json({ error: "Not a worker account" });
    if (!user.workerProviderId) return res.json([]);

    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.providerId, user.workerProviderId))
      .orderBy(desc(bookings.createdAt));
    return res.json(rows.map(toApi));
  } catch {
    return res.status(500).json({ error: "Failed to fetch worker bookings" });
  }
});

router.patch("/bookings/:id/status", async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  if (!isValidId(id)) return res.status(400).json({ error: "Invalid booking ID" });

  const body = req.body as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status.trim() : "";

  if (!status) return res.status(400).json({ error: "status is required" });
  if (!ALL_VALID_STATUSES.has(status)) {
    return res.status(400).json({
      error: `Invalid status value '${status}'. Allowed: ${[...ALL_VALID_STATUSES].join(", ")}`,
    });
  }

  try {
    const [user] = await db
      .select({ role: users.role, workerProviderId: users.workerProviderId })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user || user.role !== "worker") return res.status(403).json({ error: "Not a worker account" });
    if (!user.workerProviderId) return res.status(403).json({ error: "No provider linked" });

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.providerId, user.workerProviderId)))
      .limit(1);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const allowed = VALID_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${booking.status}' to '${status}'`,
      });
    }

    const [updated] = await db
      .update(bookings)
      .set({ status })
      .where(and(eq(bookings.id, id), eq(bookings.providerId, user.workerProviderId)))
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
