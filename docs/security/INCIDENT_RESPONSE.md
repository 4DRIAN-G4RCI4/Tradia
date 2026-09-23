# Respuesta ante incidentes

> Procedimientos mínimos propuestos para Tradia. No existe actualmente un plan documentado; este documento es la guía base para cuando el proyecto pase a producción, y es compatible con el tamaño actual (1 desarrollador).

> **Estado actual: NO HAY OPERACIÓN EN PRODUCCIÓN.** Este runbook se aplica cuando `tradia` esté desplegado.

## 1. Qué se considera incidente

| Nivel | Definición | Ejemplo |
|---|---|---|
| S1 | Secreto expuesto, servidor comprometido, datos de usuarios | API key de CoinGecko comiteada; shell en el host |
| S2 | Indisponibilidad total / degradada de proveedor | CoinGecko 429 masivo; DNS caído |
| S3 | Comportamiento anómalo no crítico | Rate limit de más; feed RSS caído; warning de lint masivo |
| S4 | Sospecha sin confirmar | Ping de IP nuevo; scan de puertos |

## 2. Primera respuesta (10 minutos)

1. **Parar el sangrado:** si es dependencia/Comunicación externa comprometida → desconectar el host del tráfico (orchestrador/proxy down) o escalar por API. Si es secreto → rotarlo (revoke key) y eliminar el valor del repo/historial.
2. **Preservar evidencia:** capturar logs del servidor, timestamps, request IDs (añadir al logger cuando exista), snapshot del entorno; no borrar nada mientras se investiga.
3. **Comunicar:** avisar al propietario + notificar afectación a usuarios si procede (fuera de alcance hoy: no hay usuarios registrados).
4. **Respuesta verosímil:** si sale de intervalos esperados → involucrar a quien corresponda.

## 3. Runbooks específicos

### RUNBOOK A — CoinGecko/Binance devuelven 429/5xx sostenido
- Síntoma: picos de `UPSTREAM_RATE_LIMITED` o `502 INTERNAL_ERROR`.
- Causa típica: cuota free agotada por un bot o por tráfico alto (F-01, F-05).
- Acción: revisar métricas de cache (hits/misses); verificar con `GET /api/health` caché hits ≥ 90%; si es abuso → activar/ajustar rate limiting; si es cuota → subir plan o activar fallback.
- Prevención: circuit breaker y límite de concurrencia por proveedor.

### RUNBOOK B — Feed RSS caído o lento
- Síntoma: `[news] fallo al leer feed...` en logs; la API devuelve `[]`.
- Acción: verificar conectividad del feed; el sistema ya degrada con `[]` sin cachear. Vigilar reintentos.

### RUNBOOK C — Secreto comprometido
- Detección: grep/secret scanning (o alerta del proveedor).
- Acción inmediata: **rotar la clave** (revocar y emitir nueva), poner la nueva en el secret store, eliminar la antigua de cualquier archivo e historial de git (filtrar historial si ya hubo repo). Aplicar antes de cualquier otra tarea.
- Post-mortem: cómo llegó al repo (¿`.env` comiteado?) → añadir bloqueo (`.gitignore`, pre-commit hook).

### RUNBOOK D — Ataque de abuso/DoS a la API
- Síntoma: `429 UPSTREAM_RATE_LIMITED` del propio actor, alta latencia, cache keys inusuales.
- Acción: habilitar rate limit por IP/endpoint (F-01 pendiente); en hosting, firewall/WAF del borde (NO VERIFICABLE hoy).
- Verificación: revisar el mapa de claves de caché conocidas vs. esperadas.

## 4. Herramientas propuestas (mínimo viable)

| Necesidad | Herramienta sugerida | Entrega |
|---|---|---|
| Logging estructurado | `pino` en backend | JSON con timestamp y levels |
| Métricas | `prom-client` opcional + `/api/health` con stats | Hits/misses, cuota restante |
| Alertas | Simplest: cron + curl a `/api/health` cada minuto + notificación; o Pingdom/UptimeRobot cuando haya URL pública | Detección de indisponibilidad en <1 min |
| Secret scanning | `gitleaks` (local/CI) | Evita secretos en el repo |

## 5. Cadena de mando y dueños

- Propietario del servicio: desarrollador de Tradia (sin org en producción).
- Contactos: dependerán del hosting (NO VERIFICABLE DESDE EL REPOSITORIO).

## 6. Después del incidente (post-mortem ≤ 72 h)

1. Resumen cronológico (qué pasó, cuándo, impacto).
2. Causa raíz (no culpas).
3. Acciones correctivas concretas con dueño y fecha.
4. Acciones preventivas (tests, alertas, runbook actualizado).