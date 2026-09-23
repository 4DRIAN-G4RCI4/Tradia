# API — Inventario y controles de seguridad

> Referencia rápida de los endpoints verificados en `backend/src/routes/*`.
> Análisis OWASP API Security Top 10 completo en `docs/security/API_SECURITY.md`.

## 1. Endpoints

| Método | Ruta | Público | Parámetros | Límites aplicados | Riesgo residual |
|---|---|---|---|---|---|
| GET | `/api/health` | sí | — | — | Expone stats de caché (informativo) |
| GET | `/api/market/top` | sí | `limit` | clamp 1..250 | — |
| GET | `/api/market/global` | sí | — | — | — |
| GET | `/api/market/trending` | sí | — | — | — |
| GET | `/api/market/all` | sí | — | — | — |
| GET | `/api/market/search` | sí | `q` | max 100 chars | Cache key por query (acotada) |
| GET | `/api/market/:id/history` | sí | `days` | clamp 1..365 | `:id` arbitrario → upstream |
| GET | `/api/market/:id` | sí | `:id` | lookup en top o llamada upstream | 404 si inexistente |
| GET | `/api/news` | sí | `coin` | max 100 chars | — |
| GET | `/api/analysis/coin/:id` | sí | `:id` | — | Solo lectura de caché |
| POST | `/api/analysis/coin/:id` | sí | `:id` | — | Genera análisis (900 s TTL) |
| GET | `/api/analysis/market` | sí | — | — | Solo lectura de caché |
| POST | `/api/analysis/market` | sí | — | — | Genera análisis (900 s TTL) |

## 2. Controles presentes (post-correcciones)

- **Autenticación/autorización:** N/A — API pública de solo lectura, sin datos de usuario.
- **Validación de entrada:** clamps numéricos y límites de longitud en rutas de mercado y noticias.
- **CORS:** lista de orígenes configurable vía `CORS_ORIGINS`; vacío = permitir todos (compatibilidad con el comportamiento previo).
- **Headers de seguridad:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. `X-Powered-By` desactivado.
- **Errores:** mensajes genéricos al cliente; detalles solo en logs del servidor.
- **Caché:** `NodeCache` con `maxKeys=2000`, TTLs, single-flight.
- **Timeouts de proveedor:** CoinGecko 10 s, Binance 8 s, RSS 10 s. Retry 2× con backoff (solo CoinGecko).
- **Fallback:** histórico Binance → CoinGecko.

## 3. Controles ausentes (requieren decisión)

- **Rate limiting** por IP/endpoint (crítico para proteger la cuota free de CoinGecko). Ver hallazgo F-01 en el RISK_REGISTER.
- **Circuit breaker** ante proveedor degradado (hoy: retry fijo 2×, sin ventana de fallo).
- **Paginación real** en `/top` (CoinGecko limita a 250; la app clampa igual).
- **Idempotencia/antirrebote** en POST de análisis (mitigado por caché TTL 900 s).
- **Firma/Verificación de integridad de datos** de proveedores (HTTPS sí; no hay HMAC — N/A para APIs públicas).

## 4. Métodos y códigos de estado

- Expresamente solo `GET` y `POST` (sin PUT/DELETE/PATCH). CORS no expone métodos adicionales.
- `200` datos, `404` ruta o moneda inexistente (`code: NOT_FOUND | COIN_NOT_FOUND`), `429` upstream rate-limit (`UPSTREAM_RATE_LIMITED`), `502` fallo de proveedor, `500` genérico (`INTERNAL_ERROR`).

## 5. Pruebas manuales realizadas (evidencia)

| Prueba | Resultado |
|---|---|
| `GET /api/market/top?limit=999999` | `200`, clampa a 250 (antes: pasaba el entero sin límite) |
| `GET /api/market/bitcoin/history?days=99999` | `200`, clampa a 365 |
| `GET /api/market/../../etc/passwd` | `404` (Express normaliza, sin path traversal) |
| `GET /api/market/search?q=<8000 chars>` | `200`, ahora trunca a 100 chars (antes: cache key de 8 KB) |
| `POST /api/analysis/market` sin ratelimit propio | `429` durante auditoría → evidencia de cuota free compartida |
| Origen CORS permitido (`http://localhost:5173`) | `Access-Control-Allow-Origin` reflejado |
| Origen CORS no permitido | Sin header CORS → bloqueado por navegador |
| Error de proveedor | `502 {"message":"Error interno del servidor"}` (sin leak de stack) |