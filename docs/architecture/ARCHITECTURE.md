# Arquitectura de Tradia

> Actualizada: 2026-09-23 · Alcance: repositorio local (`C:\Trabajos ADRIAN\Tradia`)

## 1. Arquitectura actual (verificada en el repositorio)

Tradia es una aplicación **SPA + API** de dos capas, sin base de datos, sin
autenticación y sin procesamiento financiero (solo lectura de datos públicos).

```
Navegador (React 19 + Vite 8 + Recharts)
        │  axios → /api (proxy en dev)
        ▼
Express API (:4000)
        │  NodeCache (TTLs por dato)
        ▼
CoinGecko API v3 · Binance API v3 · RSS CoinDesk/Cointelegraph
```

### Componentes funcionales

| Capa | Módulos | Responsabilidad |
|---|---|---|
| Frontend | `App.jsx`, `pages/` | Rutas `/` (dashboard) y `/noticias` |
| Frontend | `MarketDataProvider.jsx` + `hooks/*` | Estado compartido, polls con TTL, fetch único por dato |
| Frontend | `components/*` | Tabla, ticker, chart (Recharts), tooltip, conversor, noticias, panel de análisis |
| Backend | `routes/*` | Enrutado `/api/market`, `/api/news`, `/api/analysis` |
| Backend | `services/coingecko.service.js` | Cliente CoinGecko con retry + backoff y normalización |
| Backend | `services/binance.service.js` | Históricos klines de Binance (fallback del histórico) |
| Backend | `services/news.service.js` | RSS parse con `rss-parser`, extracción de imagen |
| Backend | `services/analysis.service.js` | Motor de análisis por reglas (diccionarios de sentimiento) |
| Backend | `services/cache.service.js` | `NodeCache` con TTL, `maxKeys`, single-flight |
| Backend | `config.js` | Configuración por variables de entorno |

### Endpoints expuestos

| Método | Ruta | Descripción | Cache TTL |
|---|---|---|---|
| GET | `/api/health` | Salud + stats de caché | — |
| GET | `/api/market/top?limit=` | Top N monedas (≤250) | 90 s |
| GET | `/api/market/global` | Estadísticas globales | 120 s |
| GET | `/api/market/trending` | Tendencias | 300 s |
| GET | `/api/market/all` | Lista completa de monedas | 6 h |
| GET | `/api/market/search?q=` | Búsqueda por texto (q ≤100) | 600 s |
| GET | `/api/market/:id/history?days=` | Histórico (days ≤365) | 300 s |
| GET | `/api/market/:id` | Detalle de una moneda | 90 s |
| GET | `/api/news?coin=` | Noticias (filtro coin ≤100) | 600 s |
| GET | `/api/analysis/coin/:id` | Análisis cacheado (lectura) | — |
| POST | `/api/analysis/coin/:id` | Genera análisis de una moneda | 900 s |
| GET | `/api/analysis/market` | Análisis de mercado cacheado | — |
| POST | `/api/analysis/market` | Genera análisis de mercado | 900 s |

Todos los endpoints son **públicos y de solo lectura**. No hay acciones
escritura, trading, fondos ni datos de usuarios.

## 2. Puntos fuertes de la arquitectura actual

- **Caché de servidor** para casi todos los datos: protege la cuota free de CoinGecko y da respuestas rápidas.
- **Frontend con polling compartido**: un solo fetch por dato (no N fetches por componente), con debounce en búsqueda y cancelación de efectos con `cancelled`.
- **Single-flight** en caché: evita la avalancha (thundering herd) en misses simultáneos.
- **Retry + backoff exponencial** hacia CoinGecko (429/5xx) con timeout (8–10 s).
- **Fallback Binance → CoinGecko** para históricos.
- **Degradación grácil**: feeds RSS con error devuelven `[]` y no se cachean vacíos.

## 3. Punto único de fallo (riesgo arquitectónico)

- **CoinGecko es la fuente primaria de casi todo** (top, global, trending, list,
  search, y fallback de histórico). Es un proveedor free tier con cuota muy
  limitada; si cae o se agota la cuota → `502/429` para la app. Binance solo
  cubre ~20 monedas del histórico.
- **Sin rate limiting propio**: un cliente puede agotar la cuota compartida
  (colateral DoS). Mitigado parcialmente con caché + TTL + clamp de parámetros.

## 4. Vacíos de producción (ver FASE 18-19 de la auditoría)

- No hay Docker, CI/CD, hosting, dominio ni configuración TLS (proyecto local).
- No hay tests automatizados.
- No hay Logging estructurado, métricas ni alertas.

## 5. Estructura recomendada para crecimiento (evolutiva, no impuesta)

La estructura actual es correcta para el tamaño del proyecto. No se propone una
reorganización de archivos. Para crecer sin deuda técnica:

```
backend/src/
  controllers/       # rutas actuales → handlers delgados
  services/          # ya existe (coingecko, binance, news, analysis)
  repositories/      # si se agrega base de datos
  middleware/        # rate-limit, validación, headers, errores
  validators/        # esquemas de parámetros (zod/joi)
frontend/src/
  api/               # ya existe
  components/        # ya existe (agrupar en componentes/feature/)
  hooks/             # ya existe
  pages/             # ya existe
  types/             # contratos compartidos con el backend
  config/            # constantes y env del cliente
tests/
  unit/              # analysis.service, formatters, validators
  integration/       # rutas + caché + mocks de proveedores
  e2e/               # flujo dashboard/noticias (Playwright)
  security/          # zapatillas: headers, inyección, límites
docs/                # esta carpeta (seguridad, arquitectura, diagramas)
scripts/             # scripts de mantenimiento
infrastructure/      # Dockerfile, compose, nginx, CI cuando existan
```

Regla: **no** se mueven archivos en esta auditoría; se documenta la evolución
recomendada para cuando el alcance lo justifique.

## 6. Decisión registrada (ADR breve)

- **¿Se agrega base de datos?** No por ahora: todos los datos son de terceros y
  se cachean en memoria. Una BD tendría sentido solo para guardar favoritos o
  usuarios.
- **¿Se agrega autenticación?** No: el valor del producto es informativo. Si se
  agrega, ver `docs/security/AUTHENTICATION_SECURITY.md` para el diseño seguro.