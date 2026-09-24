export interface TextChunk {
  chunkIndex: number;
  text: string;
  tokenCount: number;
}

/**
 * Estimates token count for Indonesian/English text (approx 4 chars/token or 0.75 words/token)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

/**
 * Smart Semantic Chunker: splits text into chunks of targetTokenSize with overlap
 */
export function chunkText(
  text: string,
  targetTokenSize = 350,
  overlapTokens = 50
): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  // Normalize line breaks
  const clean = text.replace(/\r\n/g, '\n').trim();
  const paragraphs = clean.split(/\n\s*\n/);
  const chunks: TextChunk[] = [];
  let currentWords: string[] = [];
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const paraWords = para.trim().split(/\s+/).filter(Boolean);
    if (paraWords.length === 0) continue;

    if (currentWords.length + paraWords.length > targetTokenSize) {
      if (currentWords.length > 0) {
        const chunkContent = currentWords.join(' ');
        chunks.push({
          chunkIndex: chunkIndex++,
          text: chunkContent,
          tokenCount: estimateTokens(chunkContent),
        });

        // Retain overlap from end of previous chunk
        const overlapCount = Math.min(overlapTokens, currentWords.length);
        currentWords = currentWords.slice(currentWords.length - overlapCount);
      }
    }

    currentWords.push(...paraWords);
  }

  // Final remaining chunk
  if (currentWords.length > 0) {
    const chunkContent = currentWords.join(' ');
    chunks.push({
      chunkIndex: chunkIndex++,
      text: chunkContent,
      tokenCount: estimateTokens(chunkContent),
    });
  }

  return chunks;
}
