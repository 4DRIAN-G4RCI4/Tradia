import { useMemo, useState } from "react";
import { useCoinSearch } from "../hooks/useCoinSearch";
import { useMarketData } from "../hooks/useMarketData";

export default function AddCoinPanel() {
  const [query, setQuery] = useState("");
  const { results, loading, error } = useCoinSearch(query);
  const { coins, extraCoinIds, addCoin, removeCoin } = useMarketData();
  const [justAdded, setJustAdded] = useState(null);

  const currentIds = useMemo(() => new Set(coins.map((c) => c.id)), [coins]);

  function handleAdd(id) {
    addCoin(id);
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 2000);
  }

  return (
    <div className="panel add-coin-panel">
      <div className="panel-head">
        <h2>Agregar moneda</h2>
        <span className="panel-sub">¿No ves la que buscas?</span>
      </div>

      <div className="add-coin-search">
        <label htmlFor="add-coin-input" className="visually-hidden">
          Buscar entre todas las criptomonedas
        </label>
        <input
          id="add-coin-input"
          type="search"
          placeholder="Buscar por nombre o símbolo (ej. Shiba, PEPE)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="muted add-coin-hint">Buscando...</p>}
      {error && <p className="error add-coin-hint">No se pudo buscar: {error}</p>}

      {!loading && !error && query.trim() && (
        <ul className="add-coin-results" role="list">
          {results.length === 0 && (
            <li className="add-coin-empty">Sin coincidencias para "{query}".</li>
          )}
          {results.map((coin) => {
            const alreadyIn = currentIds.has(coin.id);
            return (
              <li key={coin.id} className="add-coin-row">
                <div className="add-coin-info">
                  <img className="add-coin-icon" src={coin.image} alt="" width={28} height={28} />
                  <span className="add-coin-name">{coin.name}</span>
                  <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary add-coin-btn"
                  disabled={alreadyIn}
                  onClick={() => handleAdd(coin.id)}
                >
                  {alreadyIn ? "Ya agregada" : justAdded === coin.id ? "Agregada ✓" : "Agregar"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {extraCoinIds.length > 0 && (
        <div className="add-coin-manage">
          <span className="add-coin-manage-label">Monedas que agregaste</span>
          <div className="add-coin-manage-chips">
            {extraCoinIds.map((id) => (
              <button
                key={id}
                type="button"
                className="add-coin-chip"
                onClick={() => removeCoin(id)}
                title="Quitar"
              >
                {id} ×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
