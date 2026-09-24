# Graph Report - frontend  (2026-09-24)

## Corpus Check
- 22 files · ~10,263 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 215 nodes · 261 edges · 18 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- LiveChatAgentView.vue
- compilerOptions
- PlaygroundView.vue
- devDependencies
- dependencies
- TicketingPipelineView.vue
- KnowledgeView.vue
- TrackTicketModal.vue
- index.ts
- CreateTicketModal.vue
- package.json
- compilerOptions
- AnalyticsView.vue
- PreChatModal.vue

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `TicketAPI` - 11 edges
3. `SessionAPI` - 9 edges
4. `compilerOptions` - 6 edges
5. `KnowledgeAPI` - 5 edges
6. `selectSession()` - 5 edges
7. `include` - 5 edges
8. `scripts` - 4 edges
9. `ChatAPI` - 4 edges
10. `getSocket()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `handleSubmit()` --references--> `TicketAPI`  [EXTRACTED]
  src/components/CreateTicketModal.vue → src/services/api.ts
- `handleSearch()` --references--> `TicketAPI`  [EXTRACTED]
  src/components/TrackTicketModal.vue → src/services/api.ts
- `handleCloseSession()` --references--> `SessionAPI`  [EXTRACTED]
  src/views/PlaygroundView.vue → src/services/api.ts
- `submitInlineTicket()` --references--> `SessionAPI`  [EXTRACTED]
  src/views/PlaygroundView.vue → src/services/api.ts
- `handleAddComment()` --references--> `TicketAPI`  [EXTRACTED]
  src/views/TicketingPipelineView.vue → src/services/api.ts

## Import Cycles
- None detected.

## Communities (18 total, 0 thin omitted)

### Community 0 - "LiveChatAgentView.vue"
Cohesion: 0.12
Nodes (21): apiClient, ChatAPI, SessionAPI, getSocket(), ChatMessage, ChatSession, useChatStore, agentInput (+13 more)

### Community 1 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, ES2020, src/**/*.d.ts, src/**/*.ts, src/**/*.tsx, src/**/*.vue, compilerOptions (+17 more)

### Community 2 - "PlaygroundView.vue"
Cohesion: 0.09
Nodes (16): chatStore, copiedCode, handlePreChatSubmit(), handleSendMessage(), inputMessage, isSubmittingTicket, isTicketCopied, messagesContainer (+8 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, typescript, vite (+9 more)

### Community 4 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, chart.js, lucide-vue-next, dependencies, axios, chart.js, lucide-vue-next, pinia (+9 more)

### Community 5 - "TicketingPipelineView.vue"
Cohesion: 0.15
Nodes (13): handleSearch(), TicketAPI, submitInlineTicket(), commentInput, fetchTickets(), handleAddComment(), openTicketDrawer(), searchKeyword (+5 more)

### Community 6 - "KnowledgeView.vue"
Cohesion: 0.17
Nodes (12): KnowledgeAPI, editingItem, fetchKnowledge(), handleDelete(), handleSave(), handleTriggerScraper(), isSaving, isScraping (+4 more)

### Community 7 - "TrackTicketModal.vue"
Cohesion: 0.18
Nodes (6): hasSearched, isSearching, props, searchMode, searchQuery, tickets

### Community 8 - "index.ts"
Cohesion: 0.22
Nodes (6): isAdminRoute, $route, app, pinia, router, routes

### Community 9 - "CreateTicketModal.vue"
Cohesion: 0.24
Nodes (8): createdTicket, emit, form, handleDone(), handleSubmit(), isCopied, isSubmitting, props

### Community 10 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 11 - "compilerOptions"
Cohesion: 0.22
Nodes (8): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 12 - "AnalyticsView.vue"
Cohesion: 0.25
Nodes (7): AnalyticsAPI, chartOptions, doughnutOptions, fetchAnalytics(), overview, ticketChartData, tokenChartData

### Community 13 - "PreChatModal.vue"
Cohesion: 0.40
Nodes (5): emit, form, handleSubmit(), isSubmitting, props

## Knowledge Gaps
- **110 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TicketAPI` connect `TicketingPipelineView.vue` to `LiveChatAgentView.vue`, `CreateTicketModal.vue`, `PlaygroundView.vue`, `TrackTicketModal.vue`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LiveChatAgentView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1164021164021164 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `PlaygroundView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.08923076923076922 - nodes in this community are weakly interconnected._