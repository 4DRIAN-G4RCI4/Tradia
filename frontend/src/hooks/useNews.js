import { useEffect, useState } from "react";
import client from "../api/client";

export function useNews(coinFilter) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    client
      .get("/news", { params: coinFilter ? { coin: coinFilter } : undefined })
      .then((res) => {
        if (!cancelled) setNews(res.data);
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
  }, [coinFilter]);

  return { news, loading, error };
}
