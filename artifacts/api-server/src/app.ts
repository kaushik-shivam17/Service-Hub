import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

function buildAllowedOrigins(): (string | RegExp)[] {
  const always: RegExp[] = [
    /\.replit\.dev$/,
    /\.repl\.co$/,
    /\.vercel\.app$/,
    /\.pike\.repl\.co$/,
  ];
  const fromEnv = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : ["http://localhost:3000", "http://localhost:8080"];
  return [...fromEnv, ...always];
}

const allowedOrigins = buildAllowedOrigins();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      if (allowed) return callback(null, true);
      const err = new Error("Not allowed by CORS") as Error & { expose?: boolean };
      err.expose = false;
      callback(err);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => req.method === "OPTIONS",
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: { id: string | number; method: string; url?: string }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: { statusCode: number }) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.disable("x-powered-by");

app.use("/api", router);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    err: NodeJS.ErrnoException & { status?: number; statusCode?: number; type?: string; expose?: boolean },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const statusCode = err.status ?? err.statusCode ?? 500;

    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (statusCode === 413) {
      return res.status(413).json({ error: "Payload too large. Maximum size is 1MB." });
    }
    if (statusCode >= 400 && statusCode < 500 && err.expose) {
      return res.status(statusCode).json({ error: err.message || "Bad request" });
    }
    logger.error({ err }, "Unhandled error");
    return res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
