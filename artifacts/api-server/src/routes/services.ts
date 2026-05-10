import { db, services } from "@workspace/db";
import { and, desc, eq, ilike } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { categoryId, search } = req.query as Record<string, string | undefined>;
  try {
    const conditions = [];
    if (categoryId && categoryId !== "all") conditions.push(eq(services.categoryId, categoryId));
    if (search?.trim()) conditions.push(ilike(services.name, `%${search.trim()}%`));

    const rows = await db.select().from(services)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(services.popular), desc(services.rating));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.get("/:id", async (req, res) => {
  const id = String(req.params.id);
  try {
    const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "Service not found" });
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Failed to fetch service" });
  }
});

export default router;
