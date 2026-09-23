# Seguridad de la API — Evaluación OWASP API Security Top 10

> Evaluación por categoría del OWASP API Security Top 10 (2023) aplicada al estado **verificado** del repositorio (2026-09-23). Referencia de endpoints: `docs/api/API_SECURITY.md`.

## Resumen

| Categoría OWASP API Security | Resultado | Nota clave |
|---|---|---|
| API01 — Broken Object Level Authorization (BOLA/IDOR) | **N/A** | No hay objetos de usuario ni IDs sensibles |
| API02 — Broken Authentication | **N/A** | No hay autenticación en absoluto |
| API03 — Broken Object Property Level Authorization | **N/A** | No hay propiedades privadas por usuario |
| API04 — Resource Consumption | **RIESGO** | Sin rate limiting → abuso de cuota CoinGecko (F-01) |
| API05 — Broken Function Level Authorization | **N/A** | Ni roles ni funciones restringidas |
| API06 — Unrestricted Access to Sensitive Business Flows | **N/A** | Sin flujos sensibles (no hay dinero/compras) |
| API07 — Server Side Request Forgery | **NO APLICA (sin riesgo)** | El backend solo llama a URLs fijas (CoinGecko/Binance/RSS) |
| API08 — Security Misconfiguration | **ABIERTO/MEJORADO** | Headers y errores corregidos; CORS por allowlist; rate limiting pendiente |
| API09 — Improper Inventory Management | **BAJO** | API v3 fija, endpoints documentados; sin versionado de contrato, pero estable |
| API10 — Unsafe Consumption of APIs (proveedores) | **MEDIO** | Sin verificaciones de esquema; confianza total en CoinGecko/RSS |

## Detalle por categoría relevante

### API04 — Resource Consumption (F-01)
- **Hallazgo:** cualquier cliente puede generar llamadas a CoinGecko variando parámetros (`limit`, `q`, `:id`, `days`) con claves de caché distintas. La cuota free tier es compartida.
- **Evidencia:** la auditoría provocó `429 UPSTREAM_RATE_LIMITED` en masa.
- **Mitigaciones existentes:** caché con TTL (90 s–6 h), `maxKeys=2000`, single-flight, clamps (`limit ≤250`, `days ≤365`, `q/coin ≤100`).
- **Pendiente:** rate limiting por IP + endpoint (recomendado 30 req/min global, 5–10 req/min en `/search` y `POST /analysis/*`), límite por defecto de `limit` en 100, y timeout/circuit breaker por proveedor.

### API08 — Security Misconfiguration
- **Corregido en la auditoría:** headers de seguridad, `X-Powered-By` off, errores genéricos, CORS por allowlist.
- **Pendiente:** CSP estricta por header (F-06), HSTS en borde, deshabilitar `show stack` en producción (ya está genérico).

### API10 — Unsafe Consumption of APIs (proveedores)
El backend consume CoinGecko (JSON) y RSS (XML/HTML) sin validar el esquema completo:
- **RSS:** el HTML de `description` se parsea con regex para extraer imagen; se renderiza como `<img>` (React escapa el resto). Riesgo de phishing visual si un feed fuese comprometido (BAJO). Validar dominio de imagen con allowlist.
- **CoinGecko:** respuesta desnormalizada en `normalizeCoin()`; un campo `null` puede llegar a los formatters que ya devuelven `N/D` (comportamiento seguro). Si CoinGecko sirviese datos maliciosos, la app los reflejaría como texto (sin sink ejecutable).
- **Recomendación:** esquemas (zod) en el borde del adaptador + tests de fixtures.

## Validación de entrada (cómo contener el abuso)

| Parámetro | Regla | Implementación |
|---|---|---|
| `limit` | entero 1..250 | `toPositiveInt(limit, 250, 250)` en `market.routes.js` |
| `days` | 1..365 | `toPositiveInt(days, 7, 365)` |
| `q` | string ≤100 | `.slice(0, 100)` |
| `coin` | string ≤100 | `.slice(0, 100)` |
| `:id` | string (no numérico) | lookup + validación upstream |

## Métodos HTTP y supreficie

- **GET** (lectura) y **POST** (generar análisis, cacheado). Sin PUT/DELETE/PATCH.
- Sin `OPTIONS` funcionales más allá del preflight CORS.
- CORS: allowlist `CORS_ORIGINS`; vacío = permitir todos (documentado).
- Errores: `404` (NOT_FOUND, COIN_NOT_FOUND), `429` (UPSTREAM_RATE_LIMITED), `502` (primario con estado ≥400), `500` (INTERNAL_ERROR genérico).

## Qué NO existe (verificado) y por qué es seguro/aceptable

- Sin cookies/sesiones → sin CSRF ni session fixation.
- Sin uploads → sin malware subido ni análisis de tipos MIME.
- Sin templates → sin SSTI.
- Sin SQL → sin SQLi.
- Sin ejecución de comandos → sin command injection.
- Sin redirects construidos desde input (salvo `noopener` en frontend) → sin open redirect (verificar en producción).