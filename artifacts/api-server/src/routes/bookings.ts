import { bookings, db } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middlewares/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const rows = await db.select().from(bookings)
      .where(eq(bookings.userId, req.userId!))
      .orderBy(desc(bookings.createdAt));
    return res.json(rows.map(toApi));
  } catch {
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  try {
    const [row] = await db.select().from(bookings)
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
  const id = typeof body.id === "string" ? body.id : undefined;
  const serviceName = typeof body.serviceName === "string" ? body.serviceName : "";
  const categoryName = typeof body.categoryName === "string" ? body.categoryName : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";
  const address = typeof body.address === "string" ? body.address.slice(0, 500) : "";
  const totalPrice = typeof body.totalPrice === "number" ? body.totalPrice : 0;

  if (!id || !serviceName || !date || !time || !address) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  try {
    const [row] = await db.insert(bookings).values({
      id,
      userId: req.userId!,
      serviceId: typeof body.serviceId === "string" ? body.serviceId : null,
      serviceName,
      categoryName,
      providerId: typeof body.providerId === "string" ? body.providerId : null,
      providerName: typeof body.providerName === "string" ? body.providerName : null,
      date,
      time,
      address,
      status: "upcoming",
      totalPrice,
    }).returning();
    return res.status(201).json(toApi(row));
  } catch {
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

router.patch("/:id/cancel", async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  try {
    const [row] = await db.update(bookings)
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
