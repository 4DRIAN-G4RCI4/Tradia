# Checklist de seguridad y producción — Tradia

> Estado verificado a 2026-09-23. Estados posibles: **PASS** (verificado en repo/prueba), **FAIL** (hallazgo abierto), **N/A** (no aplica por diseño), **NOT VERIFIED** (depende de infraestructura ausente).
> Evidencia entre corchetes: archivo o prueba que lo respalda.

## A. Seguridad de red y transporte

| # | Control | Estado | Evidencia |
|---|---|---|---|
| A1 | HTTPS/TLS en producción | NOT VERIFIED | Sin hosting (`docs/diagrams/deployment.mmd`) |
| A2 | HSTS (Strict-Transport-Security) | NOT VERIFIED | Sin hosting; pendiente borde (`SECURITY_HEADERS.md`) |
| A3 | Cabeceras de seguridad backend | **PASS (corregido)** | `server.js` middleware `securityHeaders`; probado por curl: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` |
| A4 | `X-Powered-By` no expuesto | **PASS** | `app.disable("x-powered-by")`; curl confirma ausencia |
| A5 | CSP (Content-Security-Policy) | **PASS (parcial) / FAIL (estricta)** | Meta CSP en `index.html` (mitigación). CSP estricta por header con nonce/hash pendiente (F-06) |
| A6 | CORS restringido a orígenes propios | **PASS (configurable)** | `CORS_ORIGINS`; probado: origen ajeno no recibe header CORS |

## B. Autenticación, autorización y sesiones

| # | Control | Estado | Evidencia |
|---|---|---|---|
| B1 | Autenticación sólida | N/A | No existe auth (`AUTHENTICATION_SECURITY.md`) |
| B2 | Sesiones con cookie segura (HttpOnly/Secure/SameSite) | N/A | Sin sesiones ni cookies |
| B3 | Control de acceso por rol | N/A | Sin usuarios/roles |
| B4 | Protección de endpoints de escritura | N/A | Solo GET y POST informativos, cacheados |
| B5 | CSRF | N/A | Sin cookies de autenticación |
| B6 | Sesión de usuario en eliminación/expiración | N/A | N/A |
| B7 | Política de contraseñas / MFA / lockout | N/A | N/A |
| B8 | JWTs/credenciales no expuestas en logs ni client | N/A | No se emiten credenciales |

## C. Datos y entrada

| # | Control | Estado | Evidencia |
|---|---|---|---|
| C1 | Validación de entrada en API | **PASS (corregido)** | Clamps en `market.routes.js`/`news.routes.js`; probado `days=99999`, `q=8000 chars`, `limit=999999` |
| C2 | Límites de tamaño/rate limiting | **FAIL (abierto)** | Sin rate limiting (F-01); payload por `limit=250` ≈ 918 kB |
| C3 | Sinks inseguros (eval/innerHTML/dangerouslySetInnerHTML/document.write) | **PASS** | 0 en `frontend/src`; React escapa texto |
| C4 | Inyección SQL/NoSQL/comando | **PASS** | Sin BD, sin shell |
| C5 | Path traversal | **PASS** | Probado `GET /api/market/../../etc/passwd` → 404 |
| C6 | SSRF | **PASS** | Solo URLs fijas de proveedores |
| C7 | Open redirect | **PASS** | Sin redirección por input |
| C8 | Serialization insegura | **PASS** | JSON simple; datos públicos |
| C9 | Fugas de datos en errores | **PASS (corregido)** | Error 502 devuelve mensaje genérico; detalles solo en logs |
| C10 | Protección de datos sensibles en repositorio | **PASS** | grep de secretos limpio; `.gitignore` cubre `.env` |

## D. Dependencias y supply chain

| # | Control | Estado | Evidencia |
|---|---|---|---|
| D1 | `npm audit` sin vulnerabilidades | **PASS** | Backend 0/122, frontend 0/137 |
| D2 | Vulnerabilidades conocidas en runtime/deps | **PASS** | Audit 0; majors (`express 5`, `dotenv 17`) sin CVE (F-11) |
| D3 | Actualizaciones automáticas (Dependabot/Renovate) | NOT VERIFIED | Sin repo git aún (F-10) |

## E. Monitorización y respuesta

| # | Control | Estado | Evidencia |
|---|---|---|---|
| E1 | Logging centralizado/estructurado | **FAIL (abierto)** | `console.*` dispersos; no hay pino ni request IDs (F-07) |
| E2 | Métricas/alarmas de disponibilidad | **FAIL (abierto)** | Solo `/api/health` con cacheStats (F-07, F-18) |
| E3 | Plan de respuesta ante incidentes | **PASS (doc) / NOT VERIFIED (en prod)** | `INCIDENT_RESPONSE.md` creado; sin operación real |
| E4 | Plan de recuperación (backups, DR) | **PASS (no requerido)** | Sin BD ni datos propios; DR = reiniciar + caché se repuebla |

## F. Aplicación y código

| # | Control | Estado | Evidencia |
|---|---|---|---|
| F1 | Tests unitarios | **FAIL (abierto)** | No existen (F-09) |
| F2 | Tests de integración con mocks | **FAIL (abierto)** | No existen |
| F3 | Tests E2E | **FAIL (abierto)** | No existen |
| F4 | Lint limpio (integrador) | **PASS (parcial)** | Oxlint: 0 errores; 5 warnings `set-state-in-effect` preexistentes (F-13) |
| F5 | Build de producción exitoso | **PASS** | `npm run build` OK en frontend |
| F6 | Code-splitting / bundle sane | **FAIL (menor)** | Chunk ~695 kB > 500 kB sin lazy (F-12) |
| F7 | Error boundary global | **PASS (corregido)** | `ErrorBoundary.jsx` en `main.jsx` |
| F8 | Claves estables en listas | **PASS (corregido)** | `key={item.link \|\| i}` (F-15) |
| F9 | Atributo de idioma correcto | **PASS (corregido)** | `lang="es"` (F-15) |
| F10 | Enlaces externos con rel seguro | **PASS (corregido)** | `rel="nofollow noopener noreferrer"` (F-08) |
| F11 | Reproductibilidad (engines/Node) | **PASS (corregido)** | `engines.node >= 18` en los 3 package.json (F-14) |

## G. DevOps y despliegue

| # | Control | Estado | Evidencia |
|---|---|---|---|
| G1 | Repositorio git con protección de ramas | **FAIL (abierto)** | Sin `.git` (F-10) |
| G2 | CI (lint + build + audit) | **FAIL (abierto)** | Sin workflows (F-10) |
| G3 | CD / despliegue reversado | **FAIL (abierto)** | Sin pipeline/hosting |
| G4 | Contenedorización (Docker/Cow) | **FAIL (abierto)** | Sin Dockerfile (F-10); propuesta en `deployment.mmd` |

## H. Producto y riesgos residuales

| # | Control | Estado | Evidencia |
|---|---|---|---|
| H1 | Disclaimer de análisis de mercado | **PASS** | `analysis.service.js` `buildAnalysis` incluye disclaimer |
| H2 | Sin acciones financieras automáticas | **PASS** | Solo lectura e info; sin trading/órdenes |
| H3 | Dependencia de proveedores externos | **FAIL (abierto)** | CoinGecko free tier frágil (429 observado); fallback Binance solo histórico (F-05) |
| H4 | Política de privacidad visible | **FAIL (menor)** | No existe; comunicar terceros (Google Fonts/imágenes) (F-08) |

---

### Resumen de estados

| Estado | Total |
|---|---|
| PASS | 22 |
| FAIL | 12 (9 de madurez/producto + 3 menores) |
| N/A | 11 |
| NOT VERIFIED | 3 |

Mínimos para ir a producción con confianza: **A1–A3, A6, D1, E2 y G2** (`FAIL` en F-01/F-05/F-07/F-10 quedan bloqueantes suaves; decisión del propietario).