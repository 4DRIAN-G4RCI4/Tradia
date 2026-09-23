import { useMarketData } from "../hooks/useMarketData";
import { useCoinTooltip } from "../hooks/useCoinTooltip";
import Sparkline from "./Sparkline";
import CoinTooltip from "./CoinTooltip";

function formatUsd(value) {
  if (value === null || value === undefined) return "N/D";
  if (value > 0 && value < 0.000001) {
    // Precios ultra pequeños (memecoins): usar suficientes decimales para que
    // el valor real sea visible, no solo "$0.00". Se parte de 10 y se sube
    // hasta encontrar el primer dígito significativo (máx. 20, límite de JS).
    let decimals = 10;
    while (decimals < 20 && Number(value.toFixed(decimals)) === 0) decimals += 2;
    return `$${value.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

function formatCompactUsd(value) {
  if (value === null || value === undefined) return "N/D";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function PctPill({ value }) {
  if (value === null || value === undefined) return <span className="muted">N/D</span>;
  const isUp = value >= 0;
  return (
    <span className={`pct-pill ${isUp ? "up" : "down"}`}>
      <span className="arrow" aria-hidden="true">
        {isUp ? "▲" : "▼"}
      </span>
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando lista de criptomonedas">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton-bar" style={{ width: 24, height: 24, borderRadius: "50%" }} />
          <div className="skeleton-bar" style={{ width: "35%" }} />
          <div className="skeleton-bar" style={{ width: "20%", marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

export default function CryptoList({ selectedCoinId, onSelectCoin, searchQuery = "" }) {
  const { coins, loading, error } = useMarketData(20);
  const { tooltip, bind } = useCoinTooltip();

  const query = searchQuery.trim().toLowerCase();
  const filteredCoins = query
    ? coins.filter(
        (c) => c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query)
      )
    : coins;

  return (
    <div className="panel" id="mercado">
      <div className="panel-head">
        <h2>Mercado</h2>
        <span className="panel-sub">Top {coins.length || 20} por capitalización</span>
      </div>

      {loading && <TableSkeleton />}

      {!loading && error && (
        <div className="state state-error" role="alert">
          <span className="state-icon" aria-hidden="true">
            ⚠
          </span>
          <span className="state-title">No se pudo cargar el mercado</span>
          <span className="state-desc">{error}</span>
        </div>
      )}

      {!loading && !error && filteredCoins.length === 0 && (
        <div className="state">
          <span className="state-icon" aria-hidden="true">
            🔎
          </span>
          <span className="state-title">Sin resultados para "{searchQuery}"</span>
          <span className="state-desc">Prueba con otro nombre o símbolo.</span>
        </div>
      )}

      {!loading && !error && filteredCoins.length > 0 && (
        <div className="table-wrap">
          <table className="crypto-table">
            <thead>
              <tr>
                <th scope="col">Moneda</th>
                <th scope="col">Precio</th>
                <th scope="col">1h</th>
                <th scope="col">24h</th>
                <th scope="col">7d</th>
                <th scope="col">Cap. mercado</th>
                <th scope="col">Últimos 7 días</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoins.map((coin) => {
                const isSelected = coin.id === selectedCoinId;
                return (
                  <tr
                    key={coin.id}
                    className={isSelected ? "selected" : ""}
                    onClick={() => onSelectCoin(coin.id)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`Ver ${coin.name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectCoin(coin.id);
                      }
                    }}
                    {...bind(coin)}
                  >
                    <td>
                      <div className="coin-cell">
                        <img src={coin.image} alt="" width={28} height={28} />
                        <span className="coin-name">{coin.name}</span>
                        <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                      </div>
                    </td>
                    <td>{formatUsd(coin.currentPrice)}</td>
                    <td>
                      <PctPill value={coin.priceChangePct1h} />
                    </td>
                    <td>
                      <PctPill value={coin.priceChangePct24h} />
                    </td>
                    <td>
                      <PctPill value={coin.priceChangePct7d} />
                    </td>
                    <td>{formatCompactUsd(coin.marketCap)}</td>
                    <td>
                      <Sparkline prices={coin.sparkline7d} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tooltip && <CoinTooltip coin={tooltip.coin} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
