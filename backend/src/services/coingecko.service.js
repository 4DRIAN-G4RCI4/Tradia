import axios from "axios";
import { config } from "../config.js";
import { getOrFetch } from "./cache.service.js";

const client = axios.create({ baseURL: config.coingeckoBaseUrl, timeout: 10000 });

const PRICE_CHANGE_TIMEFRAMES = "1h,24h,7d,14d,30d,1y";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWithRetry(url, options, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await client.get(url, options);
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      if (!isRetryable || attempt === retries) throw err;
      await sleep(500 * 2 ** attempt);
    }
  }
}

function normalizeCoin(coin) {
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    currentPrice: coin.current_price,
    marketCap: coin.market_cap,
    marketCapRank: coin.market_cap_rank,
    totalVolume: coin.total_volume,
    priceChange24h: coin.price_change_24h,
    priceChangePct1h: coin.price_change_percentage_1h_in_currency ?? null,
    priceChangePct24h: coin.price_change_percentage_24h,
    priceChangePct7d: coin.price_change_percentage_7d_in_currency ?? null,
    priceChangePct14d: coin.price_change_percentage_14d_in_currency ?? null,
    priceChangePct30d: coin.price_change_percentage_30d_in_currency ?? null,
    priceChangePct1y: coin.price_change_percentage_1y_in_currency ?? null,
    sparkline7d: coin.sparkline_in_7d?.price ?? null,
    lastUpdated: coin.last_updated,
  };
}

export async function getTopCoins(limit = config.topNCoins) {
  const key = `market:top:${limit}`;
  return getOrFetch(key, config.cacheTtl.marketTop, async () => {
    const { data } = await getWithRetry("/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: limit,
        page: 1,
        price_change_percentage: PRICE_CHANGE_TIMEFRAMES,
        sparkline: true,
      },
    });
    return data.map(normalizeCoin);
  });
}

export async function getCoinById(id) {
  const coins = await getTopCoins();
  const found = coins.find((c) => c.id === id);
  if (found) return found;

  const key = `market:coin:${id}`;
  return getOrFetch(key, config.cacheTtl.marketTop, async () => {
    const { data } = await getWithRetry("/coins/markets", {
      params: {
        vs_currency: "usd",
        ids: id,
        price_change_percentage: PRICE_CHANGE_TIMEFRAMES,
        sparkline: true,
      },
    });
    if (!data.length) return null;
    return normalizeCoin(data[0]);
  });
}

export async function getGlobalStats() {
  return getOrFetch("market:global", config.cacheTtl.global, async () => {
    const { data } = await getWithRetry("/global");
    const g = data.data;
    return {
      totalMarketCapUsd: g.total_market_cap?.usd ?? null,
      totalVolumeUsd: g.total_volume?.usd ?? null,
      btcDominancePct: g.market_cap_percentage?.btc ?? null,
      marketCapChangePct24h: g.market_cap_change_percentage_24h_usd ?? null,
      activeCryptocurrencies: g.active_cryptocurrencies ?? null,
    };
  });
}

export async function getTrendingCoins() {
  return getOrFetch("market:trending", config.cacheTtl.trending, async () => {
    const { data } = await getWithRetry("/search/trending");
    return (data.coins || []).map((entry) => {
      const c = entry.item;
      return {
        id: c.id,
        symbol: c.symbol,
        name: c.name,
        image: c.thumb,
        marketCapRank: c.market_cap_rank,
        priceChangePct24h: c.data?.price_change_percentage_24h?.usd ?? null,
      };
    });
  });
}

export async function getAllCoinsList() {
  return getOrFetch("market:coins-list", config.cacheTtl.coinsList, async () => {
    const { data } = await getWithRetry("/coins/list");
    return data.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name }));
  });
}

export async function searchCoins(query) {
  const key = `market:search:${query.toLowerCase()}`;
  return getOrFetch(key, config.cacheTtl.coinSearch, async () => {
    const { data } = await getWithRetry("/search", { params: { query } });
    return (data.coins || []).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.thumb,
      marketCapRank: c.market_cap_rank,
    }));
  });
}

export async function getCoinHistory(id, days = 7) {
  const key = `market:history:${id}:${days}`;
  return getOrFetch(key, config.cacheTtl.marketHistory, async () => {
    const { data } = await getWithRetry(`/coins/${id}/market_chart`, {
      params: { vs_currency: "usd", days },
    });
    return {
      id,
      prices: data.prices.map(([timestamp, price]) => ({ timestamp, price })),
    };
  });
}
