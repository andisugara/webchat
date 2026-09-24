import { Request, Response } from 'express';
import { query } from '../db';

/**
 * Creates or resumes a visitor session
 */
export async function createOrGetSession(req: Request, res: Response): Promise<void> {
  try {
    const { visitorName, visitorEmail, visitorPhone, sessionId } = req.body;

    if (sessionId) {
      const existing = await query(`SELECT * FROM chat_sessions WHERE id = $1`, [sessionId]);
      if (existing.rows.length > 0) {
        // If existing session is already CLOSED, do not resume it; force fresh session!
        if (existing.rows[0].status === 'CLOSED') {
          // Fall through to create fresh session
        } else {
          res.json({ session: existing.rows[0], isNew: false });
          return;
        }
      }
    }

    if (!visitorName || !visitorEmail || !visitorPhone) {
      res.status(400).json({ error: 'Nama, Email, dan No. HP wajib diisi.' });
      return;
    }

    const sessionRes = await query(
      `INSERT INTO chat_sessions (visitor_name, visitor_email, visitor_phone, status)
       VALUES ($1, $2, $3, 'BOT_ACTIVE')
       RETURNING *`,
      [visitorName.trim(), visitorEmail.trim().toLowerCase(), visitorPhone.trim()]
    );

    const session = sessionRes.rows[0];

    // Initial Welcome Greeting
    const welcomeText = `Om Swastyastu! Halo ${session.visitor_name}, selamat datang di Layanan Asisten Virtual SITA Badung (Sistem Informasi Pariwisata Kabupaten Badung, Bali).\n\nSaya siap membantu Anda dengan berbagai informasi:\n• Destinasi Wisata & Pantai Eksotis (Pura Taman Ayun, GWK, Padang Padang, Pandawa, dll.)\n• Jadwal Acara & Tradisi Budaya (Siat Geni, Siat Tipat, Tradisi Mekotek, dll.)\n• Akomodasi, Kuliner, & Industri Pariwisata\n• Pelaporan / Pengaduan Layanan & Kehilangan Barang (Tiket Layanan)\n• Cek Status Tiket Anda\n\nAda yang bisa saya bantu hari ini?`;

    await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, content, model_name)
       VALUES ($1, 'assistant', 'SITA AI Assistant', $2, 'sita-welcome-system')`,
      [session.id, welcomeText]
    );

    res.status(201).json({ session, isNew: true });
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Gagal membuat sesi percakapan.' });
  }
}

/**
 * Gets session details and full message history
 */
export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const sessionRes = await query(`SELECT * FROM chat_sessions WHERE id = $1`, [id]);
    if (sessionRes.rows.length === 0) {
      res.status(404).json({ error: 'Sesi tidak ditemukan.' });
      return;
    }

    const messagesRes = await query(
      `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      session: sessionRes.rows[0],
      messages: messagesRes.rows,
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Gagal mengambil data sesi.' });
  }
}

/**
 * Lists all active and escalated sessions for the Agent Live Console
 */
export async function listSessions(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    let sql = `
      SELECT 
        cs.*,
        (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count,
        (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM chat_sessions cs
    `;
    const params: any[] = [];

    if (status) {
      sql += ` WHERE cs.status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY cs.updated_at DESC LIMIT 50`;

    const result = await query(sql, params);
    res.json({ sessions: result.rows });
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar sesi.' });
  }
}

/**
 * Escalates a session to Human Agent
 */
export async function escalateSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE chat_sessions 
       SET status = 'ESCALATION_REQUESTED', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Sesi tidak ditemukan.' });
      return;
    }

    const systemMsg = `Permintaan bantuan ke Petugas Pelayanan telah diajukan. Mohon tunggu sejenak, petugas kami akan segera bergabung ke ruang obrolan.`;
    await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, content)
       VALUES ($1, 'system', 'Sistem SITA', $2)`,
      [id, systemMsg]
    );

    res.json({ session: result.rows[0], message: systemMsg });
  } catch (error: any) {
    console.error('Error escalating session:', error);
    res.status(500).json({ error: 'Gagal melakukan eskalasi.' });
  }
}

/**
 * Agent claims and takes over a chat session
 */
export async function claimSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { agentId, agentName } = req.body;

    const result = await query(
      `UPDATE chat_sessions 
       SET status = 'AGENT_ACTIVE', assigned_agent_id = $2, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id, agentId || null]
    );

    const systemMsg = `Petugas ${agentName || 'Staf Pelayanan SITA Badung'} telah bergabung ke dalam ruang obrolan. Asisten AI dinonaktifkan.`;
    await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, content)
       VALUES ($1, 'system', 'Sistem SITA', $2)`,
      [id, systemMsg]
    );

    const io = (await import('../sockets/chatSocket')).getSocketIO();
    if (io) {
      io.to(id).emit('session_status_changed', { sessionId: id, status: 'AGENT_ACTIVE' });
      io.to(id).emit('new_message', {
        session_id: id,
        sender_type: 'system',
        sender_name: 'Sistem SITA',
        content: systemMsg,
        created_at: new Date().toISOString(),
      });
    }

    res.json({ session: result.rows[0], message: systemMsg });
  } catch (error: any) {
    console.error('Error claiming session:', error);
    res.status(500).json({ error: 'Gagal mengambil alih sesi.' });
  }
}

/**
 * Closes or resolves a session
 */
export async function closeSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const result = await query(
      `UPDATE chat_sessions 
       SET status = 'CLOSED', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    const systemMsg = `Sesi obrolan telah diselesaikan. Terima kasih telah menghubungi SITA Badung!`;
    await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, content)
       VALUES ($1, 'system', 'Sistem SITA', $2)`,
      [id, systemMsg]
    );

    res.json({ session: result.rows[0], message: systemMsg });
  } catch (error: any) {
    console.error('Error closing session:', error);
    res.status(500).json({ error: 'Gagal menutup sesi.' });
  }
}
