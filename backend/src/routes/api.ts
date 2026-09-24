import { Router } from 'express';
import {
  createOrGetSession,
  getSession,
  listSessions,
  escalateSession,
  claimSession,
  closeSession,
} from '../controllers/sessionController';
import { sendMessage } from '../controllers/chatController';
import {
  createTicket,
  trackTickets,
  listTickets,
  getTicketDetail,
  updateTicketStatus,
  addTicketComment,
} from '../controllers/ticketController';
import {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  triggerScraper,
} from '../controllers/knowledgeController';
import {
  getAnalyticsOverview,
  getTokenUsageDaily,
  getTicketDistribution,
} from '../controllers/analyticsController';

const router = Router();

// 1. Session Routes
router.post('/sessions', createOrGetSession);
router.get('/sessions', listSessions);
router.get('/sessions/:id', getSession);
router.post('/sessions/:id/escalate', escalateSession);
router.post('/sessions/:id/claim', claimSession);
router.post('/sessions/:id/close', closeSession);

// 2. Chat Routes
router.post('/chat/message', sendMessage);

// 3. Ticketing Routes
router.post('/tickets', createTicket);
router.get('/tickets', listTickets);
router.get('/tickets/track', trackTickets);
router.get('/tickets/:id', getTicketDetail);
router.patch('/tickets/:id/status', updateTicketStatus);
router.post('/tickets/:id/comments', addTicketComment);

// 4. Knowledge Base Routes
router.get('/knowledge', listKnowledge);
router.post('/knowledge', createKnowledge);
router.put('/knowledge/:id', updateKnowledge);
router.delete('/knowledge/:id', deleteKnowledge);
router.post('/knowledge/scrape', triggerScraper);

// 5. Analytics Routes
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/tokens-daily', getTokenUsageDaily);
router.get('/analytics/tickets', getTicketDistribution);

export default router;
