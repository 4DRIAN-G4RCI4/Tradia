# Auditoría de seguridad de Tradia

> **Fecha:** 2026-09-23 · **Alcance:** repositorio completo `C:\Trabajos ADRIAN\Tradia` (backend + frontend) · **Método:** revisión estática + ejecución en vivo + pruebas manuales del proveedor.
> Docs de apoyo: `RISK_REGISTER.md` (hallazgos), `THREAT_MODEL.md`, `SECURITY_ARCHITECTURE.md`, `SECURITY_HEADERS.md`, `API_SECURITY.md`, `AUTHENTICATION_SECURITY.md`, `DEPENDENCY_SECURITY.md`, `INCIDENT_RESPONSE.md`, `docs/api/API_SECURITY.md`, diagramas en `docs/diagrams/`.

## 1. Resumen ejecutivo

**Tradia es un panel de cripto-información (SPA React + API Express) sin autenticación, sin base de datos y sin escritura.** Público y de solo lectura.

- **0** hallazgos CRÍTICO · **0** hallazgos ALTO · **5–6 MEDIO** · varios BAJO/INFO.
- Superficie de ataque mínima; los riesgos principales son **disponibilidad** (cuota compartida de CoinGecko), no confidencialidad.
- `npm audit`: **0 vulnerabilidades** en backend y frontend.
- **10 correcciones aplicadas durante la auditoría** (todas de bajo riesgo, verificadas por prueba): ver sección 22.
- **Para producción:** en primer lugar rate limiting + límite por defecto menor de `limit` + fijar `CORS_ORIGINS` + fallback de proveedor (F-01, F-02, F-05).

## 2. Alcance y método

Verificado desde el repositorio:
1. Lectura completa de `backend/src/*` y `frontend/src/*`.
2. Lectura de configuraciones (`package.json`, `.env(.example)`, `.gitignore`, `vite.config`, `index.html`, `oxlintrc`).
3. Ejecución: `npm audit` (0), `npm run build`, `npm run lint`, arranque del backend, pruebas `curl` de endpoints y headers.
4. Pruebas de abuso: parámetros extremos, paths, CORS, orígenes, errores de proveedor.

**Limitaciones:** entorno sin red global confiable a `api.coingecko.com` (bloqueos intermitentes EACCES) · sin hosting → nivel de borde **NO VERIFICABLE DESDE EL REPOSITORIO**.

## 3. Inventario de activos

| Activos | Categoría |
|---|---|
| Datos de mercado (precios, históricos, sparklines, tendencias, listado) | Público, con valor temporal |
| Noticias agregadas y análisis generado | Público, informativo |
| Cuota free tier de CoinGecko | Recurso escaso compartido |
| Caché en memoria, `.env` (sin secretos hoy), disponibilidad del sitio | Operativo |

## 4. OWASP Top 10 — Aplicación

Ver detalle en `API_SECURITY.md`. Resumen:

| Cat. | Resultado |
|---|---|
| A01/A02 (Control de acceso/fallo auth) | N/A (no hay identidad) |
| A03 (Inyección) | No vulnerable (sin SQL/shell/templates; React escapa; sin sinks XSS) |
| A04 (Diseño inseguro) | **MEDIO:** sin rate limiting → abuso upstream (F-01) |
| A05 (Misconfig) | Corregido (headers/errores/CORS); pendiente CSP estricta + HSTS |
| A06/A07 (Crypto/Integridad) | Sin datos sensibles; HTTPS dependiente del hosting (NO VERIFICABLE) |
| A08 (Integridad software) | deps audit 0; majors planificadas (F-11) |
| A09 (Monitoreo/logging) | Pendiente: observabilidad mínima (F-07) |
| A10 (SSRF) | No aplica (llamadas a URLs fijas de proveedores) |

## 5. Auditoría del código fuente (backend)

- **Express** con rutas `market/news/analysis`. Todos los endpoints públicos.
- **Validación de entrada:** corregida — `limit ≤250`, `days ≤365`, `q/coin ≤100`. Paths de `:id` resuelven por lookup o llamada upstream (404 seguro).
- **Errores:** genéricos al cliente; internos solo en logs (F-03 corregido).
- **Caché:** `maxKeys=2000` + single-flight (F-02 parcial, T2 mitigado).
- **Proveedores:** timeouts + retry 2× con backoff a CoinGecko; fallback Binance a histórico; feeds RSS con timeout y degradación `[]`.
- **Sin:** BD, ORM, comandos, plantillas, uploads, redirects por input.

## 6. Auditoría del código fuente (frontend)

