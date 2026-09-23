import { Router } from "express";
import {
  getTopCoins,
  getCoinById,
  getCoinHistory,
  getGlobalStats,
  getTrendingCoins,
  getAllCoinsList,
  searchCoins,
} from "../services/coingecko.service.js";
import { getBinanceHistory, isSupportedByBinance } from "../services/binance.service.js";

const router = Router();
const MAX_PER_PAGE = 250;
const MAX_DAYS = 365;
const MAX_QUERY_LENGTH = 100;

function toPositiveInt(value, fallback, max) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

router.get("/top", async (req, res, next) => {
  try {
    const limit = toPositiveInt(req.query.limit, undefined, MAX_PER_PAGE);
    const coins = await getTopCoins(limit);
    res.json(coins);
  } catch (err) {
    next(err);
  }
});

router.get("/global", async (req, res, next) => {
  try {
    const stats = await getGlobalStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get("/trending", async (req, res, next) => {
  try {
    const trending = await getTrendingCoins();
    res.json(trending);
  } catch (err) {
    next(err);
  }
});

router.get("/all", async (req, res, next) => {
  try {
    const coins = await getAllCoinsList();
    res.json(coins);
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const query = req.query.q?.trim().slice(0, MAX_QUERY_LENGTH);
    if (!query) return res.json([]);
    const results = await searchCoins(query);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/history", async (req, res, next) => {
  try {
    const days = toPositiveInt(req.query.days, 7, MAX_DAYS);
    const { id } = req.params;

    if (isSupportedByBinance(id)) {
      try {
        const history = await getBinanceHistory(id, days);
        if (history) {
          return res.json({ ...history, source: "binance" });
        }
      } catch (err) {
        // Binance falló para este par puntual: seguimos con CoinGecko como respaldo.
        console.error(`[market] Binance history falló para ${id}:`, err.response?.status, err.response?.data || err.message);
      }
    }

    const history = await getCoinHistory(id, days);
    res.json({ ...history, source: "coingecko" });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const coin = await getCoinById(req.params.id);
    if (!coin) {
      return res.status(404).json({ error: { message: "Moneda no encontrada", code: "COIN_NOT_FOUND" } });
    }
    res.json(coin);
  } catch (err) {
    next(err);
  }
});

export default router;
