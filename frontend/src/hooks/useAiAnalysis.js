import { useCallback, useEffect, useState } from "react";
import client from "../api/client";

export function useAiAnalysis(coinId) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeCoin = useCallback((id) => {
    setLoading(true);
    setError(null);
    client
      .post(`/analysis/coin/${id}`)
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const analyzeMarket = useCallback(() => {
    setLoading(true);
    setError(null);
    client
      .post("/analysis/market")
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  // Al cambiar de moneda: primero se intenta recuperar el análisis ya guardado
  // en caché (sin gastar cómputo); si no hay nada cacheado, se genera solo.
  useEffect(() => {
    if (!coinId) return;
    let cancelled = false;
    setResult(null);
    client
      .get(`/analysis/coin/${coinId}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data) {
          setResult(res.data);
        } else {
          analyzeCoin(coinId);
        }
      })
      .catch(() => {
        if (!cancelled) analyzeCoin(coinId);
      });
    return () => {
      cancelled = true;
    };
  }, [coinId, analyzeCoin]);

  return { result, loading, error, analyzeCoin, analyzeMarket };
}
