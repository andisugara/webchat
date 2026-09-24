import { Request, Response } from 'express';
import { query } from '../db';
import { getSocketIO } from '../sockets/chatSocket';

/**
 * Generates a unique ticket number formatted as TKT-YYYYMM-XXXX
 */
export async function generateTicketNumber(): Promise<string> {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  const countRes = await query(
    `SELECT COUNT(*) FROM tickets WHERE ticket_number LIKE $1`,
    [`TKT-${yearMonth}-%`]
  );
  const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
  return `TKT-${yearMonth}-${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Creates a new support / complaint / lost item ticket with simple note/description
 */
export async function createTicket(req: Request, res: Response): Promise<void> {
  try {
    const {
      sessionId,
      name,
      email,
      phone,
      category,
      subject,
      description,
      notes,
    } = req.body;

    const ticketContent = (description || notes || '').trim();

    if (!ticketContent) {
      res.status(400).json({ error: 'Catatan laporan / deskripsi tiket wajib diisi.' });
      return;
    }

    // Use session visitor data if available
    let reporterName = name;
    let reporterEmail = email;
    let reporterPhone = phone;

    if (sessionId && (!reporterName || !reporterEmail || !reporterPhone)) {
      const sRes = await query(`SELECT * FROM chat_sessions WHERE id = $1`, [sessionId]);
      if (sRes.rows.length > 0) {
        reporterName = reporterName || sRes.rows[0].visitor_name;
        reporterEmail = reporterEmail || sRes.rows[0].visitor_email;
        reporterPhone = reporterPhone || sRes.rows[0].visitor_phone;
      }
    }

    if (!reporterName || !reporterEmail || !reporterPhone) {
      res.status(400).json({ error: 'Data pengunjung (Nama, Email, HP) tidak lengkap.' });
      return;
    }

    const ticketNumber = await generateTicketNumber();
    const finalSubject = (subject || ticketContent.slice(0, 60)).trim();

    const ticketRes = await query(
      `INSERT INTO tickets 
       (ticket_number, session_id, name, email, phone, category, subject, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'MEDIUM', 'OPEN')
       RETURNING *`,
      [
        ticketNumber,
        sessionId || null,
        reporterName.trim(),
        reporterEmail.trim().toLowerCase(),
        reporterPhone.trim(),
        category || 'kehilangan_barang',
        finalSubject,
        ticketContent,
      ]
    );

    const ticket = ticketRes.rows[0];

    // Add initial ticket comment
    await query(
      `INSERT INTO ticket_comments (ticket_id, sender_name, sender_type, comment_text)
       VALUES ($1, 'Sistem SITA', 'system', 'Tiket berhasil dibuat dan masuk antrean.')`,
      [ticket.id]
    );

    // If created from a chat session, notify the chat room
    if (sessionId) {
      const msg = `Tiket Anda berhasil dibuat dengan Nomor Tiket: ${ticketNumber}. Laporan: "${ticketContent}". Petugas kami akan segera menindaklanjuti. Anda dapat mengecek statusnya kapan saja dengan mengetik "cek tiket" di chat ini.`;
      await query(
        `INSERT INTO chat_messages (session_id, sender_type, sender_name, content)
         VALUES ($1, 'system', 'Sistem SITA', $2)`,
        [sessionId, msg]
      );

      const io = getSocketIO();
      if (io) {
        io.to(sessionId).emit('ticket_created', ticket);
      }
    }

    res.status(201).json({
      message: 'Tiket berhasil dibuat.',
      ticket,
      ticketNumber,
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Gagal membuat tiket layanan.' });
  }
}

/**
 * Searches and tracks tickets by ticketNumber OR email OR phone
 */
export async function trackTickets(req: Request, res: Response): Promise<void> {
  try {
    const { ticketNumber, email, phone } = req.query;

    if (!ticketNumber && !email && !phone) {
      res.status(400).json({ error: 'Harap masukkan Nomor Tiket, Email, atau No. HP.' });
      return;
    }

    let sql = `SELECT * FROM tickets WHERE 1=1`;
    const params: any[] = [];

    if (ticketNumber) {
      params.push(`%${String(ticketNumber).trim().toUpperCase()}%`);
      sql += ` AND UPPER(ticket_number) LIKE $${params.length}`;
    } else {
      if (email && phone) {
        params.push(String(email).trim().toLowerCase());
        params.push(String(phone).trim());
        sql += ` AND (LOWER(email) = $${params.length - 1} OR phone = $${params.length})`;
      } else if (email) {
        params.push(String(email).trim().toLowerCase());
        sql += ` AND LOWER(email) = $${params.length}`;
      } else if (phone) {
        params.push(String(phone).trim());
        sql += ` AND phone = $${params.length}`;
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT 20`;

    const ticketsRes = await query(sql, params);

    // Fetch comments for these tickets
    const ticketsWithComments = await Promise.all(
      ticketsRes.rows.map(async (t) => {
        const comments = await query(
          `SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC`,
          [t.id]
        );
        return {
          ...t,
          comments: comments.rows,
        };
      })
    );

    res.json({ tickets: ticketsWithComments });
  } catch (error: any) {
    console.error('Error tracking tickets:', error);
    res.status(500).json({ error: 'Gagal mencari tiket.' });
  }
}

