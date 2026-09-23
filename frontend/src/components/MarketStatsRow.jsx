import { useGlobalStats } from "../hooks/useGlobalStats";
import { useMarketData } from "../hooks/useMarketData";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatCompactUsd(value) {
  if (value === null || value === undefined) return "N/D";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(value) {
  if (value === null || value === undefined) return "N/D";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default function MarketStatsRow() {
  const { stats, loading, error } = useGlobalStats();
  const { coins } = useMarketData();
  const top3 = coins.slice(0, 3);

  if (loading) {
    return (
      <div className="market-overview" aria-busy="true" aria-label="Cargando estadísticas de mercado">
        <div className="skeleton-bar" style={{ width: 220, height: 40 }} />
        <div className="skeleton-bar" style={{ width: 300, height: 24 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-overview">
        <div className="state state-error" role="alert">
          <span className="state-icon" aria-hidden="true">⚠</span>
          <span className="state-title">No se pudieron cargar las estadísticas globales</span>
          <span className="state-desc">{error}</span>
        </div>
      </div>
    );
  }

  const capUp = (stats.marketCapChangePct24h ?? 0) >= 0;

  return (
    <div className="market-overview">
      <div className="market-overview-main">
        <span className="market-overview-label">Capitalización de mercado</span>
        <div className="market-overview-value-row">
          <span className="market-overview-value">{formatCompactUsd(stats.totalMarketCapUsd)}</span>
          <span className={`pct-pill ${capUp ? "up" : "down"}`}>
            <span className="arrow" aria-hidden="true">{capUp ? "▲" : "▼"}</span>
            {formatPct(stats.marketCapChangePct24h)}
          </span>
        </div>
      </div>

      <div className="market-overview-secondary">
        <div className="market-overview-item">
          <span className="market-overview-label">Volumen 24h</span>
          <span className="market-overview-value-sm">{formatCompactUsd(stats.totalVolumeUsd)}</span>
        </div>
        <div className="market-overview-item">
          <span className="market-overview-label">Dominancia BTC</span>
          <span className="market-overview-value-sm">{stats.btcDominancePct?.toFixed(1)}%</span>
        </div>
        <div className="market-overview-item">
          <span className="market-overview-label">Criptomonedas activas</span>
          <span className="market-overview-value-sm">{stats.activeCryptocurrencies?.toLocaleString()}</span>
        </div>
      </div>

      {top3.length === 3 && stats.totalMarketCapUsd && (
        <div className="market-podium">
          <span className="market-overview-label">Top dominancia</span>
          <div className="market-podium-list">
            {top3.map((coin, i) => {
              const dominancePct = (coin.marketCap / stats.totalMarketCapUsd) * 100;
              return (
                <div key={coin.id} className={`market-podium-item rank-${i + 1}`}>
                  <span className="market-podium-medal" aria-hidden="true">
                    {MEDALS[i]}
                  </span>
                  <img src={coin.image} alt="" />
                  <div className="market-podium-info">
                    <span className="market-podium-name">{coin.symbol.toUpperCase()}</span>
                    <span className="market-podium-dominance">{dominancePct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