- **Sin sinks XSS sustituibles** (`dangerouslySetInnerHTML` 0, `eval` 0, `innerHTML` 0, `document.write` 0). Todo el render es texto escapado por React. `verifyNoUnsafe` en ficheros confirmó.
- **localStorage:** solo `theme` y `extra-coins` (no sensible).
- **Errores:** `ErrorBoundary` añadido envolviendo la app (FASE 23).
- **Enlaces externos:** `rel="nofollow noopener noreferrer"` en el modal de noticias (F-08 parcial).
- **Accesibilidad/calidad:** `lang="es"`, claves estables por `link` (F-15).
- **Rendimiento:** bundle ~695 kB gzip ~212 kB sin code-splitting (F-12, informativo).

## 7. Headers de seguridad

Ver `SECURITY_HEADERS.md`. Resultado: **backend corregido y verificado** (4 cabeceras + `X-Powered-By` off). **Borde (HSTS/CSP estricta): NO VERIFICABLE DESDE EL REPOSITORIO** — pendiente de producción.

## 8. Autenticación y sesiones

**No existe.** Documentado en `AUTHENTICATION_SECURITY.md`: N/A de los chequeos de auth, por qué es seguro hoy y la receta para el día que se agregue.

## 9. Secretos y configuración

- **No hay secretos en el repositorio** (grep). `backend/.env` solo `PORT` y `TOP_N_COINS`. `.env.example` documenta variables incl. `CORS_ORIGINS`.
- `X-Content-Type-Options` etc. aplicadas por código (no dependen de env).
- `.gitignore` raíz correcto para `node_modules`, `dist`, `.env`, logs. (Sin `.git` el día de hoy.)

## 10. Gestión de dependencias

`DEPENDENCY_SECURITY.md`: audit 0/0. Majors pendientes (`express 5`, `dotenv 17/18`) planificadas, no urgentes. Sin CI gate de audit todavía.

## 11. Cumplimiento y privacidad

- Sin procesamiento de datos personales → **GDPR/CCPA prácticamente N/A**. Única consideración: IP del visitante viaja a terceros (Google Fonts, imágenes de noticias — F-08) → informar en política de privacidad y/o self-host.
- Sin consentimiento de cookies (no hay cookies).
- FedRAMP/SOC2/PIPEDA: N/A (no hay organización ni datos de usuarios).

## 12. Análisis de riesgo y amenazas

Ver `THREAT_MODEL.md` (STRIDE completo). Riesgos clave: **D1** abuso de cuota upstream (F-01) y **D3** degradación de proveedor (F-05). Sin CRITICO/ALTO.

## 13. Buena arquitectura y DYOR

El motor de análisis es **determinista por reglas** (sin LLM ni acciones). Incluye disclaimer (*"no constituye asesoría financiera"*) en cada análisis de mercado y de moneda. La app **no ejecuta operaciones financieras** — el apetito de riesgo se reduce a "información mostraba en pantalla".

## 14. Prevención de ataques comunes

| Ataque | Estado |
|---|---|
| SQL/NoSQL injection | Sin BD |
| XSS | React + sin sinks; CSP meta añadida |
| CSRF / clickjacking | Sin cookies; X-Frame-Options DENY |
| SSRF | URLs fijas |
| Path traversal | 404 (probado con `../../etc/passwd`) |
| Open redirect | No hay redirects por input |
| Rate abuse / DoS | **ABIERTO** — rate limiting pendiente (F-01) |
| Brute-force | N/A sin login |

## 15. Checklist de seguridad OWASP (prioridad)

| Control | Estado | Evidencia |
|---|---|---|
| Rate limiting | **ABIERTO** | F-01, demostrado con 429 en auditoría |
| Header Security | Corregido | `SECURITY_HEADERS.md` |
| CORS restringido | Configurable | `CORS_ORIGINS` verificado por prueba |
| CSP | Parcial (meta) | F-06; estricta pendiente en borde |
| Errores sin fuga | Corregido | prueba 502 genérico |
| Validación de inputs | Corregido | clamps probados |
| Cache controlada | Corregido | maxKeys + single-flight |
| Deps audit | 0/0 | `npm audit` |
| Tests de seguridad | **ABIERTO** | F-09 |
| Security headers CI | **ABIERTO** | F-10 |

## 16. Mejores prácticas de seguridad

Enlaces:OWASP Top 10 · OWASP ASVS · OWASP API Security Top 10 · Snyk Code · GitHub Security Lab. Recomendación: iniciar securidad desde el primer día del hosting con HSTS + CSP y rate limiting edge.

## 17. Recomendaciones tras la auditoría

1. Fijar el estado documentado y crear repo git para histórico + CI (F-10).
2. Implementar **rate limiting** y límite por defecto de `limit` (F-01) antes de exponer.
3. Implementar **fallback/circuit breaker** para CoinGecko (F-05) y observabilidad (F-07).
4. Migrar a Express 5 / dotenv 17+ en el próximo release (F-11).
5. Pasar la CSP a estricta (hash/nonce) y fijar `CORS_ORIGINS` en producción (F-06, F-02).

