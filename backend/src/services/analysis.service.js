import { formatUsd, formatPct } from "../utils/formatters.js";

const POSITIVE_WORDS = [
  "surge", "rally", "gain", "gains", "bullish", "soar", "soars", "jump", "jumps",
  "record", "high", "growth", "adopt", "adoption", "approval", "approved",
  "partnership", "breakthrough", "recovery", "up",
];
const NEGATIVE_WORDS = [
  "crash", "plunge", "plunges", "drop", "drops", "bearish", "sell-off", "selloff",
  "hack", "hacked", "fraud", "ban", "banned", "lawsuit", "decline", "fear",
  "collapse", "warning", "down", "loss", "losses",
];

function scoreSentiment(newsItems) {
  let score = 0;
  for (const item of newsItems) {
    const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
    for (const w of POSITIVE_WORDS) if (text.includes(w)) score += 1;
    for (const w of NEGATIVE_WORDS) if (text.includes(w)) score -= 1;
  }
  if (score >= 2) return { label: "positivo", score };
  if (score <= -2) return { label: "negativo", score };
  return { label: "neutral", score };
}

function trendLabel(pct24h, pct7d) {
  const avg = ((pct24h ?? 0) + (pct7d ?? 0)) / 2;
  if (avg >= 5) return "fuertemente alcista";
  if (avg >= 1) return "alcista";
  if (avg <= -5) return "fuertemente bajista";
  if (avg <= -1) return "bajista";
  return "lateral/neutral";
}

function sentimentSentence(sentiment, newsCount) {
  if (newsCount === 0) {
    return "No se encontraron noticias recientes relevantes para evaluar el sentimiento del mercado.";
  }
  if (sentiment.label === "positivo") {
    return `El sentimiento en las noticias recientes analizadas es mayormente positivo, con menciones de crecimiento, adopcion o buenos resultados.`;
  }
  if (sentiment.label === "negativo") {
    return `El sentimiento en las noticias recientes analizadas es mayormente negativo, con menciones de caidas, incertidumbre o eventos adversos.`;
  }
  return `El sentimiento en las noticias recientes analizadas es mixto o neutral, sin una inclinacion clara hacia lo positivo o lo negativo.`;
}

function recommendationSentence(trend, sentiment) {
  return "Esta informacion es unicamente educativa e informativa, generada a partir de datos publicos de mercado y noticias mediante reglas automaticas (sin inteligencia artificial generativa). No constituye asesoria financiera ni recomendacion de inversion. Realiza tu propia investigacion (DYOR) y consulta a un asesor financiero certificado antes de tomar decisiones.";
}

export function analyzeCoin(coin, newsItems) {
  const trend = trendLabel(coin.priceChangePct24h, coin.priceChangePct7d);
  const sentiment = scoreSentiment(newsItems);

  const paragraphs = [
    `${coin.name} (${coin.symbol.toUpperCase()}) cotiza actualmente en ${formatUsd(
      coin.currentPrice
    )}, con una variacion de ${formatPct(coin.priceChangePct24h)} en las ultimas 24 horas y ${formatPct(
      coin.priceChangePct7d
    )} en los ultimos 7 dias. Segun estos datos, la tendencia reciente es ${trend}, con un market cap de ${formatUsd(
      coin.marketCap
    )} (rank #${coin.marketCapRank}) y un volumen de ${formatUsd(coin.totalVolume)} en 24h.`,
    sentimentSentence(sentiment, newsItems.length),
    recommendationSentence(trend, sentiment),
  ];

  return paragraphs.join("\n\n");
}

export function analyzeMarket(coins, newsItems) {
  const avgPct24h =
    coins.reduce((sum, c) => sum + (c.priceChangePct24h ?? 0), 0) / (coins.length || 1);
  const avgPct7d =
    coins.reduce((sum, c) => sum + (c.priceChangePct7d ?? 0), 0) / (coins.length || 1);
  const trend = trendLabel(avgPct24h, avgPct7d);
  const sentiment = scoreSentiment(newsItems);

  const gainers = coins.filter((c) => (c.priceChangePct24h ?? 0) > 0).length;
  const losers = coins.length - gainers;

  const paragraphs = [
    `El mercado de criptomonedas (top ${coins.length} por market cap) muestra una tendencia general ${trend}, con una variacion promedio de ${formatPct(
      avgPct24h
    )} en 24h y ${formatPct(avgPct7d)} en 7 dias. De las monedas analizadas, ${gainers} estan en positivo y ${losers} en negativo en las ultimas 24 horas.`,
    sentimentSentence(sentiment, newsItems.length),
    recommendationSentence(trend, sentiment),
  ];

  return paragraphs.join("\n\n");
}
