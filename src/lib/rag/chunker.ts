import { KnowledgeChunk } from '../db/types';

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

/**
 * Splits document content into structured chunks with section titles,
 * keyword tags, and positional indices for RAG retrieval.
 */
export function chunkDocument(
  documentId: string,
  documentTitle: string,
  content: string,
  options: ChunkOptions = {}
): KnowledgeChunk[] {
  const chunkSize = options.chunkSize || 450;
  const overlap = options.overlap || 80;

  // Split by double newline or headers if possible
  const rawParagraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: KnowledgeChunk[] = [];
  let currentChunkText = '';
  let currentSection = 'General Information';
  let chunkIndex = 0;

  for (const para of rawParagraphs) {
    // Check if paragraph looks like a section header (e.g. "Visiting Hours:" or "### Requirements")
    const headerMatch = para.match(/^(?:###?\s*|\*\*|)([A-Z][A-Za-z0-9\s,&/-]{3,50})(?:\*\*|:)/);
    if (headerMatch && para.length < 90) {
      currentSection = headerMatch[1].trim();
      continue;
    }

    if ((currentChunkText + ' ' + para).length > chunkSize && currentChunkText.length > 0) {
      chunks.push({
        id: `chunk_${documentId}_${chunkIndex}`,
        documentId,
        documentTitle,
        sectionTitle: currentSection,
        content: currentChunkText.trim(),
        tags: extractKeywords(currentChunkText),
        chunkIndex,
      });
      chunkIndex++;

      // Retain overlap from end of previous chunk
      const words = currentChunkText.split(' ');
      const overlapWords = words.slice(Math.max(0, words.length - Math.floor(overlap / 6)));
      currentChunkText = overlapWords.join(' ') + ' ' + para;
    } else {
      currentChunkText = currentChunkText ? currentChunkText + '\n' + para : para;
    }
  }

  // Push remaining buffer
  if (currentChunkText.trim().length > 0) {
    chunks.push({
      id: `chunk_${documentId}_${chunkIndex}`,
      documentId,
      documentTitle,
      sectionTitle: currentSection,
      content: currentChunkText.trim(),
      tags: extractKeywords(currentChunkText),
      chunkIndex,
    });
  }

  return chunks;
}

/**
 * Extracts key domain keywords for faster lexical + semantic matching.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'as', 'by',
    'that', 'this', 'it', 'from', 'be', 'are', 'or', 'your', 'you', 'we', 'our', 'all', 'can', 'must',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 8);
}
