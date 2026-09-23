import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { getCacheStats } from "./services/cache.service.js";
import marketRoutes from "./routes/market.routes.js";
import newsRoutes from "./routes/news.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";

const app = express();

const rateLimitedResponse = (req, res) => {
  res.status(429).json({
    error: { message: "Demasiadas peticiones. Intenta de nuevo en unos segundos.", code: "RATE_LIMITED" },
  });
};

const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});

const strictLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});

app.disable("x-powered-by");
app.use(express.json());

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}
app.use(securityHeaders);

const allowedOrigins = (config.corsOrigins || [])
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  })
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", cacheStats: getCacheStats() });
});

app.use("/api", globalLimiter);
app.use("/api/market/search", strictLimiter);
app.use("/api/analysis", strictLimiter);

app.use("/api/market", marketRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/analysis", analysisRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: "Ruta no encontrada", code: "NOT_FOUND" } });
});

app.use((err, req, res, next) => {
  console.error("[server] error:", err);
  const upstreamStatus = err.response?.status;

  if (upstreamStatus === 429) {
    return res.status(429).json({
      error: {
        message: "Límite de peticiones a CoinGecko alcanzado. Intenta de nuevo en unos segundos.",
        code: "UPSTREAM_RATE_LIMITED",
      },
    });
  }

  const status = upstreamStatus && upstreamStatus >= 400 ? 502 : err.status || 500;
  res.status(status).json({
    error: {
      message: "Error interno del servidor",
      code: "INTERNAL_ERROR",
    },
  });
});

app.listen(config.port, () => {
  console.log(`Tradia backend escuchando en http://localhost:${config.port}`);
});
