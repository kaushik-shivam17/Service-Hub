import { db, services } from "@workspace/db";
import { and, desc, eq, ilike } from "drizzle-orm";
import { Router } from "express";

const router = Router();

const MAX_SEARCH_LEN = 100;

router.get("/", async (req, res) => {
  const raw = req.query as Record<string, string | undefined>;
  const categoryId = typeof raw.categoryId === "string" ? raw.categoryId.trim().slice(0, 50) : undefined;
  const search = typeof raw.search === "string" ? raw.search.trim().slice(0, MAX_SEARCH_LEN) : undefined;

  try {
    const conditions = [];
    if (categoryId && categoryId !== "all") conditions.push(eq(services.categoryId, categoryId));
    if (search) conditions.push(ilike(services.name, `%${search}%`));

    const rows = await db
      .select()
      .from(services)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(services.popular), desc(services.rating));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.get("/:id", async (req, res) => {
  const id = String(req.params.id).slice(0, 100);
  try {
    const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "Service not found" });
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Failed to fetch service" });
  }
});

export default router;
