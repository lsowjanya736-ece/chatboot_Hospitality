/**
 * High-performance vector math & text similarity utilities
 * Computes cosine similarity between query tokens and document chunks.
 */

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function computeTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize
  for (const [token, count] of tf.entries()) {
    tf.set(token, count / tokens.length);
  }
  return tf;
}

export function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const val of vecA.values()) {
    normA += val * val;
  }
  for (const val of vecB.values()) {
    normB += val * val;
  }

  if (normA === 0 || normB === 0) return 0;

  for (const [term, valA] of vecA.entries()) {
    if (vecB.has(term)) {
      dotProduct += valA * (vecB.get(term) || 0);
    }
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Enhanced hybrid score combining TF-IDF vector similarity with
 * phrase matching and semantic tags.
 */
export function calculateHybridSimilarity(
  query: string,
  chunkContent: string,
  tags: string[],
  sectionTitle: string
): number {
  const queryLower = query.toLowerCase();
  const chunkLower = chunkContent.toLowerCase();

  // 1. Vector Cosine Similarity
  const queryTokens = tokenize(query);
  const chunkTokens = tokenize(chunkContent + ' ' + sectionTitle);
  const tfQuery = computeTermFrequency(queryTokens);
  const tfChunk = computeTermFrequency(chunkTokens);
  const cosSim = cosineSimilarity(tfQuery, tfChunk);

  // 2. Exact multi-word phrase boost
  let phraseBoost = 0;
  for (let i = 0; i < queryTokens.length - 1; i++) {
    const biGram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
    if (chunkLower.includes(biGram)) {
      phraseBoost += 0.15;
    }
  }

  // 3. Section Title / Tag relevance boost
  let tagBoost = 0;
  for (const tag of tags) {
    if (queryLower.includes(tag.toLowerCase())) {
      tagBoost += 0.12;
    }
  }

  if (queryLower.includes(sectionTitle.toLowerCase())) {
    tagBoost += 0.2;
  }

  // Combine and clamp between 0.0 and 0.99
  const compositeScore = cosSim * 0.55 + Math.min(0.35, phraseBoost) + Math.min(0.3, tagBoost);
  return Math.min(0.98, Math.max(0.05, compositeScore));
}
