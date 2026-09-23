# Documentación de Tradia

Índice de la documentación técnica y de seguridad del proyecto.

## Auditoría de seguridad

- [SECURITY_AUDIT.md](security/SECURITY_AUDIT.md) — Informe principal de la auditoría (metodología, OWASP, hallazgos, cambios aplicados).
- [RISK_REGISTER.md](security/RISK_REGISTER.md) — Registro de riesgos con evidencia para cada hallazgo (F-01…F-18).
- [THREAT_MODEL.md](security/THREAT_MODEL.md) — Modelo STRIDE de activos, actores y amenazas.
- [SECURITY_ARCHITECTURE.md](security/SECURITY_ARCHITECTURE.md) — Defensas actuales y pendientes por capa.
- [SECURITY_HEADERS.md](security/SECURITY_HEADERS.md) — Cabeceras de seguridad: aplicadas, evidencias, pendientes.
- [API_SECURITY.md](security/API_SECURITY.md) — Evaluación OWASP API Security Top 10.
- [AUTHENTICATION_SECURITY.md](security/AUTHENTICATION_SECURITY.md) — Estado de auth (N/A) y receta segura futura.
- [DEPENDENCY_SECURITY.md](security/DEPENDENCY_SECURITY.md) — `npm audit`/`outdated`, plan de dependencias.
- [INCIDENT_RESPONSE.md](security/INCIDENT_RESPONSE.md) — Runbooks de respuesta ante incidentes.
- [SECURITY_CHECKLIST.md](security/SECURITY_CHECKLIST.md) — Checklist verificable PASS/FAIL/N/A/NOT VERIFIED.

## Arquitectura

- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) — Arquitectura actual, decisiones y estructura recomendada.
- [DATA_FLOW.md](architecture/DATA_FLOW.md) — Flujos de datos de cada endpoint.
- [COMPONENTS.md](architecture/COMPONENTS.md) — Inventario de componentes backend/frontend y dependencias.

## API

- [API_SECURITY.md](api/API_SECURITY.md) — Inventario de endpoints, controles y pruebas manuales.

## Diagramas (Mermaid)

| Diagrama | Contenido |
|---|---|
| [architecture.mmd](diagrams/architecture.mmd) | Nodos y conexiones del sistema |
| [data-flow.mmd](diagrams/data-flow.mmd) | Secuencia de llamadas por endpoint |
| [security-flow.mmd](diagrams/security-flow.mmd) | Defensas aplicadas y pendientes |
| [authentication-flow.mmd](diagrams/authentication-flow.mmd) | Estado de auth y recomendaciones futuras |
| [deployment.mmd](diagrams/deployment.mmd) | Topología local y propuesta de producción |
| [threat-model.mmd](diagrams/threat-model.mmd) | Activos, actores y amenazas |

Render: cualquier visor Mermaid (mermaid.live, GitHub, VS Code + extension) o convertirlos a PNG/SVG con `@mermaid-js/mermaid-cli`:

```bash
npx -y @mermaid-js/mermaid-cli -i docs/diagrams/architecture.mmd -o docs/diagrams/architecture.svg
```