# Registro de riesgos de Tradia

> Estado verificable en el repositorio a 2026-09-23. Severidad solo: CRÍTICO / ALTO / MEDIO / BAJO / INFORMATIVO. Una hallazgo se cataloga "corregido" solo si la evidencia (lectura + prueba) confirma el cambio.

## Leyenda

| Campo | Valores |
|---|---|
| Severidad | CRÍTICO · ALTO · MEDIO · BAJO · INFORMATIVO |
| Probabilidad | Alta · Media · Baja · N/A |
| Impacto | Disponibilidad · Integridad · Confidencialidad · Privacidad · Madurez |
| Estado | ABIERTO · MITIGADO · CORREGIDO · N/A · NO VERIFICABLE |

---

## F-01 — Sin rate limiting; abuso de cuota de CoinGecko (DoS colateral)

- **Categoría:** Disponibilidad / OWASP A04 (Diseño inseguro) + API08 (SoS: sin límite de recurso).
- **Evidencia:** `backend/src/server.js` no tiene rate limiting (sin `express-rate-limit` ni proxy intermedio). Durante la propia auditoría, la cuota free tier de CoinGecko se **agotó** y las respuestas pasaron a `429 {"code":"UPSTREAM_RATE_LIMITED"}`.
- **Archivo/ubicación:** `server.js`, `routes/market.routes.js` (parámetro `limit` 1..250, `q` cacheada por valor).
- **Impacto:** Un cliente/bot puede variar parámetros (`limit`, `q`, `:id`, `days`) → claves de caché distintas → cada una dispara llamadas a CoinGecko → agota la cuota compartida del backend → **todos** los usuarios ven 429/502 (DoS colateral) y el cache se llena (ya acotado a 2000).
- **Probabilidad:** Alta. **Severidad:** MEDIO.
- **Solución:** rate limiting por IP + por endpoint (p. ej. 30 req/min global, 10 req/min para `/search` y `POST /analysis/*`, o cap de claves distintas por ventana); aumentar TTLs; límite de `limit` por defecto en 100.
- **Prioridad:** Alta. **Estado:** ABIERTO (requiere dependencia/cambios de comportamiento; no es corrección de bajo riesgo).

## F-02 — CORS abierto por defecto (`*`)

- **Categoría:** Confidencialidad / OWASP API05 (BFLA no aplica, pero sí lectura cruzada).
- **Evidencia:** antes de la corrección, `server.js` usaba `app.use(cors())` y la respuesta incluía `Access-Control-Allow-Origin: *`.
- **Impacto:** Hoy son datos públicos y sin auth → impacto bajo. Se vuelve relevante si se agrega autenticación o endpoints con datos propios.
- **Probabilidad:** Baja. **Severidad:** BAJO.
- **Solución aplicada:** CORS configurable vía `CORS_ORIGINS` (lista). En producción fijar el dominio real.
- **Verificación:** con `CORS_ORIGINS=http://localhost:5173`, un `Origin` permitido recibe `Access-Control-Allow-Origin`; `https://evil.example.com` **no** recibe header CORS (bloqueado). Con var vacía mantiene el comportamiento previo (permitir todo).
- **Estado:** CORREGIDO (configurable) / ABIERTO en producción (fijar origen).

## F-03 — Fuga de detalles internos en errores HTTP

- **Categoría:** Confidencialidad / OWASP security misconfiguration.
- **Evidencia:** antes, el error handler devolvía `message: err.message` (mensajes internos de axios/URLs). Tras la corrección devuelve genérico.
- **Probabilidad:** Media. **Severidad:** BAJO (no expone secretos, pero da superficie de reconocimiento).
- **Solución aplicada:** mensaje `"Error interno del servidor"` + `code: "INTERNAL_ERROR"`; detalles solo en `console.error` del servidor.
- **Verificación:** `GET /api/market/not-a-real-coin-xyz/history` → `502 {"error":{"message":"Error interno del servidor","code":"INTERNAL_ERROR"}}` sin stack ni URLs.
- **Estado:** CORREGIDO.

## F-04 — Headers de seguridad ausentes + `X-Powered-By`

