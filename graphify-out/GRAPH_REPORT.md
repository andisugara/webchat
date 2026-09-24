# Graph Report - webchat  (2026-09-24)

## Corpus Check
- 41 files · ~21,190 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 345 nodes · 502 edges · 20 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c79dfc57`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- query
- TicketingPipelineView.vue
- LiveChatAgentView.vue
- devDependencies
- devDependencies
- compilerOptions
- PlaygroundView.vue
- ragService.ts
- AnalyticsView.vue
- dependencies
- dependencies
- KnowledgeView.vue
- compilerOptions
- compilerOptions
- scrape_sita.py
- server.ts

## God Nodes (most connected - your core abstractions)
1. `query()` - 32 edges
2. `compilerOptions` - 16 edges
3. `compilerOptions` - 11 edges
4. `TicketAPI` - 11 edges
5. `ingestKnowledge()` - 9 edges
6. `SessionAPI` - 9 edges
7. `sendMessage()` - 8 edges
8. `searchRelevantChunks()` - 8 edges
9. `scrapeSitaPortal()` - 7 edges
10. `scripts` - 6 edges

## Surprising Connections (you probably didn't know these)
- `sendMessage()` --calls--> `generateChatReply()`  [EXTRACTED]
  backend/src/controllers/chatController.ts → backend/src/services/fireworksService.ts
- `sendMessage()` --calls--> `searchRelevantChunks()`  [EXTRACTED]
  backend/src/controllers/chatController.ts → backend/src/services/ragService.ts
- `searchRelevantChunks()` --calls--> `query()`  [EXTRACTED]
  backend/src/services/ragService.ts → backend/src/db/index.ts
- `startServer()` --calls--> `initDatabase()`  [EXTRACTED]
  backend/src/server.ts → backend/src/db/init.ts
- `run()` --calls--> `scrapeSitaPortal()`  [EXTRACTED]
  backend/src/scripts/scrape_sita.ts → backend/src/services/scraperService.ts

## Import Cycles
- None detected.

## Communities (20 total, 0 thin omitted)

### Community 0 - "query"
Cohesion: 0.16
Nodes (28): getAnalyticsOverview(), getTicketDistribution(), getTokenUsageDaily(), extractIncidentInfo(), sendMessage(), createKnowledge(), deleteKnowledge(), listKnowledge() (+20 more)

### Community 1 - "TicketingPipelineView.vue"
Cohesion: 0.07
Nodes (26): createdTicket, emit, form, handleDone(), handleSubmit(), isCopied, isSubmitting, props (+18 more)

### Community 2 - "LiveChatAgentView.vue"
Cohesion: 0.11
Nodes (22): apiClient, ChatAPI, SessionAPI, getSocket(), ChatMessage, ChatSession, useChatStore, agentInput (+14 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, typescript, vite (+9 more)

### Community 4 - "devDependencies"
Cohesion: 0.08
Nodes (25): description, devDependencies, tsx, @types/cors, @types/express, @types/node, @types/pg, @types/uuid (+17 more)

### Community 5 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+17 more)

### Community 6 - "PlaygroundView.vue"
Cohesion: 0.07
Nodes (21): emit, form, handleSubmit(), isSubmitting, props, chatStore, copiedCode, handlePreChatSubmit() (+13 more)

### Community 7 - "ragService.ts"
Cohesion: 0.18
Nodes (16): chunkText(), estimateTokens(), TextChunk, cosineSimilarity(), generateLocalEmbedding(), getBatchEmbeddings(), getEmbedding(), buildSystemPrompt() (+8 more)

### Community 8 - "AnalyticsView.vue"
Cohesion: 0.12
Nodes (13): isAdminRoute, $route, app, pinia, router, routes, AnalyticsAPI, chartOptions (+5 more)

### Community 9 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, axios, cheerio, cors, dotenv, express, pg, socket.io (+9 more)

### Community 10 - "dependencies"
Cohesion: 0.08
Nodes (25): chart.js, dependencies, axios, chart.js, lucide-vue-next, pinia, socket.io-client, vue (+17 more)

### Community 11 - "KnowledgeView.vue"
Cohesion: 0.17
Nodes (12): KnowledgeAPI, editingItem, fetchKnowledge(), handleDelete(), handleSave(), handleTriggerScraper(), isSaving, isScraping (+4 more)

### Community 12 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule, rootDir (+5 more)

### Community 13 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include, vite.config.ts

### Community 14 - "scrape_sita.py"
Cohesion: 0.83
Nodes (3): clean_text(), scrape_page_detail(), scrape_sita()

### Community 18 - "server.ts"
Cohesion: 0.23
Nodes (9): pool, initDatabase(), router, run(), app, PORT, server, startServer() (+1 more)

## Knowledge Gaps
- **151 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TicketAPI` connect `TicketingPipelineView.vue` to `LiveChatAgentView.vue`, `PlaygroundView.vue`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `query()` connect `query` to `ragService.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TicketingPipelineView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.06606606606606606 - nodes in this community are weakly interconnected._
- **Should `LiveChatAgentView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.11083743842364532 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._