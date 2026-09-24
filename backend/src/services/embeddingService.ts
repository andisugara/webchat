import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY || '';
const EMBEDDING_MODEL = process.env.FIREWORKS_EMBEDDING_MODEL || 'nomic-ai/nomic-embed-text-v1.5';

/**
 * Calculates Cosine Similarity between two numerical vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic fallback embedding generator (768 dimensions)
 * Used when FIREWORKS_API_KEY is not configured or in offline test mode
 */
function generateLocalEmbedding(text: string, dimensions = 768): number[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  const vec = new Array(dimensions).fill(0);

  if (words.length === 0) return vec;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const hash1 = (charCode * 31 + j * 17 + i * 13) % dimensions;
      const hash2 = (charCode * 43 + j * 7 + i * 29) % dimensions;
      vec[hash1] += 1.0 / (1 + j);
      vec[hash2] += 0.5 / (1 + i);
    }
  }

  // Normalize L2
  let norm = 0;
  for (let i = 0; i < dimensions; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) vec[i] = parseFloat((vec[i] / norm).toFixed(6));
  }
  return vec;
}

/**
 * Generates an embedding vector for a single text input
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) return new Array(768).fill(0);

  if (FIREWORKS_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.fireworks.ai/inference/v1/embeddings',
        {
          input: cleanText,
          model: EMBEDDING_MODEL,
        },
        {
          headers: {
            'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.data && response.data.data[0]?.embedding) {
        return response.data.data[0].embedding;
      }
    } catch (error: any) {
      console.warn('⚠️ Fireworks Embedding API call failed, falling back to local vectorizer:', error?.message);
    }
  }

  return generateLocalEmbedding(cleanText);
}

/**
 * Batch generates embeddings for multiple chunks
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const emb = await getEmbedding(text);
    results.push(emb);
  }
  return results;
}