- **Categoría:** Security misconfiguration.
- **Evidencia:** la respuesta no tenía `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; sí exponía `X-Powered-By: Express`.
- **Probabilidad:** Media. **Severidad:** BAJO.
- **Solución aplicada en `server.js`:** middleware `securityHeaders` con las 4 cabeceras + `app.disable("x-powered-by")`.
- **Verificación:** curl confirma headers presentes y `X-Powered-By` ausente.
- **Estado:** CORREGIDO (ver `SECURITY_HEADERS.md` para estado en producción: NO VERIFICABLE).

## F-05 — Dependencia casi exclusiva de CoinGecko (disponibilidad)

- **Categoría:** Disponibilidad / supply-chain de datos.
- **Evidencia:** `market.routes.js` usa CoinGecko para top/global/trending/all/search y fallback de histórico. Binance solo cubre pares USDT seleccionados. Durante la auditoría CoinGecko devolvió 429 (cuota free) y el sandbox bloqueó conexiones intermitentemente.
- **Probabilidad:** Media. **Severidad:** MEDIO.
- **Solución:** fallback secundario (p. ej. Binance para precios en vivo, otra API free como CoinCap; o tolerancia con "datos no disponibles" degradados), circuit breaker y rate limiting.
- **Prioridad:** Alta. **Estado:** ABIERTO.

## F-06 — Sin CSP estricta (mitigada en build)

- **Categoría:** Confidencialidad/Integridad / XSS (surface).
- **Evidencia:** el SPA se sirve sin cabecera CSP. Se añadió `<meta http-equiv="Content-Security-Policy">` en `index.html` con `script-src 'self' 'unsafe-inline'` (necesario por el `<script>` inline de tema). No hay sinks XSS (sin `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `document.write`).
- **Probabilidad:** Baja. **Severidad:** MEDIO (parcialmente mitigado).
- **Solución:** CSP estricta son nonce/hash en el servidor/hosting (`default-src 'self'`, sin `unsafe-inline`); mover script de tema a archivo externo o backend inline con hash.
- **Estado:** MITIGADO (meta CSP) / ABIERTO (CSP estricta por header en borde).

## F-07 — Sin observabilidad: logging plano, sin métricas ni alertas

- **Categoría:** Madurez / detección de incidentes.
- **Evidencia:** `console.error`/`console.log` dispersos; no hay nivel de log estructurado, tamaño/trace IDs, métricas de cuota ni alertas.
- **Probabilidad:** N/A. **Severidad:** MEDIO (madurez).
- **Solución:** logger estructurado (pino), métricas de cache/upstream, alertas cuando la tasa de 429/502 supere umbral.
- **Estado:** ABIERTO.

## F-08 — Recursos de terceros en el frontend (privacidad)

- **Categoría:** Privacidad.
- **Evidencia:** `index.html` carga Google Fonts; las noticias enlazan imágenes de `ctmedia.io`, `sanity.io`, `coingecko.com`; enlaces externos en el modal de noticias (ahora con `rel="nofollow noopener noreferrer"`).
- **Probabilidad:** Alta (siempre ocurre). **Severidad:** BAJO.
- **Solución:** self-host de fuentes; proxy o `loading="lazy"` en imágenes de noticias; ya añadido `nofollow noopener noreferrer`.
- **Estado:** MITIGADO parcialmente (rel añadido) / ABIERTO (self-host).

## F-09 — Sin tests automatizados

- **Categoría:** Madurez / regresión.
- **Evidencia:** no existe suite de tests en backend ni frontend.
- **Probabilidad:** N/A. **Severidad:** MEDIO (madurez).
- **Solución:** tests unitarios del motor de análisis y validadores; integración de rutas con mocks de proveedores; e2e de dashboard/noticias.
- **Estado:** ABIERTO.

## F-10 — Sin CI/CD, git, Docker ni hosting

- **Categoría:** Madurez / supply-chain.
- **Evidencia:** no hay `.git/`, ni workflows, ni Dockerfile, ni config de hosting ni dominio.
- **Probabilidad:** N/A. **Severidad:** BAJO (madurez).
- **Solución:** iniciar repo git, proteger rama principal, GitHub Actions (lint+build+audit), dependabot, deployment reversado.
- **Estado:** ABIERTO / NO VERIFICABLE.

## F-11 — Dependencias con versión principal desactualizada

- **Categoría:** Supply-chain.
- **Evidencia (backend, `npm outdated` 2026-09-23):** `express ^4.22.3 → 5.2.1`, `dotenv ^16.6.1 → 18.0.3`. Frontend: todo al día. `npm audit`: 0 vulnerabilidades en ambos.
- **Probabilidad:** Baja (sin CVE conocida hoy). **Severidad:** BAJO.
- **Solución:** migrar a Express 5 y dotenv 17/18 con sus breaking changes cuando el momento lo permita; no bloqueante (audit limpio).
- **Estado:** ABIERTO (planificado, no urgente).

