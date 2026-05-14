import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let dbStatus = "ok";
  let httpStatus = 200;

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
  } catch {
    dbStatus = "unreachable";
    httpStatus = 503;
  }

  const data = HealthCheckResponse.parse({
    status: httpStatus === 200 ? "ok" : "degraded",
    db: dbStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });

  res.status(httpStatus).json(data);
});

export default router;
