import { useState } from "react";
import { useMarketData } from "../hooks/useMarketData";

export default function CurrencyConverter() {
  const { coins, loading } = useMarketData(20);
  const [fromId, setFromId] = useState("bitcoin");
  const [toId, setToId] = useState("usd");
  const [amount, setAmount] = useState("1");
  const [spinning, setSpinning] = useState(false);

  if (loading) {
    return (
      <div className="panel">
        <h2>Conversor</h2>
        <div className="skeleton-bar" style={{ height: 40 }} />
      </div>
    );
  }

  const fromCoin = coins.find((c) => c.id === fromId);
  const toCoin = coins.find((c) => c.id === toId);
  const fromPrice = fromCoin?.currentPrice ?? 1; // USD siempre = 1
  const toPrice = toCoin?.currentPrice ?? 1;
  const parsed = Number(amount) || 0;
  const result = (parsed * fromPrice) / toPrice;

  function swap() {
    setFromId(toId === "usd" ? "bitcoin" : toId);
    setToId(fromId);
    setSpinning(true);
    setTimeout(() => setSpinning(false), 300);
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Conversor</h2>
      </div>
      <div className="converter">
        <div className="converter-row">
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Cantidad"
            className="converter-amount"
          />
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            aria-label="Divisa principal"
          >
            <option value="usd">USD</option>
            {coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`converter-swap ${spinning ? "spinning" : ""}`}
          onClick={swap}
          aria-label="Invertir divisas"
        >
          ⇅
        </button>

        <div className="converter-row">
          <output className="converter-result">
            {result.toLocaleString(undefined, { maximumFractionDigits: 8 })}
          </output>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            aria-label="Divisa destino"
          >
            <option value="usd">USD</option>
            {coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
