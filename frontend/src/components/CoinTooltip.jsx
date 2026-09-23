function formatUsd(value) {
  if (value === null || value === undefined) return "N/D";
  if (value > 0 && value < 0.000001) {
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

function formatPct(value) {
  if (value === null || value === undefined) return null;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function PctLine({ label, value }) {
  const pct = formatPct(value);
  if (pct === null) return null;
  const isUp = value >= 0;
  return (
    <div className="coin-tooltip-row">
      <span className="coin-tooltip-label">{label}</span>
      <span className={isUp ? "up" : "down"}>{pct}</span>
    </div>
  );
}

export default function CoinTooltip({ coin, x, y }) {
  if (!coin) return null;

  return (
    <div className="coin-tooltip" style={{ left: x + 14, top: y + 14 }} role="tooltip">
      <div className="coin-tooltip-head">
        <img src={coin.image} alt="" width={20} height={20} />
        <span className="coin-tooltip-name">{coin.name}</span>
        <span className="coin-tooltip-symbol">{coin.symbol?.toUpperCase()}</span>
      </div>
      <div className="coin-tooltip-price">{formatUsd(coin.currentPrice)}</div>
      <PctLine label="1h" value={coin.priceChangePct1h} />
      <PctLine label="24h" value={coin.priceChangePct24h} />
      <PctLine label="7d" value={coin.priceChangePct7d} />
      {coin.marketCap != null && (
        <div className="coin-tooltip-row">
          <span className="coin-tooltip-label">Cap. mercado</span>
          <span>{formatCompactUsd(coin.marketCap)}</span>
        </div>
      )}
    </div>
  );
}
