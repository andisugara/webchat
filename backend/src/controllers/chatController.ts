import { Request, Response } from 'express';
import { query } from '../db';
import { searchRelevantChunks } from '../services/ragService';
import { generateChatReply } from '../services/fireworksService';
import { getSocketIO } from '../sockets/chatSocket';
import { generateTicketNumber } from './ticketController';

/**
 * Helper to extract lost item / incident info from text
 */
function extractIncidentInfo(text: string): { item: string; location: string; category: string } {
  const lower = text.toLowerCase();
  
  let item = 'Barang Berharga';
  if (lower.includes('hp') || lower.includes('handphone') || lower.includes('ponsel') || lower.includes('smartphone')) {
    item = 'Ponsel / HP';
  } else if (lower.includes('dompet')) {
    item = 'Dompet';
  } else if (lower.includes('tas') || lower.includes('ransel')) {
    item = 'Tas';
  } else if (lower.includes('kunci')) {
    item = 'Kunci Kendaraan';
  } else if (lower.includes('kamera')) {
    item = 'Kamera';
  } else if (lower.includes('paspor') || lower.includes('passport') || lower.includes('ktp')) {
    item = 'Dokumen / Identitas';
  }

  let location = 'Kabupaten Badung';
  if (lower.includes('uluwatu')) {
    location = 'Pura Uluwatu';
  } else if (lower.includes('kuta')) {
    location = 'Pantai Kuta';
  } else if (lower.includes('gwk') || lower.includes('garuda wisnu')) {
    location = 'GWK Cultural Park';
  } else if (lower.includes('pandawa')) {
    location = 'Pantai Pandawa';
  } else if (lower.includes('taman ayun') || lower.includes('mengwi')) {
    location = 'Pura Taman Ayun Mengwi';
  } else if (lower.includes('jimbaran') || lower.includes('kedonganan')) {
    location = 'Pantai Kedonganan / Jimbaran';
  } else if (lower.includes('canggu')) {
    location = 'Kawasan Canggu';
  } else if (lower.includes('seminyak')) {
    location = 'Kawasan Seminyak';
  } else if (lower.includes('padang padang') || lower.includes('labuan sait')) {
    location = 'Pantai Labuan Sait (Padang Padang)';
  }

  const category = (lower.includes('rusak') || lower.includes('fasilitas') || lower.includes('kotor') || lower.includes('pelayanan'))
    ? 'pengaduan_fasilitas'
    : 'kehilangan_barang';

  return { item, location, category };
}

