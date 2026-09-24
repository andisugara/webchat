import { Request, Response } from 'express';
import { query } from '../db';
import { ingestKnowledge } from '../services/ragService';
import { scrapeSitaPortal } from '../services/scraperService';

/**
 * Lists all knowledge base entries with chunk counts
 */
export async function listKnowledge(req: Request, res: Response): Promise<void> {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT 
        kb.*,
        (SELECT COUNT(*) FROM knowledge_chunks WHERE knowledge_id = kb.id) as chunks_count,
        (SELECT SUM(token_count) FROM knowledge_chunks WHERE knowledge_id = kb.id) as total_tokens
      FROM knowledge_bases kb
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND kb.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${String(search).trim()}%`);
      sql += ` AND (kb.title ILIKE $${params.length} OR kb.raw_content ILIKE $${params.length})`;
    }

    sql += ` ORDER BY kb.updated_at DESC`;

    const result = await query(sql, params);
    res.json({ knowledge: result.rows });
  } catch (error: any) {
    console.error('Error listing knowledge:', error);
    res.status(500).json({ error: 'Gagal mengambil data knowledge base.' });
  }
}

/**
 * Creates a new knowledge entry and automatically chunks + embeds
 */
export async function createKnowledge(req: Request, res: Response): Promise<void> {
  try {
    const { title, category, sourceUrl, rawContent } = req.body;

    if (!title || !rawContent) {
      res.status(400).json({ error: 'Judul dan Konten wajib diisi.' });
      return;
    }

    const kbRes = await query(
      `INSERT INTO knowledge_bases (title, category, source_url, raw_content, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [title.trim(), category || 'umum', sourceUrl || null, rawContent.trim()]
    );

    const kb = kbRes.rows[0];
    const chunksCount = await ingestKnowledge(kb.id, kb.title, kb.raw_content);

    res.status(201).json({
      knowledge: kb,
      chunksCount,
      message: 'Knowledge base berhasil ditambahkan dan di-embed.',
    });
  } catch (error: any) {
    console.error('Error creating knowledge:', error);
    res.status(500).json({ error: 'Gagal menambahkan knowledge base.' });
  }
}

/**
 * Updates a knowledge entry and re-embeds
 */
export async function updateKnowledge(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, category, sourceUrl, rawContent, isActive } = req.body;

    const kbRes = await query(
      `UPDATE knowledge_bases 
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           source_url = COALESCE($3, source_url),
           raw_content = COALESCE($4, raw_content),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title || null, category || null, sourceUrl || null, rawContent || null, isActive !== undefined ? isActive : null, id]
    );

    if (kbRes.rows.length === 0) {
      res.status(404).json({ error: 'Knowledge base tidak ditemukan.' });
      return;
    }

    const kb = kbRes.rows[0];
    const chunksCount = await ingestKnowledge(kb.id, kb.title, kb.raw_content);

    res.json({
      knowledge: kb,
      chunksCount,
      message: 'Knowledge base berhasil diperbarui dan di-embed ulang.',
    });
  } catch (error: any) {
    console.error('Error updating knowledge:', error);
    res.status(500).json({ error: 'Gagal memperbarui knowledge base.' });
  }
}

/**
 * Deletes a knowledge base entry
 */
export async function deleteKnowledge(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await query(`DELETE FROM knowledge_bases WHERE id = $1`, [id]);
    res.json({ message: 'Knowledge base berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({ error: 'Gagal menghapus knowledge base.' });
  }
}

/**
 * Triggers live web scraper for SITA Badung
 */
export async function triggerScraper(req: Request, res: Response): Promise<void> {
  try {
    const result = await scrapeSitaPortal();
    res.json({
      message: 'Sinkronisasi portal SITA Badung selesai.',
      result,
    });
  } catch (error: any) {
    console.error('Error triggering scraper:', error);
    res.status(500).json({ error: 'Gagal menjalankan web scraper SITA Badung.' });
  }
}
