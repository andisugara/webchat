import { query } from '../db';
import { getEmbedding, cosineSimilarity, getBatchEmbeddings } from './embeddingService';
import { chunkText } from './chunkerService';

export interface RetrievedChunk {
  chunkId: string;
  knowledgeId: string;
  title: string;
  category: string;
  sourceUrl: string | null;
  chunkText: string;
  score: number;
}

/**
 * Stopwords & greetings that should not trigger RAG retrieval
 */
const GREETING_WORDS = new Set([
  'halo', 'hai', 'hello', 'hi', 'tes', 'test', 'pagi', 'siang', 'sore', 'malam',
  'apa kabar', 'lagi apa', 'sedang apa', 'siapa', 'wayan', 'made', 'nyoman', 'ketut',
  'ok', 'oke', 'makasih', 'terima kasih', 'suksma', 'matur suksma', 'bye', 'dadah', 'bos', 'gan'
]);

/**
 * Checks if query is purely conversational small-talk
 */
function isSmallTalk(queryText: string): boolean {
  const clean = queryText.toLowerCase().replace(/[^\w\s]/g, '').trim();
  if (clean.length < 3) return true;
  if (GREETING_WORDS.has(clean)) return true;
  const words = clean.split(/\s+/);
  if (words.length <= 3 && words.every((w) => GREETING_WORDS.has(w))) return true;
  return false;
}

/**
 * Calculates lexical/keyword overlap score with high weight on proper nouns and key terms
 */
function calculateLexicalScore(queryText: string, targetText: string, targetTitle: string): number {
  const normalize = (t: string) =>
    t.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !GREETING_WORDS.has(w));

  const queryWords = normalize(queryText);
  if (queryWords.length === 0) return 0;

  const targetFull = `${targetTitle} ${targetText}`.toLowerCase();
  let matches = 0;

  for (const qWord of queryWords) {
    if (qWord === 'gwk' && targetFull.includes('garuda wisnu kencana')) {
      matches += 3;
      continue;
    }
    if (qWord === 'tiket' || qWord === 'harga' || qWord === 'tarif' || qWord === 'biaya') {
      if (targetFull.includes('tiket') || targetFull.includes('tarif') || targetFull.includes('biaya') || targetFull.includes('rp')) {
        matches += 2;
        continue;
      }
    }

    if (targetFull.includes(qWord)) {
      matches += 1.5;
    }
  }

  return Math.min(1.0, matches / (queryWords.length * 1.5));
}

/**
 * Searches top-k relevant knowledge chunks using Hybrid Search (Lexical + Cosine Similarity)
 */
export async function searchRelevantChunks(
  userQuery: string,
  topK = 4,
  minThreshold = 0.18
): Promise<RetrievedChunk[]> {
  // If small talk, do not search or inject random knowledge
  if (isSmallTalk(userQuery)) {
    return [];
  }

  const queryEmb = await getEmbedding(userQuery);

  const res = await query(`
    SELECT 
      kc.id as chunk_id,
      kc.knowledge_id,
      kb.title,
      kb.category,
      kb.source_url,
      kc.chunk_text,
      kc.embedding
    FROM knowledge_chunks kc
    JOIN knowledge_bases kb ON kc.knowledge_id = kb.id
    WHERE kb.is_active = true
  `);

  if (!res.rows || res.rows.length === 0) {
    return [];
  }

  const scored: RetrievedChunk[] = [];

  for (const row of res.rows) {
    let emb: number[] = [];
    if (typeof row.embedding === 'string') {
      try {
        emb = JSON.parse(row.embedding);
      } catch (e) {
        continue;
      }
    } else if (Array.isArray(row.embedding)) {
      emb = row.embedding;
    }

    const cosScore = cosineSimilarity(queryEmb, emb);
    const lexScore = calculateLexicalScore(userQuery, row.chunk_text, row.title);

    // Hybrid score: 50% lexical + 50% cosine
    const finalScore = parseFloat((lexScore * 0.5 + cosScore * 0.5).toFixed(4));

    if (finalScore >= minThreshold || lexScore >= 0.25) {
      scored.push({
        chunkId: row.chunk_id,
        knowledgeId: row.knowledge_id,
        title: row.title,
        category: row.category,
        sourceUrl: row.source_url,
        chunkText: row.chunk_text,
        score: Math.max(finalScore, lexScore),
      });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

/**
 * Ingests and chunks a knowledge base document, computing embeddings and storing them
 */
export async function ingestKnowledge(
  knowledgeId: string,
  title: string,
  content: string
): Promise<number> {
  await query(`DELETE FROM knowledge_chunks WHERE knowledge_id = $1`, [knowledgeId]);
  const chunks = chunkText(content, 350, 50);
  if (chunks.length === 0) return 0;

  const textsToEmbed = chunks.map((c) => `Judul: ${title}\nKonten: ${c.text}`);
  const embeddings = await getBatchEmbeddings(textsToEmbed);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const emb = embeddings[i] || [];
    await query(
      `INSERT INTO knowledge_chunks (knowledge_id, chunk_index, chunk_text, embedding, token_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [knowledgeId, chunk.chunkIndex, chunk.text, JSON.stringify(emb), chunk.tokenCount]
    );
  }

  return chunks.length;
}
