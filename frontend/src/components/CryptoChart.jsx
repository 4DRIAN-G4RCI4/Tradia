import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";
import { useCoinHistory } from "../hooks/useCoinHistory";
import { useChartColors } from "../hooks/useChartColors";
import { useMarketData } from "../hooks/useMarketData";
import TimeframeSelector from "./TimeframeSelector";

const RANGE_LABEL = { 1: "1D", 7: "7D", 30: "1M", 90: "3M", 365: "1A" };
const SOURCE_LABEL = { binance: "Binance", coingecko: "CoinGecko" };

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

function formatPct(value) {
  if (value === null || value === undefined) return null;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// media móvil simple sobre cierres, con hueco al inicio (no hay suficientes velas previas)
function movingAverage(candles, period) {
  const out = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    out.push({ time: candles[i].timestamp / 1000, value: sum / period });
  }
  return out;
}

export default function CryptoChart({ coinId, days, onDaysChange }) {
  const { history, loading, error } = useCoinHistory(coinId, days);
  const { coins } = useMarketData(20);
  const colors = useChartColors();
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});

  const coin = coins.find((c) => c.id === coinId);
  const pct24h = formatPct(coin?.priceChangePct24h);
  const isUp = (coin?.priceChangePct24h ?? 0) >= 0;
  const hasCandles = Boolean(history?.candles?.length);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { color: "transparent" }, textColor: colors.tickText },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      timeScale: { borderColor: colors.axis, timeVisible: days <= 1 },
      rightPriceScale: { borderColor: colors.axis },
      crosshair: { mode: 0 },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderVisible: false,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
      priceFormat: { type: "custom", formatter: formatUsd, minMove: 0.00000001 },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.22 } });

    const ma7Series = chart.addSeries(LineSeries, { color: "#f0b90b", lineWidth: 1, priceLineVisible: false });
    const ma25Series = chart.addSeries(LineSeries, { color: "#8e6ee8", lineWidth: 1, priceLineVisible: false });

    // Serie de respaldo: precio de cierre simple cuando no hay velas de Binance.US
    // para esta moneda (fuente secundaria, CoinGecko).
    const priceLineSeries = chart.addSeries(LineSeries, {
      color: colors.accent,
      lineWidth: 2,
      priceFormat: { type: "custom", formatter: formatUsd, minMove: 0.00000001 },
    });

    chartRef.current = chart;
    seriesRef.current = { candleSeries, volumeSeries, ma7Series, ma25Series, priceLineSeries };

    return () => {
      chart.remove();
      chartRef.current = null;
    };
    // recrea el chart si cambian los colores del tema o el rango (timeVisible depende de days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.tickText, colors.grid, colors.axis, colors.up, colors.down, colors.accent, days]);

  const hasPrices = Boolean(history?.prices?.length);

  useEffect(() => {
    const { candleSeries, volumeSeries, ma7Series, ma25Series, priceLineSeries } = seriesRef.current;
    if (!candleSeries) return;

    if (hasCandles) {
      const candles = history.candles;
      candleSeries.setData(
        candles.map((c) => ({
          time: c.timestamp / 1000,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      volumeSeries.setData(
        candles.map((c) => ({
          time: c.timestamp / 1000,
          value: c.volume,
          color: c.close >= c.open ? colors.up : colors.down,
        }))
      );
      ma7Series.setData(movingAverage(candles, 7));
      ma25Series.setData(movingAverage(candles, 25));
      priceLineSeries.setData([]);
    } else if (hasPrices) {
      candleSeries.setData([]);
      volumeSeries.setData([]);
      ma7Series.setData([]);
      ma25Series.setData([]);
      priceLineSeries.setData(history.prices.map((p) => ({ time: p.timestamp / 1000, value: p.price })));
    } else {
      return;
    }
    // fitContent tras el primer paint: autoSize mide el contenedor de forma asíncrona
    // (ResizeObserver), así que llamarlo en el mismo tick a veces usa un ancho stale
    requestAnimationFrame(() => chartRef.current?.timeScale().fitContent());
  }, [history, hasCandles, hasPrices, colors.up, colors.down]);

  if (!coinId) return null;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Histórico de precio</h2>
        <span className="panel-sub">
          {coinId} · {RANGE_LABEL[days] || `${days}d`}
          {history?.source && ` · ${SOURCE_LABEL[history.source] || history.source}`}
        </span>
      </div>

      {coin && (
        <div className="price-hero">
          <img src={coin.image} alt="" width={44} height={44} />
          <div className="price-hero-info">
            <span className="price-hero-name">
              {coin.name} <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
            </span>
            <div className="price-hero-value">
              <span className="price-hero-amount">{formatUsd(coin.currentPrice)}</span>
              {pct24h && (
                <span className={`pct-pill ${isUp ? "up" : "down"}`}>
                  <span className="arrow" aria-hidden="true">{isUp ? "▲" : "▼"}</span>
                  {pct24h}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <TimeframeSelector days={days} onChange={onDaysChange} />

      {loading && (
        <div aria-busy="true" aria-label="Cargando histórico">
          <div className="skeleton-bar" style={{ height: 360, borderRadius: "10px", marginTop: 12 }} />
        </div>
      )}

      {!loading && error && (
        <div className="state state-error" role="alert">
          <span className="state-icon" aria-hidden="true">
            ⚠
          </span>
          <span className="state-title">No se pudo cargar el histórico</span>
          <span className="state-desc">{error}</span>
        </div>
      )}

      {!loading && !error && !hasCandles && !hasPrices && (
        <div className="state">
          <span className="state-title">Sin histórico disponible para esta moneda</span>
        </div>
      )}

      {/* siempre montado (nunca condicional a loading/error) para que containerRef no se pierda
          entre estados: lightweight-charts se adjunta una vez a este nodo del DOM */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 360,
          marginTop: 12,
          display: !loading && !error && (hasCandles || hasPrices) ? "block" : "none",
        }}
      />

      {!loading && !error && !hasCandles && hasPrices && (
        <p className="chart-fallback-note">
          Esta moneda no cotiza en Binance.US (la región desde la que se obtienen los datos de velas); se muestra el
          precio de cierre de CoinGecko como fuente secundaria.
        </p>
      )}
    </div>
  );
}
