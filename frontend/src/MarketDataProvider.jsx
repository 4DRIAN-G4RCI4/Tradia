import { useCallback, useEffect, useRef, useState } from "react";
import client from "./api/client";
import { fetchHistory } from "./historyCache";
import { MarketDataContext } from "./marketDataContext";

// Una sola petición compartida por toda la app en vez de que cada
// componente pida /market/top por su cuenta: evita saturar el rate
// limit de CoinGecko. 60s de intervalo cae por encima del TTL de
// caché del backend (90s para market/top), así que casi siempre pega
// contra la caché del servidor y no contra CoinGecko directamente.
const REFRESH_MS = 60_000;
const LIMIT = 20;
const STORAGE_KEY = "tradia-extra-coins";

function loadExtraCoinIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExtraCoinIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage bloqueado (modo privado, etc.) - no persiste entre sesiones, no es crítico
  }
}

export default function MarketDataProvider({ children }) {
  const [topCoins, setTopCoins] = useState([]);
  const [extraCoins, setExtraCoins] = useState([]);
  const [extraCoinIds, setExtraCoinIds] = useState(loadExtraCoinIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const preloadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function fetchTop() {
      client
        .get("/market/top", { params: { limit: LIMIT } })
        .then((res) => {
          if (!cancelled) {
            setTopCoins(res.data);
            setError(null);
            // primera carga: precachear el histórico 7D de cada moneda, una por una,
            // para que la gráfica pinte al instante al hacer click (sin saturar el rate limit)
            if (!preloadedRef.current) {
              preloadedRef.current = true;
              res.data.reduce(
                (chain, coin) =>
                  chain
                    .then(() => (cancelled ? null : fetchHistory(coin.id, 7).catch(() => null)))
                    .then((r) => new Promise((resolve) => setTimeout(() => resolve(r), 300))),
                Promise.resolve()
              );
            }
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.response?.data?.error?.message || err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    fetchTop();
    const interval = setInterval(fetchTop, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (extraCoinIds.length === 0) {
      setExtraCoins([]);
      return;
    }
    let cancelled = false;

    function fetchExtras() {
      Promise.all(
        extraCoinIds.map((id) =>
          client
            .get(`/market/${id}`)
            .then((res) => res.data)
            .catch(() => null)
        )
      ).then((results) => {
        if (!cancelled) setExtraCoins(results.filter(Boolean));
      });
    }

    fetchExtras();
    const interval = setInterval(fetchExtras, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [extraCoinIds]);

  const addCoin = useCallback((id) => {
    setExtraCoinIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveExtraCoinIds(next);
      return next;
    });
  }, []);

  const removeCoin = useCallback((id) => {
    setExtraCoinIds((prev) => {
      const next = prev.filter((c) => c !== id);
      saveExtraCoinIds(next);
      return next;
    });
  }, []);

  const topIds = new Set(topCoins.map((c) => c.id));
  const coins = [...topCoins, ...extraCoins.filter((c) => !topIds.has(c.id))];

  return (
    <MarketDataContext.Provider
      value={{ coins, loading, error, extraCoinIds, addCoin, removeCoin }}
    >
      {children}
    </MarketDataContext.Provider>
  );
}
