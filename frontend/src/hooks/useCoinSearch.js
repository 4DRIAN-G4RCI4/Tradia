import { useEffect, useState } from "react";
import client from "../api/client";

const DEBOUNCE_MS = 350;

export function useCoinSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      client
        .get("/market/search", { params: { q } })
        .then((res) => setResults(res.data))
        .catch((err) => setError(err.response?.data?.error?.message || err.message))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error };
}
