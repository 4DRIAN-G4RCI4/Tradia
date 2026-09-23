# Seguridad de dependencias

> Estado verificado a 2026-09-23. Comandos ejecutados con la caché local de npm.

## 1. Resumen de resultados

| Paquete | `npm audit` | `npm outdated` (majors) |
|---|---|---|
| **Raíz** (script con `concurrently`) | 0 vulnerabilidades | — |
| **Backend** (122 deps) | **0 vulnerabilidades** | `express 4.22.3 → 5.2.1` · `dotenv 16.6.1 → 18.0.3` |
| **Frontend** (137 deps) | **0 vulnerabilidades** | — |

## 2. Dependencias directas en producción

**Backend**
| Paquete | Versión instalada | Última mayor | Notas |
|---|---|---|---|
| express | ^4.22.3 | 5.2.1 | Major pendiente (breaking changes en v5) |
| cors | ^2.8.5 | — | OK |
| dotenv | ^16.6.1 | 18.0.3 | Major pendiente (v17+ cambia `parse`/logs) |
| axios | ^1.x | — | OK |
| node-cache | ^5.x | — | OK |
| rss-parser | ^3.x | — | OK |

**Frontend**
| Paquete | Versión | Notas |
|---|---|---|
| react / react-dom | 19.x | OK |
| react-router-dom | 7.x | OK |
| recharts | 2.x | OK |
| axios | ^1.x | OK |
| vite / @vitejs/plugin-react / oxlint | 8.x / 4.x / 9.x | Dev, OK |

## 3. Análisis de riesgo

- **Sin CVE activa** en ningún árbol (audit 0). No hay parche urgente.
- Las majors pendientes (`express 5`, `dotenv 17/18`) son **modernización**, no parches de seguridad: `npm audit` marca 0 en la v4 (hoy). No se actualizan en esta auditoría por "sin cambios de gran alcance sin decisión del propietario" (regla del proyecto).
- No hay script de `npm audit` fijo como gate; se recomienda añadirlo al CI (F-10).
- Los `package-lock.json` existen en backend y frontend → reproducibles. No comparten lockfile raíz (los `node_modules` de cada carpeta se gestionan por separado).

## 4. Plan recomendado (orden propuesto, no urgente)

1. **Ahora (cualquier momento):** añadir `"audit": "npm audit"` a los scripts; en CI hacer `npm audit --audit-level=high`.
2. **Próximo release mayor:** `dotenv@17 → 18` (cambios en logging de invalid keys; revisar `config.js`).
3. **Planificado:** migración a **Express 5** — comprobar:
   - cambios en manejo de promesas en middlewares (ya se usa try/catch),
   - eliminación de `app.del`, cambios en `res.json` (ninguno relevante aquí),
   - `path-to-regexp` v8 (wildcards `*` cambian: rutas como `/:id` no se ven afectadas).
4. **Alertas automáticas:** cuando exista repo git → dependabot/renovate con PRs automáticos y CI verde como gate.

## 5. supply-chain adicional

- No hay fuentes de paquetes no estándar (solo registry npm oficial).
- No hay scripts de instalación "sospechosos" detectados (`npx` en dev: `oxlint`, `vite` son oficiales).
- `npx @anthropic-ai/claude-code` en `.mcp.json` (solo launcher dev, pin de versión recomendable).