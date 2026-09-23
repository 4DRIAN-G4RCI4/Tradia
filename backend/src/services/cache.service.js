import NodeCache from "node-cache";

const cache = new NodeCache({ checkperiod: 60, maxKeys: 2000 });
const inFlight = new Map();

export async function getOrFetch(key, ttlSeconds, fetchFn) {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }

  const promise = fetchFn()
    .then((value) => {
      cache.set(key, value, ttlSeconds);
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function getCacheStats() {
  return cache.getStats();
}

export default cache;