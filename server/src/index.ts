/**
 * HTTP entrypoint. Hono corriendo sobre @hono/node-server.
 *
 * Capas:
 *   1. Provider (RenfeLongDistanceProvider) habla con la API origen.
 *   2. TtlCache coalesce las peticiones y les pone TTL.
 *   3. Rutas Hono exponen la API normalizada al cliente.
 */

import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { TtlCache } from "./cache.js";
import { previewHtml } from "./preview.js";
import { getDemoTrains } from "./providers/demoData.js";
import { RenfeLongDistanceProvider } from "./providers/renfeLongDistance.js";
import type { ApiError, LiveTrain, TrainDetail } from "./types.js";

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? "*").split(",").map((s) => s.trim());
const FLOTA_URL =
  process.env.RENFE_FLOTA_URL ??
  "https://tiempo-real.largorecorrido.renfe.com/data/flotaLD.json";
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 10_000);
const USER_AGENT = process.env.UPSTREAM_USER_AGENT ?? "Trenfai/0.1";
const DEMO_MODE = process.env.DEMO_MODE === "true";

const renfe = new RenfeLongDistanceProvider({
  flotaUrl: FLOTA_URL,
  userAgent: USER_AGENT,
});

async function loadTrains(): Promise<LiveTrain[]> {
  if (DEMO_MODE) return getDemoTrains();
  try {
    return await renfe.fetchLiveTrains();
  } catch (err) {
    console.warn("[upstream] Falling back to demo data:", err instanceof Error ? err.message : err);
    return getDemoTrains();
  }
}

const fleetCache = new TtlCache<LiveTrain[]>(CACHE_TTL_MS, loadTrains);

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: CORS_ORIGIN.includes("*") ? "*" : CORS_ORIGIN,
    allowMethods: ["GET", "OPTIONS"],
  }),
);

app.get("/", (c) => c.html(previewHtml(`http://localhost:${PORT}`)));

app.get("/health", (c) =>
  c.json({ ok: true, service: "trenfai-server", time: new Date().toISOString() }),
);

app.get("/api/trains/live", async (c) => {
  try {
    const trains = await fleetCache.get();
    // `stale-while-revalidate` en cliente; el backend ya hace su cache.
    c.header("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
    return c.json({ count: trains.length, trains });
  } catch (err) {
    return upstreamError(c, err);
  }
});

app.get("/api/trains/:code", async (c) => {
  const code = c.req.param("code");
  try {
    const trains = await fleetCache.get();
    const train = trains.find((t) => t.code === code);
    if (!train) {
      const body: ApiError = {
        error: { code: "not_found", message: `Train ${code} not active` },
      };
      return c.json(body, 404);
    }
    // Para el detalle, el MVP solo tiene las paradas previa y siguiente.
    // Cuando integremos GTFS estático, rellenaremos `stops`.
    const detail: TrainDetail = {
      ...train,
      stops: [train.previousStop, train.nextStop].filter((s) => s !== null),
    };
    return c.json(detail);
  } catch (err) {
    return upstreamError(c, err);
  }
});

app.notFound((c) => {
  const body: ApiError = { error: { code: "not_found", message: "Route not found" } };
  return c.json(body, 404);
});

app.onError((err, c) => {
  console.error("[unhandled]", err);
  const body: ApiError = { error: { code: "internal", message: "Internal error" } };
  return c.json(body, 500);
});

function upstreamError(c: Context, err: unknown) {
  console.error("[upstream]", err);
  const body: ApiError = {
    error: {
      code: "upstream_unavailable",
      message: err instanceof Error ? err.message : "Upstream request failed",
    },
  };
  return c.json(body, 502);
}

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`trenfai-server listening on http://localhost:${info.port}`);
});
