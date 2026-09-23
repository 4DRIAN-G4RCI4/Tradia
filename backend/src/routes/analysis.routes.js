import { Router } from "express";
import { getTopCoins, getCoinById } from "../services/coingecko.service.js";
import { getNews, getNewsForCoin } from "../services/news.service.js";
import { analyzeCoin, analyzeMarket } from "../services/analysis.service.js";
import cache, { getOrFetch } from "../services/cache.service.js";
import { config } from "../config.js";

const router = Router();

function buildAnalysis(summary, coinId = null) {
  return {
    coinId,
    generatedAt: new Date().toISOString(),
    summary,
    disclaimer: "Esto no constituye asesoria financiera. DYOR.",
  };
}

// Lectura pasiva: devuelve el análisis en caché si existe, sin generar uno nuevo.
// Así el frontend puede recuperar el último análisis al montar sin gastar cómputo.
router.get("/coin/:id", (req, res) => {
  const cached = cache.get(`analysis:coin:${req.params.id}`);
  res.json(cached ?? null);
});

router.get("/market", (req, res) => {
  const cached = cache.get("analysis:market");
  res.json(cached ?? null);
});

router.post("/coin/:id", async (req, res, next) => {
  try {
    const coin = await getCoinById(req.params.id);
    if (!coin) {
      return res.status(404).json({ error: { message: "Moneda no encontrada", code: "COIN_NOT_FOUND" } });
    }
    const analysis = await getOrFetch(`analysis:coin:${coin.id}`, config.cacheTtl.analysis, async () => {
      const news = await getNewsForCoin(coin.name, coin.symbol);
      return buildAnalysis(analyzeCoin(coin, news), coin.id);
    });
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

router.post("/market", async (req, res, next) => {
  try {
    const analysis = await getOrFetch("analysis:market", config.cacheTtl.analysis, async () => {
      const coins = await getTopCoins();
      const news = await getNews();
      return buildAnalysis(analyzeMarket(coins, news));
    });
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

export default router;
