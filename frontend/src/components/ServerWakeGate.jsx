import { useEffect, useState } from "react";
import client from "../api/client";

const SLOW_THRESHOLD_MS = 3000;

// El backend gratuito de Render se duerme tras 15 min sin tráfico y tarda
// ~30-60s en responder de nuevo. Sin esto, la primera visita del día ve la
// app vacía/rota mientras cada componente hace timeout por su cuenta.
export default function ServerWakeGate({ children }) {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const slowTimer = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    client
      .get("/health")
      .catch(() => {})
      .finally(() => {
        clearTimeout(slowTimer);
        setReady(true);
      });
    return () => clearTimeout(slowTimer);
  }, []);

  if (ready) return children;

  return (
    <div className="server-wake">
      <div className="server-wake-spinner" aria-hidden="true" />
      <p className="server-wake-title">Cargando Tradia…</p>
      {slow && (
        <p className="server-wake-desc">
          El servidor estaba en reposo y está despertando. Esto puede tardar hasta un minuto la primera vez.
        </p>
      )}
    </div>
  );
}
