import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
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

export default function NavBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  }

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`} aria-label="Navegación principal">
      <div className="navbar-brand">
        <div className="brand-mark" aria-hidden="true">
          <BrandIcon />
        </div>
        <span className="navbar-title">Tradia</span>
      </div>

      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Mercado
        </NavLink>
        <NavLink to="/noticias" className={({ isActive }) => (isActive ? "active" : "")}>
          Noticias
        </NavLink>
      </div>

      <div className="navbar-tools">
        <div className="navbar-search">
          <label htmlFor="coin-search" className="visually-hidden">
            Buscar criptomoneda
          </label>
          <input
            id="coin-search"
            type="search"
            placeholder="Buscar moneda..."
            value={query}
            onChange={handleChange}
          />
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
}
