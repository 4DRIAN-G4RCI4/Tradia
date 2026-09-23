import { useEffect, useState } from "react";
import { getCachedHistory, fetchHistory } from "../historyCache";

export function useCoinHistory(coinId, days = 7) {
  const cached = coinId ? getCachedHistory(coinId, days) : null;
  const [history, setHistory] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coinId) return;
    const already = getCachedHistory(coinId, days);
    if (already) {
      setHistory(already);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHistory(coinId, days)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error?.message || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coinId, days]);

  return { history, loading, error };
}
