import { useAiAnalysis } from "../hooks/useAiAnalysis";

export default function AiAnalysisPanel({ coinId }) {
  const { result, loading, error } = useAiAnalysis(coinId);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Análisis automático</h2>
        <span className="panel-sub">Basado en reglas</span>
      </div>

      {loading && (
        <div aria-busy="true" aria-label="Generando análisis">
          <div className="skeleton-bar" style={{ width: "95%", marginBottom: 8 }} />
          <div className="skeleton-bar" style={{ width: "88%", marginBottom: 8 }} />
          <div className="skeleton-bar" style={{ width: "60%" }} />
        </div>
      )}

      {!loading && error && (
        <div className="state state-error" role="alert">
          <span className="state-icon" aria-hidden="true">
            ⚠
          </span>
          <span className="state-title">No se pudo generar el análisis</span>
          <span className="state-desc">{error}</span>
        </div>
      )}

      {!loading && !error && result && (
        <div className="analysis-result">
          {result.summary.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          <p className="analysis-meta">
            Generado {new Date(result.generatedAt).toLocaleString("es-ES")}
          </p>
        </div>
      )}

      {!loading && !error && !result && (
        <div className="state">
          <span className="state-icon" aria-hidden="true">
            🔍
          </span>
          <span className="state-title">Sin análisis todavía</span>
          <span className="state-desc">Selecciona una moneda para generar un resumen automático.</span>
        </div>
      )}
    </div>
  );
}
