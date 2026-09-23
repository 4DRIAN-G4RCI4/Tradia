import { useEffect, useState } from "react";
import client from "../api/client";

export function useGlobalStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    function fetchStats() {
      client
        .get("/market/global")
        .then((res) => {
          if (!cancelled) setStats(res.data);
        })
        .catch((err) => {
          if (!cancelled) setError(err.response?.data?.error?.message || err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    fetchStats();
    // 120s = TTL de caché del backend para /market/global
    const interval = setInterval(fetchStats, 120_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, error };
}
