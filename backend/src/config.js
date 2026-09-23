import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  topNCoins: Number(process.env.TOP_N_COINS) || 20,
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  coingeckoBaseUrl: "https://api.coingecko.com/api/v3",
  newsFeeds: [
    { source: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
    { source: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  ],
  cacheTtl: {
    marketTop: 300, // 5 min: la cuota free de CoinGecko se agota rápido con varios usuarios
    marketHistory: 600,
    news: 600,
    analysis: 900, // 15 min: el análisis por reglas no cambia tan rápido como el precio
    global: 300,
    trending: 600,
    coinsList: 21600, // 6h: la lista completa de monedas casi no cambia
    coinSearch: 600, // 10 min: resultados de búsqueda por texto
  },
};
