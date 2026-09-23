import { useEffect, useRef } from "react";

export default function NewsPreviewModal({ item, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (item) closeRef.current?.focus();
  }, [item]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Cerrar vista previa">
          ×
        </button>

        {item.image ? (
          <img className="modal-image" src={item.image} alt="" />
        ) : (
          <div className="modal-image modal-image-placeholder" aria-hidden="true">
            📰
          </div>
        )}

        <div className="modal-body">
          <div className="news-meta">
            <span className="news-source">{item.source}</span>
            <span className="news-dot" aria-hidden="true"></span>
            <span>{item.publishedAtLabel}</span>
          </div>
          <h3 id="news-preview-title">{item.title}</h3>
          {item.contentSnippet && <p className="modal-snippet">{item.contentSnippet}</p>}
          <a
            className="btn"
            href={item.link}
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            Leer en {item.source} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
