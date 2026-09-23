import axios from "axios";
import { getOrFetch } from "./cache.service.js";
import { config } from "../config.js";

const client = axios.create({ baseURL: "https://api.binance.com/api/v3", timeout: 8000 });

// Mapa de ids de CoinGecko (los que usa el resto de la app) a símbolos de Binance.
// Solo se listan pares que realmente cotizan en Binance contra USDT.
const COINGECKO_ID_TO_BINANCE_SYMBOL = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  tether: null, // USDT no cotiza contra sí mismo en Binance; se resuelve vía CoinGecko
  ripple: "XRPUSDT",
  binancecoin: "BNBUSDT",
  solana: "SOLUSDT",
  "usd-coin": null,
  dogecoin: "DOGEUSDT",
  cardano: "ADAUSDT",
  tron: "TRXUSDT",
  avalanche: "AVAXUSDT",
  chainlink: "LINKUSDT",
  "shiba-inu": "SHIBUSDT",
  "polkadot": "DOTUSDT",
  "bitcoin-cash": "BCHUSDT",
  "near": "NEARUSDT",
  litecoin: "LTCUSDT",
  "matic-network": "MATICUSDT",
  uniswap: "UNIUSDT",
  "internet-computer": "ICPUSDT",
};

function binanceSymbolFor(coinId) {
  const symbol = COINGECKO_ID_TO_BINANCE_SYMBOL[coinId];
  return symbol || null;
}

export function isSupportedByBinance(coinId) {
  return Boolean(binanceSymbolFor(coinId));
}

// days -> { interval, limit } de klines de Binance que cubre ese rango
function klineParamsForDays(days) {
  if (days <= 1) return { interval: "15m", limit: 96 };
  if (days <= 7) return { interval: "2h", limit: 84 };
  if (days <= 30) return { interval: "8h", limit: 90 };
  if (days <= 90) return { interval: "1d", limit: 90 };
  return { interval: "1d", limit: 365 };
}

export async function getBinanceHistory(coinId, days) {
  const symbol = binanceSymbolFor(coinId);
  if (!symbol) return null;

  const { interval, limit } = klineParamsForDays(days);
  const key = `binance:history:${symbol}:${interval}:${limit}`;

  return getOrFetch(key, config.cacheTtl.marketHistory, async () => {
    const { data } = await client.get("/klines", { params: { symbol, interval, limit } });
    return {
      id: coinId,
      candles: data.map((candle) => ({
        timestamp: candle[0],
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
        volume: Number(candle[5]),
      })),
      prices: data.map((candle) => ({
        timestamp: candle[0],
        price: Number(candle[4]),
      })),
    };
  });
}
