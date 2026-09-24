import { Request, Response } from 'express';
import { query } from '../db';

/**
 * Returns high-level KPI metrics
 */
export async function getAnalyticsOverview(req: Request, res: Response): Promise<void> {
  try {
    const sessionStats = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'ESCALATION_REQUESTED' OR status = 'AGENT_ACTIVE' THEN 1 END) as escalated_sessions,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_sessions
      FROM chat_sessions
    `);

    const tokenStats = await query(`
      SELECT 
        COUNT(*) as total_messages,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(AVG(latency_ms), 0) as avg_latency_ms
      FROM chat_messages
      WHERE sender_type = 'assistant'
    `);

    const ticketStats = await query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'RESOLVED' OR status = 'CLOSED' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tickets
      FROM tickets
    `);

    const totalSessions = parseInt(sessionStats.rows[0].total_sessions || '0', 10);
    const escalatedSessions = parseInt(sessionStats.rows[0].escalated_sessions || '0', 10);
    const escalationRate = totalSessions > 0 ? ((escalatedSessions / totalSessions) * 100).toFixed(1) : '0';

    const totalTokens = parseInt(tokenStats.rows[0].total_tokens || '0', 10);
    const promptTokens = parseInt(tokenStats.rows[0].total_prompt_tokens || '0', 10);
    const completionTokens = parseInt(tokenStats.rows[0].total_completion_tokens || '0', 10);
    // Estimated Fireworks AI Cost (~$0.90 per 1M tokens for gpt-oss-120b)
    const estimatedCostUsd = ((totalTokens / 1_000_000) * 0.90).toFixed(4);

    res.json({
      sessions: {
        total: totalSessions,
        escalated: escalatedSessions,
        escalationRatePercent: parseFloat(escalationRate),
      },
      tokens: {
        total: totalTokens,
        prompt: promptTokens,
        completion: completionTokens,
        estimatedCostUsd: parseFloat(estimatedCostUsd),
        avgLatencyMs: Math.round(parseFloat(tokenStats.rows[0].avg_latency_ms || '0')),
      },
      tickets: {
        total: parseInt(ticketStats.rows[0].total_tickets || '0', 10),
        resolved: parseInt(ticketStats.rows[0].resolved_tickets || '0', 10),
        open: parseInt(ticketStats.rows[0].open_tickets || '0', 10),
        inProgress: parseInt(ticketStats.rows[0].in_progress_tickets || '0', 10),
      },
    });
  } catch (error: any) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({ error: 'Gagal mengambil data analitik.' });
  }
}

/**
 * Returns daily token usage history for charts
 */
export async function getTokenUsageDaily(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as completion_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COUNT(*) as message_count
      FROM chat_messages
      WHERE sender_type = 'assistant'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `);

    res.json({ daily: result.rows });
  } catch (error: any) {
    console.error('Error getting daily token usage:', error);
    res.status(500).json({ error: 'Gagal mengambil data tren token.' });
  }
}

/**
 * Returns ticket statistics grouped by status and category
 */
export async function getTicketDistribution(req: Request, res: Response): Promise<void> {
  try {
    const byStatus = await query(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      GROUP BY status
    `);

    const byCategory = await query(`
      SELECT category, COUNT(*) as count 
      FROM tickets 
      GROUP BY category
    `);

    res.json({
      byStatus: byStatus.rows,
      byCategory: byCategory.rows,
    });
  } catch (error: any) {
    console.error('Error getting ticket distribution:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik tiket.' });
  }
}
