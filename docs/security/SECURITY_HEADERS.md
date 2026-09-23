# Cabeceras de seguridad (Security Headers)

> Estado verificado por prueba con `curl` a `http://localhost:4000` (backend, 2026-09-23).

## 1. Cabeceras aplicadas en el backend (`backend/src/server.js`)

| Cabecera | Valor aplicado | Por qué |
|---|---|---|
| `X-Powered-By` | **eliminada** (`app.disable("x-powered-by")`) | Evita revelar el stack al reconocimiento |
| `X-Content-Type-Options` | `nosniff` | Impide MIME sniffing |
| `X-Frame-Options` | `DENY` | Impide clickjacking (sin iframes propios) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No filtra la URL completa a terceros |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Niega sensores innecesarios |
| `Vary: Origin` | presente (cors padrón) | Correcto caching con CORS |

### Evidencia de prueba (headers reales)

```
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Vary: Origin
Content-Type: application/json; charset=utf-8
```

`X-Powered-By: Express` **ya no aparece**. (Antes de la corrección sí: `X-Powered-By: Express`.)

## 2. Cabecera CSP en el frontend (`frontend/index.html`, build)

Utiliza `<meta http-equiv="Content-Security-Policy">` (efectiva en producción por el SPA servido estático):

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https:;
connect-src 'self' ws: wss:;
object-src 'none';
base-uri 'self';
form-action 'self';
```

**Notas importantes:**
- `script-src 'unsafe-inline'` es una concesión por el `<script>` inline del tema (evita FOUC). En producción, mejor: moverlo a archivo externo o aplicar CSP por header con **hash** de ese script → se puede eliminar `'unsafe-inline'`.
- `img-src https:` es necesario para las imágenes de noticias de terceros (F-08). Limitar a los dominios reales (`ctmedia.io`, `sanity.io`, `images.coingecko.com`) reduce privacidad y superficie.
- `ws:/wss:` por Vite HMR en dev; en producción puede restringirse a `'self'`.

## 3. Cabeceras que faltan en el backend (pendientes para borde)

| Cabecera | Estado | Solución |
|---|---|---|
| `Strict-Transport-Security` | NO VERIFICABLE DESDE EL REPOSITORIO | Requiere HTTPS; añadir en el hosting/proxy |
| `Content-Security-Policy` por header | ABIERTO | En borde/proxy con hash/nonce (F-06) |
| `Permissions-Policy` adicionales (`payment`, `usb`, etc.) | OPCIONAL | Poder auditoría |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` | OPCIONAL | Actualmente sin workers compartidos, riesgo bajo |

## 4. Cómo verificarlo de nuevo

```powershell
# Backend corriendo
curl.exe -s -i http://localhost:4000/api/health
# Debe aparecer GUI X-Content-Type-Options, X-Frame-Options...
# Y NO debe aparecer X-Powered-By: Express
```

## 5. Estado por entorno

| Entorno | Estado |
|---|---|
| Local (dev) | CORREGIDO — verificado |
| Producción (si se desplegara con los mismos archivos) | Backend: CORREGIDO por código · Borde/HTTPS/HSTS: NO VERIFICABLE DESDE EL REPOSITORIO |

## 6. Recomendación final

Las 4 cabeceras + desactivación de `X-Powered-By` son base mínima. Para producción
añadir **HSTS + CSP estricta por header** como mínimo, y **COOP/COEP** si se
planifican iframes o compartir memoria (`SharedArrayBuffer`).