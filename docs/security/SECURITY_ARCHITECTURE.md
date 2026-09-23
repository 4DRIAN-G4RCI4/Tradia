# Arquitectura de seguridad de Tradia

> Descripción de las defensas **actuales** (verificadas por lectura + prueba) y las **pendientes**. Diagrama Mermaid: `docs/diagrams/security-flow.mmd`.

## 1. Resumen ejecutivo

| Dimensión | Estado | Detalle |
|---|---|---|
| Superficie de ataque | Mínima | API pública de solo lectura, sin auth, sin BD, sin escritura |
| Hallazgos CRÍTICO | 0 | — |
| Hallazgos ALTO | 0 | — |
| Hallazgos MEDIO | 6 | rate limiting, dependencia CoinGecko, CSP, observabilidad, tests, caché-input |
| Hallazgos BAJO/INFO | varios | CORS, privacidad terceros, bundle, deps pronto |
| Correcciones aplicadas | 10 | headers, CORS, errores, validación, caché, CSP, a11y, engines, key establas, rel=nofollow |
| Dependencias | 0 vulns | npm audit limpio en backend y frontend |

## 2. Capas de defensa (defensa en profundidad)

```
L1 Red/Borde (NO VERIFICABLE – sin hosting):
      HTTPS (TLS) · HSTS · firewall/WAF · rate limit de edge  -> PENDIENTE
L2 Aplicación (backend):
      Headers seguridad · CORS por allowlist · validación inputs ·
      errores genéricos · caché acotada + single-flight · timeouts/retry
L3 Frontend (navegador):
      CSP (meta) · React escapa (sin sinks XSS) · ErrorBoundary ·
      rel nofollow/opener/noreferrer · sin credenciales almacenadas
L4 Datos:
      Sin BD. Caché en memoria, TTL, maxKeys → no hay datos propios que robar
```

## 3. Decisiones de seguridad tomadas (y por qué)

1. **Errores genéricos al cliente.** El stack/contenido del error vive solo en logs. Evidencia: respuesta 502 ahora `{"message":"Error interno del servidor"}`.
2. **CORS por allowlist configurable.** `CORS_ORIGINS` (coma-separada) en `.env`. Vacío = permitir todo (compatibilidad). En producción fijar lista.
3. **Clamps en parámetros que generan caché y llamadas upstream.** `limit 250`, `days 365`, `q/coin 100`. Reducen el espacio de claves de caché abusables.
4. **`maxKeys=2000` + single-flight.** Acotan memoria y evitan la avalancha en misses simultáneos; clave en caché alternativa.
5. **CSP meta en el SPA.** `default-src 'self'`; se mantiene `'unsafe-inline'` por el script inline de tema; en borde debería subirse a CSP estricta con hash/nonce.
6. **No se introduce rate limiting todavía** (requiere dependencia + decisión de producto sobre límites); se documenta como pendiente crítico para producción.

## 4. Almacenamiento de secretos

- **No hay secretos en el repositorio** (grep verificado en todo el árbol; los únicos matches eran valores CSS y palabras genéricas).
- `backend/.env` solo `PORT` y `TOP_N_COINS`. `.gitignore` ignora `.env`.
- `.env.example` documenta todas las variables (incluye `CORS_ORIGINS`).
- Regla: cualquier API key futura debe ir a secret del proveedor de hosting y cargarse por variable de entorno; nunca commitear.

## 5. Dependencias y supply chain

- `npm audit`: 0 vulnerabilidades (backend 122 deps, frontend 137 deps).
- `npm outdated`: majors solos `express 5.x`, `dotenv 17+/18` — planificados, no urgentes.
- Sin lockfile compartido a nivel root (cada paquete gestiona el suyo). `package-lock.json` existe en backend y frontend → **no instalarlos a ciegas**.
- Pendiente recomendado: renovación automática (dependabot/renovate) cuando exista repo git.

## 6. Límites y no-objetivos (estado de producción)

- **Sin hosting/dominio/TLS verificado** → todo lo que depende del borde (HSTS, CSP por header, WAF) está **NO VERIFICABLE DESDE EL REPOSITORIO** y marcado PENDIENTE.
- **Sin despliegue** → no hay "attack surface de producción" que auditar todavía.
- **Sin colaboradores** → políticas de acceso a repo no aplican.

## 7. Cierre recomendado (para producción)

1. Añadir **rate limiting** y **límite por defecto menor** en `/top` (F-01).
2. Fijar `CORS_ORIGINS` al dominio real + CSP estricta por header con hash/nonce (F-02, F-06).
3. **CI/CD** mínimo: lint + build + `npm audit` en cada PR; deploy reversado (F-10).
4. **Observabilidad mínima**: logger estructurado + métricas de 429/502 (F-07).
5. Plan de fallback de proveedor con circuit breaker (F-05).