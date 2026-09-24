# Graph Report - webchat  (2026-09-18)

## Corpus Check
- 41 files · ~17,493 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 328 nodes · 473 edges · 18 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `query()` - 32 edges
2. `compilerOptions` - 16 edges
3. `compilerOptions` - 11 edges
4. `ingestKnowledge()` - 9 edges
5. `TicketAPI` - 9 edges
6. `scrapeSitaPortal()` - 7 edges
7. `scripts` - 6 edges
8. `sendMessage()` - 6 edges
9. `searchRelevantChunks()` - 6 edges
10. `SessionAPI` - 6 edges

## Surprising Connections (you probably didn't know these)
- `sendMessage()` --calls--> `query()`  [EXTRACTED]
  backend/src/controllers/chatController.ts → backend/src/db/index.ts
- `createTicket()` --calls--> `getSocketIO()`  [EXTRACTED]
  backend/src/controllers/ticketController.ts → backend/src/sockets/chatSocket.ts
- `searchRelevantChunks()` --calls--> `query()`  [EXTRACTED]
  backend/src/services/ragService.ts → backend/src/db/index.ts
- `startServer()` --calls--> `initDatabase()`  [EXTRACTED]
  backend/src/server.ts → backend/src/db/init.ts
- `ingestKnowledge()` --calls--> `chunkText()`  [EXTRACTED]
  backend/src/services/ragService.ts → backend/src/services/chunkerService.ts

## Import Cycles
- None detected.

## Communities (18 total, 0 thin omitted)

### Community 0 - "query"
Cohesion: 0.12
Nodes (33): getAnalyticsOverview(), getTicketDistribution(), getTokenUsageDaily(), createKnowledge(), deleteKnowledge(), listKnowledge(), triggerScraper(), updateKnowledge() (+25 more)

### Community 1 - "TicketingPipelineView.vue"
Cohesion: 0.07
Nodes (26): createdTicket, emit, form, handleDone(), handleSubmit(), isCopied, isSubmitting, props (+18 more)

### Community 2 - "LiveChatAgentView.vue"
Cohesion: 0.12
Nodes (20): apiClient, ChatAPI, SessionAPI, getSocket(), ChatMessage, ChatSession, useChatStore, agentInput (+12 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (25): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, typescript, vite (+17 more)

### Community 4 - "devDependencies"
Cohesion: 0.08
Nodes (25): description, devDependencies, tsx, @types/cors, @types/express, @types/node, @types/pg, @types/uuid (+17 more)

### Community 5 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+17 more)

### Community 6 - "PlaygroundView.vue"
Cohesion: 0.10
Nodes (17): emit, form, handleSubmit(), isSubmitting, props, chatStore, handlePreChatSubmit(), handleSendMessage() (+9 more)

### Community 7 - "ragService.ts"
Cohesion: 0.18
Nodes (16): sendMessage(), chunkText(), estimateTokens(), TextChunk, cosineSimilarity(), generateLocalEmbedding(), getBatchEmbeddings(), getEmbedding() (+8 more)

### Community 8 - "AnalyticsView.vue"
Cohesion: 0.12
Nodes (12): $route, app, pinia, router, routes, AnalyticsAPI, chartOptions, doughnutOptions (+4 more)

### Community 9 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, axios, cheerio, cors, dotenv, express, pg, socket.io (+9 more)

### Community 10 - "dependencies"
Cohesion: 0.12
Nodes (17): chart.js, dependencies, axios, chart.js, lucide-vue-next, pinia, socket.io-client, vue (+9 more)

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

## Knowledge Gaps
- **147 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `ragService.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `query` be split into smaller, more focused modules?**
  _Cohesion score 0.12181616832779624 - nodes in this community are weakly interconnected._
- **Should `TicketingPipelineView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.06606606606606606 - nodes in this community are weakly interconnected._
- **Should `LiveChatAgentView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1225071225071225 - nodes in this community are weakly interconnected._