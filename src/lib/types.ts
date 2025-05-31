// src/lib/types.ts
export interface MatchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}
