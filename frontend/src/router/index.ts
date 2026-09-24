import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import PlaygroundView from '../views/PlaygroundView.vue';
import LiveChatAgentView from '../views/LiveChatAgentView.vue';
import TicketingPipelineView from '../views/TicketingPipelineView.vue';
import KnowledgeView from '../views/KnowledgeView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/playground',
  },
  {
    path: '/playground',
    name: 'Playground',
    component: PlaygroundView,
  },
  {
    path: '/admin/live-chat',
    name: 'LiveChatAgent',
    component: LiveChatAgentView,
  },
  {
    path: '/admin/tickets',
    name: 'TicketingPipeline',
    component: TicketingPipelineView,
  },
  {
    path: '/admin/knowledge',
    name: 'Knowledge',
    component: KnowledgeView,
  },
  {
    path: '/admin/analytics',
    name: 'Analytics',
    component: AnalyticsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
