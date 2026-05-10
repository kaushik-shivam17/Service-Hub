import { db, categories } from "@workspace/db";
import { asc } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.name));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
