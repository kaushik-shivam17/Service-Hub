import { db, providers } from "@workspace/db";
import { desc } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { categoryName } = req.query as Record<string, string | undefined>;
  try {
    const rows = await db.select().from(providers).orderBy(desc(providers.rating));
    if (categoryName?.trim()) {
      const cat = categoryName.trim().toLowerCase();
      const filtered = rows.filter((p) =>
        p.specializations.some(
          (s: string) => s.toLowerCase().includes(cat) || cat.includes(s.toLowerCase())
        )
      );
      return res.json(filtered.length > 0 ? filtered : rows.slice(0, 4));
    }
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Failed to fetch providers" });
  }
});

export default router;
