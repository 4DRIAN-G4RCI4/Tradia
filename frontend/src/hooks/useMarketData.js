import { useContext } from "react";
import { MarketDataContext } from "../marketDataContext";

// Lee del MarketDataProvider compartido (una sola petición para toda la app)
// en vez de que cada componente dispare su propio fetch a /market/top.
export function useMarketData() {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error("useMarketData debe usarse dentro de MarketDataProvider");
  return ctx;
}
