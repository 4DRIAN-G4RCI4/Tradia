import { useState } from "react";
import { useNews } from "../hooks/useNews";
import { useMarketData } from "../hooks/useMarketData";
import NewsPreviewModal from "../components/NewsPreviewModal";

function timeAgo(isoDate) {
  if (!isoDate) return "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
}

function NewsGridSkeleton() {
  return (
    <div className="news-grid" aria-busy="true" aria-label="Cargando noticias">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="news-card">
          <div className="skeleton-bar" style={{ height: 160, borderRadius: 0 }} />
          <div style={{ padding: "var(--sp-4)" }}>
            <div className="skeleton-bar" style={{ width: "90%", marginBottom: 8 }} />
            <div className="skeleton-bar" style={{ width: "60%", height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NewsPage() {
  const { coins } = useMarketData(20);
  const [coinFilter, setCoinFilter] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const { news, loading, error } = useNews(coinFilter);

  const topCoins = coins.slice(0, 12);
  const filterLabel = coins.find((c) => c.id === coinFilter)?.name;

  return (
    <>
      <section className="news-hero">
        <span className="news-hero-eyebrow">
          <span className="eyebrow-dot" aria-hidden="true"></span>
          Actualizado en vivo
        </span>
        <h1 className="news-hero-title">
          Lo último del <span className="text-gradient">mercado cripto</span>
        </h1>
        <p className="news-hero-desc">
          Titulares de CoinDesk y Cointelegraph, filtrables por moneda, con vista previa sin salir
          de Tradia.
        </p>
      </section>

      <div className="news-filter-bar" role="group" aria-label="Filtrar noticias por moneda">
        <button
          type="button"
          className={`coin-filter-chip ${!coinFilter ? "active" : ""}`}
          onClick={() => setCoinFilter(null)}
        >
          Todas
        </button>
        {topCoins.map((coin) => (
          <button
            key={coin.id}
            type="button"
            className={`coin-filter-chip ${coinFilter === coin.id ? "active" : ""}`}
            onClick={() => setCoinFilter(coin.id)}
          >
            <img src={coin.image} alt="" width={16} height={16} />
            {coin.symbol.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <NewsGridSkeleton />}

      {!loading && error && (
        <div className="state state-error panel" role="alert">
          <span className="state-icon" aria-hidden="true">
            ⚠
          </span>
          <span className="state-title">No se pudieron cargar las noticias</span>
          <span className="state-desc">{error}</span>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="state panel">
          <span className="state-icon" aria-hidden="true">
            📰
          </span>
          <span className="state-title">
            {coinFilter ? `Sin noticias recientes sobre ${filterLabel || coinFilter}` : "Sin noticias por ahora"}
          </span>
          <span className="state-desc">
            {coinFilter ? "Prueba con otra moneda o quita el filtro." : "Vuelve a intentarlo en unos minutos."}
          </span>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="news-grid">
          {news.map((item, i) => (
            <button
              key={item.link || i}
              type="button"
              className="news-card"
              onClick={() => setPreviewItem(item)}
            >
              {item.image ? (
                <img className="news-card-image" src={item.image} alt="" loading="lazy" />
              ) : (
                <div className="news-card-image news-card-image-placeholder" aria-hidden="true">
                  📰
                </div>
              )}
              <div className="news-card-body">
                <span className="news-meta">
                  <span className="news-source">{item.source}</span>
                  <span className="news-dot" aria-hidden="true"></span>
                  <span>{timeAgo(item.publishedAt)}</span>
                </span>
                <span className="news-card-title">{item.title}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <NewsPreviewModal
        item={
          previewItem
            ? { ...previewItem, publishedAtLabel: timeAgo(previewItem.publishedAt) }
            : null
        }
        onClose={() => setPreviewItem(null)}
      />
    </>
  );
}