## 18. Referencias

`docs/{README, architecture/ARCHITECTURE, architecture/DATA_FLOW, architecture/COMPONENTS, api/API_SECURITY, security/*}` + diagramas Mermaid en `docs/diagrams/`.

## 19. Hallazgos de seguridad específicos

Correlación con `RISK_REGISTER.md`:

| ID | Título | Severidad | Estado |
|---|---|---|---|
| F-01 | Sin rate limiting; abuso de cuota CoinGecko | MEDIO | ABIERTO |
| F-02 | CORS `*` | BAJO | CORREGIDO (configurable) |
| F-03 | Fuga de errores internos | BAJO | CORREGIDO |
| F-04 | Headers ausentes + X-Powered-By | BAJO | CORREGIDO |
| F-05 | Dependencia única CoinGecko | MEDIO | ABIERTO |
| F-06 | Sin CSP estricta | MEDIO | MITIGADO (meta) |
| F-07 | Sin observabilidad | MEDIO | ABIERTO |
| F-08 | Recursos de terceros (privacidad) | BAJO | MITIGADO (rel nofollow) |
| F-09 | Sin tests | MEDIO | ABIERTO |
| F-10 | Sin CI/CD/git/Docker | BAJO | ABIERTO |
| F-11 | Deps major desactualizadas | BAJO | ABIERTO |
| F-12 | Bundle >500 kB | BAJO | ABIERTO |
| F-13 | Warnings set-state-in-effect | INFO | ABIERTO |
| F-14 | Sin engines | INFO | CORREGIDO |
| F-15 | lang/key de render | INFO | CORREGIDO |
| F-16 | Fecha inválida en sort de noticias | INFO | ABIERTO |
| F-18 | /api/health expone cacheStats | INFO | ABIERTO |

## 20. Priorización de correcciones

FASES de implementación sugeridas:
- **Fase A (antes de producir):** F-01 (rate limit + límite por defecto), F-05 (fallback/circuit breaker).
- **Fase B (al desplegar):** F-02 (fijar CORS), F-06 (CSP estricta), F-07 (log/metrics), HSTS.
- **Fase C (siguiente ciclo):** F-09 (tests), F-10 (CI/CD), F-11 (migrar majors).
- **Menores:** F-12, F-13, F-16.

## 21. Documentos adicionales

Listado completo en `docs/README.md`.

## 22. Lista de cambios aplicados (FASE 23)

Todas verificadas por lectura + prueba:

| Archivo | Cambio | Tipo |
|---|---|---|
| `backend/src/server.js` | `app.disable("x-powered-by")`; middleware headers; CORS allowlist; error genérico con `code: "INTERNAL_ERROR"` | Seguridad |
| `backend/src/config.js` | `corsOrigins` desde `CORS_ORIGINS` | Seguridad |
| `backend/.env.example` | Documenta `CORS_ORIGINS` | Config |
| `backend/src/routes/market.routes.js` | `toPositiveInt` + clamps `limit ≤250`, `days ≤365`, `q ≤100` | Input validation |
| `backend/src/routes/news.routes.js` | `coin` truncado a 100 | Input validation |
| `backend/src/services/cache.service.js` | `maxKeys=2000` + single-flight (inFlight Map) | Availability |
| `frontend/index.html` | `lang="es"` + CSP meta | Base + Headers |
| `frontend/src/main.jsx` | `ErrorBoundary` envuelve `<App />` | Robustez |
| `frontend/src/components/ErrorBoundary.jsx` | **nuevo** | Robustez |
| `frontend/src/components/NewsPreviewModal.jsx` | `rel="nofollow noopener noreferrer"` | Privacy |
| `frontend/src/pages/NewsPage.jsx` | `key={item.link \|\| i}` | Calidad |
| `frontend/src/pages/DashboardPage.jsx` | Variables sin uso eliminadas | Calidad |
| `package.json` ×3 | `engines.node >= 18` | Reproducible |

**Verificación post-cambio:** build OK · lint limpio (solo warnings preexistentes) · headers confirmados por curl · CORS restringido confirmado (origen permitido → header; origen ajeno → sin header) · errores genéricos confirmados (502 sin stack) · backend arranca y responde · auditoría de deps 0/0.

> Nota transparente: las correcciones de FASE 23 no cubren los hallazgos **ABIERTO** (F-01, F-05, F-06 en borde, F-07, F-09, F-10) porque requieren decisiones de producto o dependencias; quedan priorizados en la sección 20.

---

*Generado por auditoría técnica automatizada. Los hallazgos son verificables por los archivos y las pruebas referenciadas; los que dependen de infraestructura no presente están marcados NO VERIFICABLE DESDE EL REPOSITORIO.*