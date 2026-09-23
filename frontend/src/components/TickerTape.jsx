import { useMarketData } from "../hooks/useMarketData";
import { useCoinTooltip } from "../hooks/useCoinTooltip";
import CoinTooltip from "./CoinTooltip";

function formatPct(value) {
  if (value === null || value === undefined) return null;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function TickerChip({ coin, onSelectCoin, bind, tabIndex }) {
  const pct = formatPct(coin.priceChangePct24h);
  const isUp = (coin.priceChangePct24h ?? 0) >= 0;
  return (
    <button
      type="button"
      className="ticker-chip"
      onClick={() => onSelectCoin(coin.id)}
      tabIndex={tabIndex}
      {...bind(coin)}
    >
      <img src={coin.image} alt="" width={20} height={20} />
      <span className="ticker-chip-symbol">{coin.symbol.toUpperCase()}</span>
      {pct && <span className={isUp ? "up" : "down"}>{pct}</span>}
    </button>
  );
}

export default function TickerTape({ onSelectCoin }) {
  const { coins, loading, error } = useMarketData(20);
  const { tooltip, bind } = useCoinTooltip();

  if (loading) {
    return (
      <div className="ticker-tape" aria-busy="true" aria-label="Cargando mercado">
        <div className="ticker-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-bar" style={{ width: 120, height: 36, flexShrink: 0 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || coins.length === 0) return null;

  return (
    <div className="ticker-tape" role="marquee" aria-label="Cinta de precios en vivo">
      <div className="ticker-track">
        {coins.map((coin) => (
          <TickerChip key={`a-${coin.id}`} coin={coin} onSelectCoin={onSelectCoin} bind={bind} />
        ))}
        {coins.map((coin) => (
          <TickerChip
            key={`b-${coin.id}`}
            coin={coin}
            onSelectCoin={onSelectCoin}
            bind={bind}
            tabIndex={-1}
          />
        ))}
      </div>

      {tooltip && <CoinTooltip coin={tooltip.coin} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
