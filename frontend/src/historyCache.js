import client from "./api/client";

// Cache en memoria compartida entre useCoinHistory y la precarga de
// MarketDataProvider, para que al hacer click en una moneda ya precargada
// la gráfica pinte sin esperar red.
const cache = new Map();
const key = (coinId, days) => `${coinId}:${days}`;

export function getCachedHistory(coinId, days) {
  return cache.get(key(coinId, days)) || null;
}

export function fetchHistory(coinId, days) {
  const k = key(coinId, days);
  if (cache.has(k)) return Promise.resolve(cache.get(k));
  return client.get(`/market/${coinId}/history`, { params: { days } }).then((res) => {
    cache.set(k, res.data);
    return res.data;
  });
}
