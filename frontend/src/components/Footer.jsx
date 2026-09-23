import { NavLink } from "react-router-dom";

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M3 17 L9 11 L13 15 L21 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 6 H21 V12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col footer-col-brand">
          <div className="footer-brand">
            <div className="brand-mark" aria-hidden="true">
              <BrandIcon />
            </div>
            <span className="footer-brand-name">Tradia</span>
          </div>
          <p className="footer-brand-desc">
            Análisis de mercado de criptomonedas en tiempo real: precios, tendencias, noticias y
            un conversor, todo basado en datos públicos.
          </p>
        </div>

        <div className="footer-col">
          <h3>Navegación</h3>
          <NavLink to="/">Mercado</NavLink>
          <NavLink to="/noticias">Noticias</NavLink>
        </div>

        <div className="footer-col">
          <h3>Legal</h3>
          <p className="footer-legal-text">
            Los datos provienen de fuentes públicas (CoinGecko, Binance, CoinDesk, Cointelegraph).
            No constituyen asesoría financiera.
          </p>
        </div>

        <div className="footer-col">
          <h3>Desarrollado por</h3>
          <a
            className="footer-tecnopriv-link"
            href="https://tecnopriv.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            TecnoPriv ↗
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tradia</span>
      </div>
    </footer>
  );
}
