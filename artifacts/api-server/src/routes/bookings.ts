import { bookings, db } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middlewares/authenticate";

const router = Router();

router.use(authenticate);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}(\s?(AM|PM|am|pm))?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NANOID_RE = /^[a-zA-Z0-9_-]{10,40}$/;

function isValidId(id: string): boolean {
  return UUID_RE.test(id) || NANOID_RE.test(id);
}

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, req.userId!))
      .orderBy(desc(bookings.createdAt));
    return res.json(rows.map(toApi));
  } catch {
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  if (!isValidId(id)) return res.status(400).json({ error: "Invalid booking ID" });

  try {
    const [row] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.userId, req.userId!)))
      .limit(1);
    if (!row) return res.status(404).json({ error: "Booking not found" });
    return res.json(toApi(row));
  } catch {
    return res.status(500).json({ error: "Failed to fetch booking" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const body = req.body as Record<string, unknown>;

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const serviceName = typeof body.serviceName === "string" ? body.serviceName.trim().slice(0, 200) : "";
  const categoryName = typeof body.categoryName === "string" ? body.categoryName.trim().slice(0, 100) : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const time = typeof body.time === "string" ? body.time.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 500) : "";
  const rawPrice = body.totalPrice;
  const totalPrice =
    typeof rawPrice === "number" && isFinite(rawPrice) && rawPrice >= 0 && rawPrice <= 1_000_000
      ? Math.round(rawPrice * 100) / 100
      : 0;

  if (!id || !serviceName || !date || !time || !address) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }
  if (!isValidId(id)) {
    return res.status(400).json({ error: "Invalid booking ID format" });
  }
  if (!DATE_RE.test(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }
  if (!TIME_RE.test(time)) {
    return res.status(400).json({ error: "Invalid time format" });
  }

  const serviceId = typeof body.serviceId === "string" && body.serviceId ? body.serviceId.trim().slice(0, 100) : null;
  const providerId = typeof body.providerId === "string" && body.providerId ? body.providerId.trim().slice(0, 100) : null;
  const providerName = typeof body.providerName === "string" && body.providerName ? body.providerName.trim().slice(0, 200) : null;

  try {
    const existing = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.id, id)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "A booking with this ID already exists" });
    }

    const [row] = await db
      .insert(bookings)
      .values({
        id,
        userId: req.userId!,
        serviceId,
        serviceName,
        categoryName,
        providerId,
        providerName,
        date,
        time,
        address,
        status: "upcoming",
        totalPrice,
      })
      .returning();
    return res.status(201).json(toApi(row));
  } catch {
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

router.patch("/:id/cancel", async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  if (!isValidId(id)) return res.status(400).json({ error: "Invalid booking ID" });

  try {
    const [current] = await db
      .select({ status: bookings.status })
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.userId, req.userId!)))
      .limit(1);
    if (!current) return res.status(404).json({ error: "Booking not found" });
    if (current.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }
    if (current.status === "completed") {
      return res.status(400).json({ error: "Completed bookings cannot be cancelled" });
    }

    const [row] = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(and(eq(bookings.id, id), eq(bookings.userId, req.userId!)))
      .returning();
    if (!row) return res.status(404).json({ error: "Booking not found" });
    return res.json(toApi(row));
  } catch {
    return res.status(500).json({ error: "Failed to cancel booking" });
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