/**
 * Lists all tickets for the Admin Kanban Board
 */
export async function listTickets(req: Request, res: Response): Promise<void> {
  try {
    const { status, category, search } = req.query;
    let sql = `SELECT * FROM tickets WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${String(search).trim()}%`);
      sql += ` AND (ticket_number ILIKE $${params.length} OR subject ILIKE $${params.length} OR name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    sql += ` ORDER BY updated_at DESC`;

    const result = await query(sql, params);
    res.json({ tickets: result.rows });
  } catch (error: any) {
    console.error('Error listing tickets:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar tiket.' });
  }
}

/**
 * Gets single ticket details with comments
 */
export async function getTicketDetail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ticketRes = await query(`SELECT * FROM tickets WHERE id = $1`, [id]);
    if (ticketRes.rows.length === 0) {
      res.status(404).json({ error: 'Tiket tidak ditemukan.' });
      return;
    }

    const commentsRes = await query(
      `SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      ticket: ticketRes.rows[0],
      comments: commentsRes.rows,
    });
  } catch (error: any) {
    console.error('Error getting ticket detail:', error);
    res.status(500).json({ error: 'Gagal mengambil detail tiket.' });
  }
}

/**
 * Updates ticket pipeline status, assigned agent, or priority
 */
export async function updateTicketStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, commentText, senderName } = req.body;

    const currentTicketRes = await query(`SELECT * FROM tickets WHERE id = $1`, [id]);
    if (currentTicketRes.rows.length === 0) {
      res.status(404).json({ error: 'Tiket tidak ditemukan.' });
      return;
    }

    const updatedRes = await query(
      `UPDATE tickets 
       SET status = COALESCE($1, status),
           priority = COALESCE($2, priority),
           assigned_to = COALESCE($3, assigned_to),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status || null, priority || null, assignedTo || null, id]
    );

    const updatedTicket = updatedRes.rows[0];

    // Log status change comment
    let logMsg = `Status diperbarui menjadi: ${updatedTicket.status}`;
    if (commentText) {
      logMsg += ` - Catatan: ${commentText}`;
    }

    await query(
      `INSERT INTO ticket_comments (ticket_id, sender_name, sender_type, comment_text)
       VALUES ($1, $2, 'agent', $3)`,
      [id, senderName || 'Petugas Helpdesk', logMsg]
    );

    res.json({ ticket: updatedTicket, message: 'Status tiket berhasil diperbarui.' });
  } catch (error: any) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Gagal memperbarui status tiket.' });
  }
}

/**
 * Adds a new comment / reply to a ticket
 */
export async function addTicketComment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { senderName, senderType, commentText } = req.body;

    if (!commentText || !commentText.trim()) {
      res.status(400).json({ error: 'Komentar tidak boleh kosong.' });
      return;
    }

    const commentRes = await query(
      `INSERT INTO ticket_comments (ticket_id, sender_name, sender_type, comment_text)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, senderName || 'Petugas', senderType || 'agent', commentText.trim()]
    );

    await query(`UPDATE tickets SET updated_at = NOW() WHERE id = $1`, [id]);

    res.status(201).json({ comment: commentRes.rows[0] });
  } catch (error: any) {
    console.error('Error adding ticket comment:', error);
    res.status(500).json({ error: 'Gagal menambahkan komentar tiket.' });
  }
}