/**
 * Handles incoming chat messages with conversational RAG, automatic ticket tracking, and in-chat ticketing intents
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, senderType, senderName, content } = req.body;

    if (!sessionId || !content || !content.trim()) {
      res.status(400).json({ error: 'Session ID dan isi pesan tidak boleh kosong.' });
      return;
    }

    // 1. Verify session
    const sessionRes = await query(`SELECT * FROM chat_sessions WHERE id = $1`, [sessionId]);
    if (sessionRes.rows.length === 0) {
      res.status(404).json({ error: 'Sesi tidak ditemukan.' });
      return;
    }
    const session = sessionRes.rows[0];
    const text = content.trim();

    // 2. Save User / Sender Message
    const userMsgRes = await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sessionId, senderType || 'user', senderName || session.visitor_name, text]
    );
    const savedUserMsg = userMsgRes.rows[0];

    // Update session timestamp
    await query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);

    const io = getSocketIO();
    if (io) {
      io.to(sessionId).emit('new_message', savedUserMsg);
    }

    // 3. If in AGENT_ACTIVE mode, ESCALATION_REQUESTED, or CLOSED, or message is from human agent, do NOT trigger AI
    if (
      session.status === 'AGENT_ACTIVE' ||
      session.status === 'ESCALATION_REQUESTED' ||
      session.status === 'CLOSED' ||
      session.assigned_agent_id ||
      senderType === 'agent'
    ) {
      res.json({
        userMessage: savedUserMsg,
        assistantMessage: null,
        mode: session.status || 'AGENT',
      });
      return;
    }

    const lowerText = text.toLowerCase();

    // 4. Fetch recent chat history for context & conversational flow
    const historyRes = await query(
      `SELECT sender_type, content, created_at FROM chat_messages 
       WHERE session_id = $1 AND sender_type IN ('user', 'assistant')
       ORDER BY created_at ASC LIMIT 10`,
      [sessionId]
    );

    const formattedHistory = historyRes.rows.map((row: any) => ({
      role: (row.sender_type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: row.content,
    }));

    const recentUserMessages = historyRes.rows
      .filter((r: any) => r.sender_type === 'user')
      .map((r: any) => r.content.toLowerCase());
    const fullRecentContext = recentUserMessages.join(' ') + ' ' + lowerText;

    // 5. In-Chat Intent: Ticket Status Tracking (e.g. "cek tiket", "status TKT-202609-0001", "lacak tiket")
    const ticketCodeMatch = text.match(/TKT-\d{6}-\d{4}/i);
    if (ticketCodeMatch || lowerText.includes('cek status tiket') || lowerText.includes('cek tiket saya') || lowerText.includes('lacak tiket') || lowerText === 'cek tiket') {
      let ticketsFound: any[] = [];
      if (ticketCodeMatch) {
        const tktCode = ticketCodeMatch[0].toUpperCase();
        const tktRes = await query(`SELECT * FROM tickets WHERE UPPER(ticket_number) = $1`, [tktCode]);
        ticketsFound = tktRes.rows;
      } else {
        // Look up by visitor's session email and phone
        const tktRes = await query(
          `SELECT * FROM tickets WHERE LOWER(email) = $1 OR phone = $2 ORDER BY created_at DESC LIMIT 5`,
          [session.visitor_email.toLowerCase(), session.visitor_phone]
        );
        ticketsFound = tktRes.rows;
      }

      let replyContent = '';
      if (ticketsFound.length > 0) {
        const commentsList = await Promise.all(
          ticketsFound.map(async (t) => {
            const cRes = await query(`SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC`, [t.id]);
            return { ...t, comments: cRes.rows };
          })
        );

        replyContent = `Om Swastyastu Kak **${session.visitor_name}**, berikut adalah data status tiket pengaduan Anda yang tercatat di sistem:\n\n` +
          commentsList.map((t) => {
            const statusMap: Record<string, string> = {
              OPEN: 'Menunggu Antrean (Open)',
              IN_PROGRESS: 'Sedang Ditangani Petugas',
              ESCALATED: 'Eskalasi Khusus',
              RESOLVED: 'Telah Selesai (Resolved)',
              CLOSED: 'Ditutup (Closed)',
            };
            const lastNote = t.comments.length > 0 ? `\n  ↳ *Update Terakhir:* "${t.comments[t.comments.length - 1].comment_text}"` : '';
            return `🎫 **Nomor Tiket: ${t.ticket_number}**\n• **Subjek:** ${t.subject}\n• **Kategori:** ${t.category === 'kehilangan_barang' ? 'Kehilangan Barang' : 'Pengaduan Wisata'}\n• **Status:** \`${statusMap[t.status] || t.status}\`${lastNote}`;
          }).join('\n\n---\n\n') +
          `\n\nJika butuh bantuan langsung dari petugas, Kakak dapat mengklik tombol **"Bicara dengan Petugas"**.`;
      } else {
        replyContent = `Maaf Kak **${session.visitor_name}**, saya belum menemukan tiket yang terdaftar atas email \`${session.visitor_email}\` atau nomor telepon \`${session.visitor_phone}\`.\n\nJika memiliki Nomor Tiket spesifik (contoh: \`TKT-202609-0001\`), silakan ketikkan langsung di sini agar bisa saya lacak ya Kak.`;
      }

      const assistantMsgRes = await query(
        `INSERT INTO chat_messages 
         (session_id, sender_type, sender_name, content, prompt_tokens, completion_tokens, total_tokens, latency_ms, model_name)
         VALUES ($1, 'assistant', 'SITA AI Assistant', $2, 45, 120, 165, 80, 'sita-ticket-tracker')
         RETURNING *`,
        [sessionId, replyContent]
      );
      const savedAssistantMsg = assistantMsgRes.rows[0];

      if (io) {
        io.to(sessionId).emit('new_message', savedAssistantMsg);
      }

      res.json({
        userMessage: savedUserMsg,
        assistantMessage: savedAssistantMsg,
        action: 'TICKET_TRACKED',
      });
      return;
    }

    // 6. Conversational Flow: User confirms ticket creation after assistant offered it
    const isConfirmation = /^(ya|iya|tolong|buatkan|ya tolong|iya tolong|tolong buatkan|bantu buatkan|boleh|oke|ok|ya buatkan|buatkan tiket|bikin tiket|ya silakan|buatkan sekarang)$/i.test(lowerText) ||
      (lowerText.includes('tolong buatkan') || lowerText.includes('ya buatkan') || lowerText.includes('buatkan tiket'));

    const hasLostContextInHistory = fullRecentContext.includes('hilang') ||
      fullRecentContext.includes('kehilangan') ||
      fullRecentContext.includes('tertinggal') ||
      fullRecentContext.includes('ketinggalan') ||
      fullRecentContext.includes('rusak') ||
      fullRecentContext.includes('lapor');

    if (isConfirmation && hasLostContextInHistory) {
      // Auto create ticket from contextual information
      const { item, location, category } = extractIncidentInfo(fullRecentContext);
      const ticketNumber = await generateTicketNumber();
      const subject = `Laporan Kehilangan ${item} di ${location}`;
      const description = `Laporan via SITA AI Webchat oleh ${session.visitor_name}. Riwayat: "${text}". Konteks: ${item} hilang di ${location}.`;

      const ticketRes = await query(
        `INSERT INTO tickets 
         (ticket_number, session_id, name, email, phone, category, subject, description, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'MEDIUM', 'OPEN')
         RETURNING *`,
        [
          ticketNumber,
          sessionId,
          session.visitor_name,
          session.visitor_email,
          session.visitor_phone,
          category,
          subject,
          description,
        ]
      );
      const createdTicket = ticketRes.rows[0];

      // Add comment log
      await query(
        `INSERT INTO ticket_comments (ticket_id, sender_name, sender_type, comment_text)
         VALUES ($1, 'SITA AI Assistant', 'system', 'Tiket dibuat secara otomatis melalui konfirmasi percakapan webchat.')`,
        [createdTicket.id]
      );

      const confirmationReply = `Om Swastyastu Kak **${session.visitor_name}**! Laporan resmi Anda telah berhasil kami catat dan buatkan tiket:\n\n` +
        `🎫 **Nomor Tiket: \`${ticketNumber}\`**\n` +
        `• **Laporan:** Kehilangan ${item}\n` +
        `• **Lokasi:** ${location}\n` +
        `• **Status:** \`Menunggu Antrean (Open)\`\n\n` +
        `Laporan ini sudah diteruskan ke tim Tourism Helpdesk Badung dan petugas di ${location}. Petugas akan memeriksa rekaman/pos informasi dan menghubungi kontak Kakak (${session.visitor_phone}).\n\n` +
        `Kakak dapat mengecek perkembangan tiket ini kapan saja dengan mengetik **"cek tiket"**. Ada hal lain yang ingin Kakak tanyakan?`;

      const assistantMsgRes = await query(
        `INSERT INTO chat_messages 
         (session_id, sender_type, sender_name, content, prompt_tokens, completion_tokens, total_tokens, latency_ms, model_name)
         VALUES ($1, 'assistant', 'SITA AI Assistant', $2, 40, 110, 150, 70, 'sita-auto-ticketing')
         RETURNING *`,
        [sessionId, confirmationReply]
      );
      const savedAssistantMsg = assistantMsgRes.rows[0];

      if (io) {
        io.to(sessionId).emit('new_message', savedAssistantMsg);
        io.to(sessionId).emit('ticket_created', createdTicket);
      }

      res.json({
        userMessage: savedUserMsg,
        assistantMessage: savedAssistantMsg,
        action: 'TICKET_CREATED',
        ticket: createdTicket,
      });
      return;
    }

    // 7. Conversational Flow: User is reporting a lost item / incident for the first time
    const isReportingLostItem = (
      lowerText.includes('kehilangan') ||
      lowerText.includes('hilang') ||
      lowerText.includes('tertinggal') ||
      lowerText.includes('ketinggalan') ||
      lowerText.includes('kecopetan') ||
      lowerText.includes('jatuh')
    ) && !lowerText.includes('cek tiket') && !lowerText.includes('lacak tiket');

    if (isReportingLostItem) {
      const { item, location } = extractIncidentInfo(lowerText);

      let offerReply = '';
      if (location !== 'Kabupaten Badung') {
        offerReply = `Om Swastyastu Kak **${session.visitor_name}**. Aduh, mohon maaf sekali dan turut prihatin atas kejadian kehilangan ${item} di area **${location}**.\n\n` +
          `Apakah Kakak ingin saya bantu buatkan tiket laporan kehilangan resmi ke tim Tourism Helpdesk Badung dan pengelola di ${location} sekarang?\n\n` +
          `Cukup balas **"Ya, tolong buatkan"** atau klik tombol konfirmasi di bawah, nanti nomor tiket resmi langsung kami terbitkan.`;
      } else {
        offerReply = `Om Swastyastu Kak **${session.visitor_name}**. Mohon maaf sekali atas kendala kehilangan ${item} yang Kakak alami.\n\n` +
          `Agar kami dapat langsung membuatkan tiket laporan resmi ke tim penanganan lapangan, boleh tolong infokan di area wisata mana kejadiannya Kak (misal: Pura Uluwatu, Pantai Kuta, GWK)?`;
      }

      const assistantMsgRes = await query(
        `INSERT INTO chat_messages 
         (session_id, sender_type, sender_name, content, prompt_tokens, completion_tokens, total_tokens, latency_ms, model_name)
         VALUES ($1, 'assistant', 'SITA AI Assistant', $2, 35, 90, 125, 60, 'sita-lost-item-offer')
         RETURNING *`,
        [sessionId, offerReply]
      );
      const savedAssistantMsg = assistantMsgRes.rows[0];

      if (io) {
        io.to(sessionId).emit('new_message', savedAssistantMsg);
      }

      res.json({
        userMessage: savedUserMsg,
        assistantMessage: savedAssistantMsg,
        action: 'OFFER_TICKET_CREATION',
      });
      return;
    }

    // 8. Manual Ticket Form request (e.g. "buka form tiket", "isi formulir pengaduan")
    if (
      lowerText.includes('buka form') ||
      lowerText.includes('isi form') ||
      lowerText.includes('formulir tiket') ||
      lowerText.includes('form pengaduan')
    ) {
      const formReply = `Baik Kak **${session.visitor_name}**, silakan lengkapi catatan laporan Anda pada formulir tiket berikut. Data identitas (${session.visitor_email} • ${session.visitor_phone}) sudah otomatis terhubung.`;

      const assistantMsgRes = await query(
        `INSERT INTO chat_messages 
         (session_id, sender_type, sender_name, content, prompt_tokens, completion_tokens, total_tokens, latency_ms, model_name)
         VALUES ($1, 'assistant', 'SITA AI Assistant', $2, 30, 60, 90, 50, 'sita-ticket-form-trigger')
         RETURNING *`,
        [sessionId, formReply]
      );
      const savedAssistantMsg = assistantMsgRes.rows[0];

      if (io) {
        io.to(sessionId).emit('new_message', savedAssistantMsg);
      }

      res.json({
        userMessage: savedUserMsg,
        assistantMessage: savedAssistantMsg,
        action: 'SHOW_INLINE_TICKET_FORM',
      });
      return;
    }

    // 9. RAG Step: Retrieve top-k relevant knowledge chunks for general queries (GWK, beaches, culture, tickets, etc.)
    const retrievedChunks = await searchRelevantChunks(text, 3, 0.2);

    // 10. Fireworks AI Generation Step
    const aiResult = await generateChatReply(
      formattedHistory,
      retrievedChunks,
      session.visitor_name
    );

    // 11. Save Assistant Message with Token & Latency Metrics
    const assistantMsgRes = await query(
      `INSERT INTO chat_messages 
       (session_id, sender_type, sender_name, content, prompt_tokens, completion_tokens, total_tokens, latency_ms, model_name, retrieved_sources)
       VALUES ($1, 'assistant', 'SITA AI Assistant', $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        sessionId,
        aiResult.reply,
        aiResult.promptTokens,
        aiResult.completionTokens,
        aiResult.totalTokens,
        aiResult.latencyMs,
        aiResult.modelName,
        JSON.stringify(aiResult.retrievedSources),
      ]
    );
    const savedAssistantMsg = assistantMsgRes.rows[0];

    if (io) {
      io.to(sessionId).emit('new_message', savedAssistantMsg);
    }

    res.json({
      userMessage: savedUserMsg,
      assistantMessage: savedAssistantMsg,
      debug: {
        retrievedChunks,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens: aiResult.totalTokens,
        latencyMs: aiResult.latencyMs,
        modelName: aiResult.modelName,
      },
    });
  } catch (error: any) {
    console.error('Error handling chat message:', error);
    res.status(500).json({ error: 'Gagal memproses pesan obrolan.' });
  }
}

