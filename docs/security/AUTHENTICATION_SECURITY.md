# Seguridad de autenticación

> Estado actual: **la aplicación no tiene autenticación.** Este documento lo justifica, define el N/A de los chequeos correspondientes y da la receta segura para cuando se decida agregarla (para no reinventar).

## 1. Situación actual (verificada)

| Chequeo | Estado | Evidencia |
|---|---|---|
| Existe login / registro | No | Ningún código o ruta de auth en `backend/src/routes/*` ni `frontend/src/pages/*` |
| Sesiones / cookies | No | Sin `cookie-parser`, sin `express-session`, sin middleware de sesión |
| Tokens (JWT/API key) | No | Ningún uso de `jsonwebtoken`, headers de authorización o claves |
| Roles / permisos | No | No hay usuarios |
| Contraseñas / hash | No | No hay BD ni almacenes |
| MFA / verificación | No | N/A |

## 2. Implicaciones de seguridad derivadas

| Riesgo típico de apps con auth | En Tradia (sin auth) |
|---|---|
| Brute-force de login | N/A — no hay login |
| Enumeración de usuarios | N/A |
| Robo de sesión / fixation | N/A — no hay sesiones |
| CSRF | N/A — no hay cookies ni acciones con estado |
| IDOR/BOLA | N/A — no hay objetos de usuario |
| Token leaks en logs/URLs | N/A — no se envían tokens |

**Conclusión:** la ausencia de auth **reduce** la superficie de ataque hoy. La
protección principal pasa por rate limiting (F-01) y disponibilidad (F-05),
no por auth.

## 3. CORS y auth futura — por qué el CORS por allowlist ya estaba justificado

Si mañana se añade auth, `Access-Control-Allow-Origin: *` combinado con cookies
(o tokens en header Authorization con credenciales) permitiría a cualquier web
hacer requests autenticados en nombre del usuario. Por eso la API ya soporta
`CORS_ORIGINS` como allowlist y se recomienda **fijarla** en producción antes de
cualquier auth.

## 4. Receta segura si se decide añadir autenticación

1. **Hashing de contraseñas:** `argon2id` (o `bcrypt`, cost ≥ 12). Nunca SHA/MD5/plain.
2. **Sesiones o JWT:**
   - Preferir **sesiones server-side** (`express-session` + almacén persistente).
   - Si JWT: corta vida (5–15 min) + refresh token rotativo, firmado con `HS256/RS256` robusto y alojado en secret propio.
3. **Cookies:** `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, `__Host-` prefix; nunca exponer el token en localStorage.
4. **Rate limiting en `/login`** + bloqueo/backoff por IP y por cuenta (delay exponencial).
5. **MFA** (TOTP/WebAuthn) si hay cuentas con acciones sensibles.
6. **Logout explícito** que invalida la sesión/refresh en servidor.
7. **Redirects post-login** contra open redirect (allowlist de destinos).
8. **CSP estricta + CORS allowlist** obligatorios al tener identidad.
9. **Test de seguridad de auth** antes de producción (pentest/SAST).

## 5. Mención especial: modo "favoritos/monedas extra" (localStorage)

Hoy `AddCoinPanel` guarda monedas extra en `localStorage` (`tradia-extra-coins`).
No es autenticación: es estado local del navegador. No expone datos personales,
pero si en el futuro se sincronizan favoritos por usuario, mover eso a la BD con
los requisitos del punto 4 (auth + autorización + CORS fijo).