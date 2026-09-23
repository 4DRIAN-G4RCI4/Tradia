# Graph Report - Tradia  (2026-09-22)

## Corpus Check
- Corpus is ~4,423 words - fits in a single context window. You may not need a graph.

## Summary
- 160 nodes · 236 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.75)
- Token cost: 65,000 input · 5,127 output

## Community Hubs (Navigation)
- Frontend Build Config
- Backend Routes & Data Services
- Frontend App & Components
- Backend Build Config
- Project Docs & Assets
- Rule-Based Analysis Engine
- Root Dev Orchestration
- Frontend Lint Config
- Social Icons (Bluesky/GitHub/X)
- Social Icons (Discord)
- Documentation Icon

## God Nodes (most connected - your core abstractions)
1. `analyzeCoin()` - 8 edges
2. `analyzeMarket()` - 7 edges
3. `getOrFetch()` - 7 edges
4. `React + Vite Template` - 7 edges
5. `getTopCoins()` - 6 edges
6. `getCoinById()` - 6 edges
7. `getNews()` - 6 edges
8. `react` - 6 edges
9. `Crypto Market Analysis Dashboard` - 6 edges
10. `express` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Hero Image (isometric purple/white box graphic)` --conceptually_related_to--> `Crypto Market Analysis Dashboard`  [INFERRED]
  frontend/src/assets/hero.png → README.md
- `Tradia Favicon (purple diamond logo)` --conceptually_related_to--> `Tradia`  [INFERRED]
  frontend/public/favicon.svg → README.md
- `Tradia Frontend` --references--> `React + Vite Template`  [INFERRED]
  README.md → frontend/README.md
- `Vite Logo (default Vite template asset)` --conceptually_related_to--> `React + Vite Template`  [INFERRED]
  frontend/src/assets/vite.svg → frontend/README.md
- `frontend/index.html (Vite entry HTML)` --references--> `Tradia Favicon (purple diamond logo)`  [EXTRACTED]
  frontend/index.html → frontend/public/favicon.svg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Tradia Market Sentiment Pipeline** — readme_coingecko, readme_coindesk_rss, readme_cointelegraph_rss, readme_rule_engine [EXTRACTED 1.00]
- **Frontend Social/Community Icon Set** — frontend_public_icons_bluesky, frontend_public_icons_discord, frontend_public_icons_github, frontend_public_icons_x, frontend_public_icons_social, frontend_public_icons_documentation [EXTRACTED 1.00]
- **Vite React App Bootstrap Chain** — frontend_index_html, frontend_src_main_jsx, frontend_index_root_div [EXTRACTED 1.00]

## Communities (11 total, 2 thin omitted)

### Community 0 - "Frontend Build Config"
Cohesion: 0.07
Nodes (27): dependencies, axios, react, react-dom, recharts, devDependencies, oxlint, @types/react (+19 more)

### Community 1 - "Backend Routes & Data Services"
Cohesion: 0.16
Nodes (20): config, router, router, router, app, cache, getCacheStats(), getOrFetch() (+12 more)

### Community 2 - "Frontend App & Components"
Cohesion: 0.14
Nodes (16): client, App(), AiAnalysisPanel(), CryptoChart(), CryptoList(), formatPct(), formatUsd(), Disclaimer() (+8 more)

### Community 3 - "Backend Build Config"
Cohesion: 0.09
Nodes (21): dependencies, axios, cors, dotenv, express, node-cache, rss-parser, devDependencies (+13 more)

### Community 4 - "Project Docs & Assets"
Cohesion: 0.12
Nodes (19): frontend/index.html (Vite entry HTML), #root mount div, Tradia Favicon (purple diamond logo), Oxlint Configuration, React Compiler, React + Vite Template, @vitejs/plugin-react (Oxc), @vitejs/plugin-react-swc (SWC) (+11 more)

### Community 5 - "Rule-Based Analysis Engine"
Cohesion: 0.36
Nodes (10): analyzeCoin(), analyzeMarket(), NEGATIVE_WORDS, POSITIVE_WORDS, recommendationSentence(), scoreSentiment(), sentimentSentence(), trendLabel() (+2 more)

### Community 6 - "Root Dev Orchestration"
Cohesion: 0.18
Nodes (10): devDependencies, concurrently, name, private, scripts, dev, dev:backend, dev:frontend (+2 more)

### Community 7 - "Frontend Lint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 8 - "Social Icons (Bluesky/GitHub/X)"
Cohesion: 0.67
Nodes (3): Bluesky Icon Symbol, GitHub Icon Symbol, X (Twitter) Icon Symbol

## Knowledge Gaps
- **69 isolated node(s):** `name`, `private`, `version`, `type`, `main` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 71 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Frontend App & Components` to `Frontend Build Config`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `express` connect `Backend Routes & Data Services` to `Backend Build Config`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `React + Vite Template` (e.g. with `frontend/index.html (Vite entry HTML)` and `Vite Logo (default Vite template asset)`) actually correct?**
  _`React + Vite Template` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Frontend App & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._
- **Should `Backend Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._