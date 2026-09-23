# Componentes de Tradia

> Inventario verificado leyendo el código. Tipo · archivo · dependencias · riesgos notables.

## 1. Backend

| Componente | Archivo | Dependencias | Notas de seguridad/calidad |
|---|---|---|---|
| Servidor | `backend/src/server.js` | express, cors, config | Desactiva `X-Powered-By`; aplica headers de seguridad; CORS por `CORS_ORIGINS`; errores genéricos |
| Config | `backend/src/config.js` | dotenv | `PORT`, `TOP_N_COINS`, `CORS_ORIGINS`, TTLs, feeds RSS. No contiene secretos |
| Rutas mercado | `backend/src/routes/market.routes.js` | coingecko, binance | Valida `limit ≤250`, `days ≤365`, `q ≤100` |
| Rutas noticias | `backend/src/routes/news.routes.js` | news.service | Valida `coin ≤100` |
| Rutas análisis | `backend/src/routes/analysis.routes.js` | coingecko, news, analysis, cache | GET cacheado / POST genera (900 s TTL) |
| Cliente CoinGecko | `backend/src/services/coingecko.service.js` | axios, cache, config | timeout 10 s · retry 2× en 429/5xx con backoff 500 ms·2^n |
| Cliente Binance | `backend/src/services/binance.service.js` | axios, cache | timeout 8 s · mapa id→par USDT (solo pares reales) |
| RSS | `backend/src/services/news.service.js` | rss-parser, cache | timeout 10 s · UA `TradiaBot/1.0` · regex de imagen sobre HTML externo |
| Caché | `backend/src/services/cache.service.js` | node-cache | `maxKeys=2000` · `single-flight` · TTLs por clave |
| Motor de análisis | `backend/src/services/analysis.service.js` | formatters | Diccionarios POS/NEG · `analyzeCoin`, `analyzeMarket` · disclaimer en la salida |
| Formateadores | `backend/src/utils/formatters.js` | — | `formatUsd` (`null`→`N/D`), `formatPct` |

## 2. Frontend

| Componente | Archivo | Rol | Notas |
|---|---|---|---|
| Bootstrap | `src/main.jsx` | React root | BrowserRouter + ErrorBoundary |
| App | `src/App.jsx` | Rutas `/` y `/noticias` | NavBar/Disclaimer/Footer comunes |
| Proveedor de datos | `src/MarketDataProvider.jsx` | Polling compartido (60 s) + monedas extra | `localStorage` `tradia-extra-coins` |
| Cliente API | `src/api/client.js` | axios `baseURL: "/api"` | Sin credenciales ni tokens |
| Tema | `src/theme.jsx`, `useTheme.js` | Clase `dark` + localStorage | `tradia-theme` (no sensible) |
| Páginas | `pages/DashboardPage.jsx`, `pages/NewsPage.jsx` | Vistas | — |
| Componentes | `components/*` (16) | UI | Ver abajo |
| Hooks | `hooks/*` (9) | Lógica reutilizable | Fetch con cancelación (`cancelled`) |

### Componentes notables y sus riesgos

| Componente | Riesgo evaluado | Estado |
|---|---|---|
| `CryptoChart.jsx` (Recharts) | Datos de terceros → SVG, sin HTML crudo | Sin hallazgo |
| `NewsPreviewModal.jsx` | Enlace externo con `rel="nofollow noopener noreferrer"` | Corregido |
| `NewsPage.jsx` | Claves por `item.link` (antes `key={i}`) | Corregido |
| `AiAnalysisPanel.jsx` | Renderiza `summary` partido por `\n\n` como texto (React escapa) | Sin hallazgo |
| `CoinTooltip` / `Sparkline` / `TickerTape` | Solo texto y SVG | Sin hallazgo |
| `AddCoinPanel` | Escribe `localStorage` de monedas | Datos no sensibles |
| `index.css` | Sin `url()` a dominios externos (salvo assets locales) | Sin hallazgo |
| `index.html` | CSP meta `script-src 'self'` + Google Fonts | Mitigación añadida |

## 3. Dependencias en producción

**Backend:** `express`, `cors`, `dotenv`, `axios`, `node-cache`, `rss-parser`
**Frontend:** `react`, `react-dom`, `react-router-dom`, `recharts`, `axios`
**Dev (root):** `concurrently` · **Dev (frontend):** `vite`, `@vitejs/plugin-react`, `oxlint`, tipos React

`npm audit`: **0 vulnerabilidades** en backend y frontend (verificado 2026-09-23).

## 4. Terceros y proveedores

| Proveedor | Uso | Auth requerida | Sustitución posible |
|---|---|---|---|
| CoinGecko | Precios, global, trending, list, search, fallback histórico | No (free tier) | Sí (limitada) |
| Binance | Histórico klines | No | Sí (pares limitados) |
| CoinDesk / Cointelegraph | Noticias RSS | No | Sí (otros RSS) |
| Google Fonts | Tipografías | No | Sí (self-host) |

## 5. Analytics, cookies y almacenamiento

- **No hay** analytics, cookies, tracking, posts de terceros ni `postMessage`.
- **Almacenamiento local** (cliente): `tradia-theme`, `tradia-extra-coins`. Ninguno sensible.
- **No hay** datos de usuario, IPs ni sesiones registrados por la app.