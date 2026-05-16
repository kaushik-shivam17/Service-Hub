import { db, providers, type Provider } from "@workspace/db";
import { desc } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const raw = req.query as Record<string, string | undefined>;
  const categoryName = typeof raw.categoryName === "string" ? raw.categoryName.trim().slice(0, 100) : undefined;

  try {
    const rows = await db.select().from(providers).orderBy(desc(providers.rating));
    if (categoryName) {
      const cat = categoryName.toLowerCase();
      const filtered = rows.filter((p: Provider) =>
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
