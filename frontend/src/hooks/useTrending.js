import { useEffect, useState } from "react";
import client from "../api/client";

export function useTrending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    function fetchTrending() {
      client
        .get("/market/trending")
        .then((res) => {
          if (!cancelled) setTrending(res.data);
        })
        .catch((err) => {
          if (!cancelled) setError(err.response?.data?.error?.message || err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    fetchTrending();
    // 300s = TTL de caché del backend para /market/trending
    const interval = setInterval(fetchTrending, 300_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { trending, loading, error };
}
