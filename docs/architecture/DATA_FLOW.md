# Flujo de datos de Tradia

## 1. Flujo de mercado (top/global/trending)

```
Cliente ──GET /api/market/top?limit=20──▶ Express
                                            │
                                   cache.get("market:top:20")
                                            │ miss
                                   single-flight (promesa compartida)
                                            │
                                   CoinGecko /coins/markets
                                     (retry 2×, backoff, timeout 10 s)
                                            │
                                   normalizeCoin() → array JSON
                                            │
                                   cache.set(90 s) ──▶ respuesta 200 JSON
```

- El **cliente** (MarketDataProvider) refetch cada 60 s; el TTL de 90 s hace que
  casi siempre pegue a caché y casi nunca a CoinGecko.
- `limit` se clampa a `1..250`; el valor de caché es por `limit` específico.

## 2. Flujo de histórico

```
Cliente ──GET /api/market/:id/history?days=7──▶ Express
                                                 │
                                    toPositiveInt(days, 7, 365)
                                                 │
                                    isSupportedByBinance(id)?
                        ┌sí──────────────────────┤
                        ▼                        ▼
                Binance /klines            CoinGecko /coins/:id/market_chart
                (timeout 8 s)              (fallback)
                        │                        │
                        └──────────┬─────────────┘
                                   │
                        { source, prices:[{timestamp, price}] }
                                   │
                        cache.set(300 s) ──▶ respuesta
```

- Binance falla para un par puntual → se ignora el error y se usa CoinGecko.
- `days` se clampa a `1..365`; intervalos de klines según el rango.

## 3. Flujo de noticias

```
Cliente ──GET /api/news?coin=btc──▶ Express
                                     │
                          cache.get("news:feeds")
                                     │ miss
              Promise.all(CoinDesk RSS, Cointelegraph RSS)
                con rss-parser (timeout 10 s, User-Agent TradiaBot)
                                     │
                    items → sort por fecha → slice(0,30)
                                     │
              filtrar por coin (si viene) → filterNewsByCoin
                                     │
              cache.set(600 s)  (solo si hay resultados)
```

- Si un feed falla, se registra `[news] fallo al leer feed...` y se devuelve `[]`.
- No se cachea un resultado vacío (protección contra fallos transitorios).
- Las **imágenes** provienen de terceros (ctmedia.io, sanity.io, coingecko.com)
  y se sirven directo en `<img>`. Implicación de privacidad en
  `docs/security/SECURITY_AUDIT.md` (hallazgo F-08).

## 4. Flujo de análisis por reglas

```
Cliente ──GET /api/analysis/coin/:id──▶ ¿en caché? ──sí──▶ devolver (sin cómputo)
                │ no
                ▼
Cliente ──POST /api/analysis/coin/:id──▶ getCoinById(id) → 404 si no existe
                          │
              getNewsForCoin(name, symbol) → top-10 noticias relevantes
                          │
              analyzeCoin(): trendLabel(avg% 24h/7d) + scoreSentiment(palabras +/−)
                          │
              buildAnalysis() → {coinId, generatedAt, summary, disclaimer}
                          │
              cache.set(900 s) ──▶ respuesta
```

- El motor es **determinista, sin LLMs ni APIs de pago**.
- Toda salida incluye el disclaimer: *"Esto no constituye asesoria financiera. DYOR."*
- El análisis es informativo; la app **no ejecuta operaciones financieras**.

## 5. Flujos no presentes (verificados)

- No hay autenticación, sesiones, cookies ni tokens → sin flujo de login.
- No hay WebSockets (el "tiempo real" es polling HTTP).
- No hay tareas programadas ni workers (todo es on-demand + TTL de caché).
- No hay escritura a base de datos ni almacenamiento de usuarios.