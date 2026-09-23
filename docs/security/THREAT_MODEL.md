# Modelo de amenazas de Tradia

> Metodología STRIDE aplicada al estado verificado del repositorio (2026-09-23). El diagrama Mermaid está en `docs/diagrams/threat-model.mmd`.

## 1. Activos a proteger

| # | Activo | Valoración |
|---|---|---|
| A1 | Datos de mercado (precios, históricos, sparklines) | Baja (públicos) pero **frescos** (valor temporal) |
| A2 | Noticias agregadas | Baja (públicas, CC) |
| A3 | Análisis generado por reglas | Baja (informativo, siempre con disclaimer) |
| A4 | **Cuota de API CoinGecko (free tier)** | **Alta** (recurso escaso y compartido) |
| A5 | Disponibilidad del sitio | Media |
| A6 | Configuración `.env` | Baja (solo PORT/TOP_N_COINS, sin secretos hoy) |
| A7 | Caché en memoria (NodeCache) | Media (si se envenena, todos ven datos corruptos por TTL) |

## 2. Actores y supuestos

| Actor | Capacidades (supuestas) |
|---|---|
| Usuario normal | Lee datos; script legítimo |
| Atacante externo / bot | HTTP arbitrario, sin autenticación, puede variar parámetros |
| Scraper automatizado | Alto volumen de requests |
| Proveedor comprometido | Puede entregar contenido/HTML malicioso en RSS o campos JSON |

**Supuesto clave:** la API de CoinGecko es usada sin clave; la cuota free tier es
compartida — los 429 del propio análisis lo confirman (evidencia en el registro).

## 3. Aplicación de STRIDE

### Spoofing
- No hay identidad/usuarios → **N/A**. Sin tokens ni credenciales verificables.

### Tampering (manipulación de datos)
- **T1 — Proveedor malicioso/comprometido:** un RSS malicioso puede inyectar HTML en `description`. React **escapa** HTML (no hay `dangerouslySetInnerHTML`), pero las **imágenes se extraen con regex** (`/https?:\/\/[^"\s]+\.(?:png|jpg|jpeg|gif|webp|svg)/i`). El HTML se vuelca en un `<img>` → no hay XSS, aunque la URL vendría de fuente no auditada (posible phishing visual con imagen enlazada). **Riesgo: BAJO.**
- **T2 — Claves de caché por input de usuario** (`search:${q}`, `top:${limit}`, `history:${id}:${days}`): un atacante controla el mapa de caché. Antes sin `maxKeys` → pobreza de entradas; ahora acotado a 2000 con single-flight. **Riesgo: MEDIO → MITIGADO.**

### Repudio
- No hay transacciones/acciones con consecuencias → **N/A**.

### Information disclosure
- **I1 — Errores:** antes exponían `err.message` (URLs/estados internos). **Corregido** (genérico). 
- **I2 — Headers:** `X-Powered-By` mostrado → **corregido**.
- **I3 — CORS `*`:** lectura por cualquier origen → **restringible** vía `CORS_ORIGINS`.
- **I4 — Privacidad:** IP del visitante llega a Google Fonts y a los CDN de imágenes de noticias (terceros sin aviso). **BAJO** (ver F-08).

### Denial of service
- **D1 — Agotamiento de cuota de CoinGecko (colateral):** un cliente varía parámetros para generar claves de caché únicas y forzar llamadas upstream. Impacto real demostrado en auditoría (429 masivo). **MEDIO** (bloquea a todos los usuarios). Necesita rate limiting (F-01).
- **D2 — Payload amplificado:** `limit=250` con sparklines ≈ **918 kB** por respuesta. Un bot con N conexiones amortiza; mitigado por caché, no por abuso de ancho de banda total.
- **D3 — Falta de circuit breaker:** si CoinGecko se degrada, cada petición espera retry con backoff (máx ~30 s). Sin cap de concurrencia propia → hilos esperando. **BAJO-MEDIO.**

### Elevation of privilege
- No hay niveles de privilegio → **N/A**.

## 4. Riesgos clave priorizados

| ID | Amenaza | Severidad | Mitigación actual | Mitigación pendiente |
|---|---|---|---|---|
| D1 | Abuso de cuota upstream | MEDIO | Caché+TTL, maxKeys, single-flight, clamps | Rate limiting por IP/endpoint, límite por defecto menor |
| D3 | Degradación proveedor | BAJO-MEDIO | Retry 2×, fallback Binance (histórico) | Circuit breaker, cache de negativos corto |
| T2 | Envenenamiento mapa de caché | MEDIO→BAJO | maxKeys=2000, clamp params | Rate limiting |
| I4 | Privacidad con terceros | BAJO | rel=nofollow, CSP meta | Self-host fonts, lazy-load imágenes |
| T1 | Contenido RSS malicioso | BAJO | React escapa HTML | Validar URL imagen por allowlist de dominios |
| D2 | Payload 918 kB | BAJO | TTL 90 s | Reducir sparklines bajo demanda o comprimir |

## 5. Fuera de alcance del modelo

- Ataques a infraestructura de hosting (no existe hosting verificado — NO VERIFICABLE).
- Ataques a la capa de red/TLS (local, sin TLS — producción sería HTTPS).
- Ingeniería social sobre operadores (repositorio local, sin operadores).