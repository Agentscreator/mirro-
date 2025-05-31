// lib/similarityUtils.ts
import * as math from 'mathjs';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { thoughtsTable, usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Calculate dot product
  const dotProduct = math.dot(vecA, vecB) as number;
  
  // Calculate magnitudes
  const magnitudeA = math.norm(vecA) as number;
  const magnitudeB = math.norm(vecB) as number;
  
  // Calculate cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate pairwise similarity matrix between two sets of vectors
 */
export function pairwiseSimilarityMatrix(
  vectorsA: number[][], 
  vectorsB: number[][]
): number[][] {
  const matrix: number[][] = [];
  
  for (let i = 0; i < vectorsA.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < vectorsB.length; j++) {
      matrix[i][j] = cosineSimilarity(vectorsA[i], vectorsB[j]);
    }
  }
  
  return matrix;
}

/**
 * Get thought embeddings for a user
 */
export async function getUserThoughtEmbeddings(userId: string | number) {
  // Query to get the latest embedding for each thought by the user
  const latestEmbeddings = await db
    .select({
      thoughtId: thoughtsTable.id,
      thoughtText: thoughtsTable.content,
      embedding: thoughtsTable.embedding,
      createdAt: thoughtsTable.createdAt,
    })
    .from(thoughtsTable)
    .where(eq(thoughtsTable.userId, userId.toString()))
    // Get only the latest embedding for each thought
    .orderBy(thoughtsTable.createdAt)
    .groupBy(thoughtsTable.id);
  
  return {
    thoughtIds: latestEmbeddings.map(e => e.thoughtId),
    thoughtTexts: latestEmbeddings.map(e => e.thoughtText),
    embeddings: latestEmbeddings.map(e => 
      // Convert string representation of embedding to actual array of numbers
      Array.isArray(e.embedding) 
        ? e.embedding 
        : JSON.parse(e.embedding as string)
    ),
  };
}

/**
 * Find top N similar thought pairs between two users
 */
export async function findTopSimilarThoughtPairs(
  userAId: string | number,
  userBId: string | number,
  topN: number = 4
) {
  // Get thought embeddings for both users
  const userAThoughts = await getUserThoughtEmbeddings(userAId);
  const userBThoughts = await getUserThoughtEmbeddings(userBId);
  
  // Calculate similarity matrix
  const similarityMatrix = pairwiseSimilarityMatrix(
    userAThoughts.embeddings,
    userBThoughts.embeddings
  );
  
  // Flatten and find top N pairs
  const pairs = [];
  
  for (let i = 0; i < similarityMatrix.length; i++) {
    for (let j = 0; j < similarityMatrix[i].length; j++) {
      pairs.push({
        userAThoughtId: userAThoughts.thoughtIds[i],
        userBThoughtId: userBThoughts.thoughtIds[j],
        userAThoughtText: userAThoughts.thoughtTexts[i],
        userBThoughtText: userBThoughts.thoughtTexts[j],
        similarity: similarityMatrix[i][j],
      });
    }
  }
  
  // Sort by similarity (descending)
  pairs.sort((a, b) => b.similarity - a.similarity);
  
  // Return top N pairs
  return pairs.slice(0, topN);
}

/**
 * Generate a summary for a user based on their thoughts
 */
export function generateUserSummary(
  thoughts: string[],
  maxLength: number = 400
): string {
  // Concatenate thoughts with space and truncate to max length
  return thoughts.join(" ").substring(0, maxLength);
}

/**
 * Get basic user info from database
 */
export async function getUserBasicInfo(userId: string | number) {
  const user = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      // Add other fields as needed
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId.toString()))
    .limit(1);
  
  return user[0] || null;
}