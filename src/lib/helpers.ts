// src/lib/helpers.ts
export const getMostRecentEmbedding = (embeddings: number[][]): number[] | null => {
  if (!embeddings || embeddings.length === 0) return null;
  return embeddings[embeddings.length - 1]; // assuming newest is last
};