## F-12 — Bundle de frontend > 500 kB sin code-splitting

- **Categoría:** Performance.
- **Evidencia:** build genera `index-CH453Pf3.js` ~695 kB (gzip ~212 kB) y Vite avisa chunks > 500 kB.
- **Probabilidad:** N/A. **Severidad:** BAJO (performance).
- **Solución:** `React.lazy` para Recharts/páginas; reducir data innecesaria en el payload (duplicar con /all ya cargado).
- **Estado:** ABIERTO.

## F-13 — Warnings de lint (`set-state-in-effect`)

- **Categoría:** Calidad de código.
- **Evidencia:** `npm run lint` (oxlint) reporta 5 avisos `react(set-state-in-effect)` (preexistentes, no introducidos por la auditoría).
- **Probabilidad:** N/A. **Severidad:** INFORMATIVO.
- **Solución:** reestructurar con wrapper `useAsyncData` o filtrar con `useMemo`; también validar que se han eliminado las variables sin uso de `DashboardPage.jsx`.
- **Estado:** ABIERTO (menor).

## F-14 — Sin `engines` ni pin de versión de Node

- **Categoría:** Reproducibilidad.
- **Evidencia:** no había campo `engines` en los `package.json`; la app corre en Node 24.16.
- **Solución aplicada:** `engines.node >= 18` añadido a root, backend y frontend.
- **Estado:** CORREGIDO.

## F-15 — Accesibilidad y claves de render

- **Categoría:** Calidad / a11y.
- **Evidencia:** `index.html` tenía `lang="en"` (es una app en español) y `NewsPage` usaba `key={i}`.
- **Solución aplicada:** `lang="es"`; `key` estable basado en `item.link`.
- **Estado:** CORREGIDO.

## F-16 — Estados de datos inválidos en noticias (orden)

- **Categoría:** Integridad de datos.
- **Evidencia:** `news.service.js` ordena con `new Date(item.publishedAt)`; ante una fecha malformada (fuente externa) el `sort` puede ser inestable (NaN). No rompe la app (no lanza).
- **Probabilidad:** Baja. **Severidad:** INFORMATIVO.
- **Solución:** `Number.isNaN(t) ? 0 : t` en el comparador.
- **Estado:** ABIERTO (menor).

## F-18 — `/api/health` expone estadísticas de caché

- **Categoría:** Confidencialidad (baja).
- **Evidencia:** `GET /api/health` devuelve `cacheStats` (hits/misses/keys/ksize/vsize). Informativo y útil para ops; no es sensible hoy.
- **Probabilidad:** Baja. **Severidad:** INFORMATIVO.
- **Solución:** dejar como está; mover a `/metrics` protegido cuando haya monitoreo.
- **Estado:** ABIERTO (opcional).

---

## Comprobaciones que dieron limpio (evidencia)

| Comprobación | Resultado |
|---|---|
| `npm audit` backend (122 deps) | 0 vulnerabilidades |
| `npm audit` frontend (137 deps) | 0 vulnerabilidades |
| Secretos en el repositorio | Sin secretos (claves, tokens, contraseñas) |
| Sinks XSS en React (`dangerouslySetInnerHTML`, `eval`, `innerHTML`, `document.write`) | 0 |
| Inyección SQL / NoSQL / comando | 0 (no hay BD ni shell) |
| Path traversal (`../../etc/passwd`) | 404 (no vulnerable) |
| Autorización / IDOR | N/A (no hay usuarios ni datos propios) |
| CSRF | N/A (no hay sesiones/cookies) |
| Cookie de sesión | N/A (no hay cookies) |
| Almacenamiento local | Solo `theme` y `extra-coins` (no sensible) |

## Prioridad de cierre

1. **Alta:** F-01 rate limiting + límite por defecto de `limit`; F-05 fallback/circuit breaker.
2. **Media:** F-06 CSP estricta en borde; F-07 observabilidad; F-09 tests.
3. **Baja:** F-02 fijar `CORS_ORIGINS` en producción; F-08 self-host de fuentes; F-11 migración Express 5; F-12 code-splitting; F-13/F-16 menores.
4. **Cerrado:** F-03, F-04, F-14, F-15 (verificación por prueba). F-02 parcial (configurable). F-06 parcial (meta CSP). F-08 parcial (rel nofollow).