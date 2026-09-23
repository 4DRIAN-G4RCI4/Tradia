const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1A", days: 365 },
];

export default function TimeframeSelector({ days, onChange }) {
  return (
    <div className="timeframe-group" role="group" aria-label="Rango de tiempo del gráfico">
      {RANGES.map((r) => (
        <button
          key={r.days}
          type="button"
          className={`timeframe-btn ${days === r.days ? "active" : ""}`}
          aria-pressed={days === r.days}
          onClick={() => onChange(r.days)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
