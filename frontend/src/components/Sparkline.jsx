export default function Sparkline({ prices, width = 110, height = 32 }) {
  if (!prices || prices.length < 2) {
    return <span className="muted" style={{ fontSize: "0.75rem" }}>—</span>;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const isUp = prices[prices.length - 1] >= prices[0];

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={isUp ? "Tendencia al alza en los últimos 7 días" : "Tendencia a la baja en los últimos 7 días"}
    >
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "var(--up)" : "var(--down)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
