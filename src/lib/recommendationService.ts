// /src/lib/recommendationService.ts

import { db } from "../db";
import { usersTable, userTagsTable, tagsTable, thoughtsTable } from "../db/schema";
import { eq, ne, and, sql, isNotNull, desc } from "drizzle-orm";
import { Pinecone, ScoredPineconeRecord } from '@pinecone-database/pinecone';
import { openai } from "../lib/openai"; // You'll need to create this
import * as math from 'mathjs';

// Initialize Pinecone client - moved here from separate file
const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

type RecordMetadata = Record<string, any>;

// Types based on your existing structure - Updated for UUID strings
export type RecommendedUser = {
  id: string; // Changed from string | number to just string (UUID)
  username: string;
  nickname?: string | null; // Changed to match database nullable field
  image: string | null;
  profileImage?: string | null; // Added profileImage field
  tags: string[];
  similarity?: number;
  proximity?: number;
  score: number;
  reason?: string | null;
};

type PaginatedRecommendations = {
  users: RecommendedUser[];
  hasMore: boolean;
  nextPage: number | null;
  totalCount?: number;
  currentPage?: number;
};

type UserSummary = {
  userId: string;
  username: string;
  summary: string;
  topThoughts: string[];
};

/**
 * Gets recommendations for a user with pagination
 * Falls back to database-based recommendations if Pinecone is not available
 */
export async function getRecommendations(
  userId: string,
  page: number = 1,
  pageSize: number = 2
): Promise<PaginatedRecommendations> {
  try {
    // Try Pinecone-based recommendations first
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      return await getPineconeRecommendations(userId, page, pageSize);
    }
  } catch (error) {
    console.warn("Pinecone recommendations failed, falling back to database:", error);
  }
  
  // Fallback to database-based recommendations
  return await getDatabaseRecommendations(userId, page, pageSize);
}

/**
 * Pinecone-based recommendations (your original logic)
 */
async function getPineconeRecommendations(
  userId: string,
  page: number,
  pageSize: number
): Promise<PaginatedRecommendations> {
  // Get the latest user embedding from your database
  const userEmbedding = await getMostRecentUserEmbedding(userId);
  
  if (!userEmbedding || userEmbedding.length === 0) {
    throw new Error("No user embedding found");
  }
  
  // Query Pinecone for similar users
  const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME!);
  const queryResponse = await index.query({
    vector: userEmbedding,
    topK: pageSize * 5, // Query more than needed to account for filtering
    includeMetadata: true,
    filter: {
      userId: { $ne: userId }, // Exclude the current user
    },
  });
  
  // Get additional user data from database for the matched users
  const userIds = queryResponse.matches?.map(match => match.metadata?.userId).filter(Boolean) || [];
  
  const userDetails = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      nickname: usersTable.nickname,
      image: usersTable.image,
      profileImage: usersTable.profileImage
    })
    .from(usersTable)
    .where(sql`${usersTable.id} = ANY(${userIds})`);
  
  // Create a map for quick lookup
  const userDetailsMap = new Map(userDetails.map(user => [user.id, user]));
  
  // Process query results into recommendation format
  const results = queryResponse.matches?.map((match: ScoredPineconeRecord<RecordMetadata>) => {
    const metadata = match.metadata || {};
    const userDetail = userDetailsMap.get(metadata.userId);
    
    return {
      id: metadata.userId,
      username: userDetail?.username || metadata.username || `user${metadata.userId}`,
      nickname: userDetail?.nickname || metadata.nickname || null,
      image: userDetail?.image || null, // Get from database
      profileImage: userDetail?.profileImage || null, // Get from database
      tags: metadata.tags ? JSON.parse(metadata.tags) : [],
      similarity: match.score ?? 0,
      proximity: metadata.proximity || undefined,
      score: calculateOverallScore(match.score ?? 0, metadata.proximity),
      reason: null,
    };
  }) || [];
  
  // Sort by score and paginate
  const sortedResults = results.sort((a, b) => b.score - a.score);
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedResults = sortedResults.slice(startIdx, endIdx);
  
  return {
    users: paginatedResults,
    hasMore: endIdx < sortedResults.length,
    nextPage: endIdx < sortedResults.length ? page + 1 : null,
    totalCount: sortedResults.length,
    currentPage: page,
  };
}

/**
 * Database-based recommendations (fallback)
 */
async function getDatabaseRecommendations(
  userId: string,
  page: number,
  pageSize: number
): Promise<PaginatedRecommendations> {
  const offset = (page - 1) * pageSize;

  // Get current user's data for matching preferences
  const currentUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (currentUser.length === 0) {
    throw new Error("Current user not found");
  }

  const user = currentUser[0];

  // Get current user's tags for similarity scoring
  const userTags = await db
    .select({
      tagId: userTagsTable.tagId,
      tagName: tagsTable.name,
      category: tagsTable.category
    })
    .from(userTagsTable)
    .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
    .where(eq(userTagsTable.userId, userId));

  const userTagIds = userTags.map(tag => tag.tagId);

  // Build gender preference filter
  let genderFilter = sql`1=1`; // Default to no filter
  
  if (user.genderPreference === 'men') {
    genderFilter = eq(usersTable.gender, 'male');
  } else if (user.genderPreference === 'women') {
    genderFilter = eq(usersTable.gender, 'female');
  }

  // Calculate age range from preferences
  const currentDate = new Date();
  const minBirthYear = currentDate.getFullYear() - (user.preferredAgeMax || 50);
  const maxBirthYear = currentDate.getFullYear() - (user.preferredAgeMin || 18);

  // Build proximity filter
  let proximityFilter = sql`1=1`;
  if (user.proximity === 'local' && user.metro_area) {
    proximityFilter = eq(usersTable.metro_area, user.metro_area);
  }

  // Get potential matches with image fields
  const potentialMatches = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      nickname: usersTable.nickname,
      image: usersTable.image,
      profileImage: usersTable.profileImage,
      dob: usersTable.dob,
      gender: usersTable.gender,
      metro_area: usersTable.metro_area
    })
    .from(usersTable)
    .where(
      and(
        ne(usersTable.id, userId), // Exclude current user
        genderFilter,
        proximityFilter,
        sql`EXTRACT(YEAR FROM ${usersTable.dob}) BETWEEN ${minBirthYear} AND ${maxBirthYear}`
      )
    )
    .limit(pageSize * 3) // Get more to rank and filter
    .offset(offset);

  // Score matches based on common tags
  let scoredMatches: RecommendedUser[] = [];
  
  for (const match of potentialMatches) {
    // Get tags for this potential match
    const matchTags = await db
      .select({
        tagId: userTagsTable.tagId,
        tagName: tagsTable.name,
        category: tagsTable.category
      })
      .from(userTagsTable)
      .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
      .where(eq(userTagsTable.userId, match.id));

    const matchTagIds = matchTags.map(tag => tag.tagId);
    
    // Calculate compatibility score
    const commonTagIds = userTagIds.filter(tagId => matchTagIds.includes(tagId));
    const score = commonTagIds.length;

    scoredMatches.push({
      id: match.id,
      username: match.username,
      nickname: match.nickname,
      image: match.image, // Use actual image from database
      profileImage: match.profileImage, // Use actual profileImage from database
      tags: matchTags.map(tag => tag.tagName).slice(0, 5), // Limit displayed tags
      score,
      reason: null // Will be generated later if needed
    });
  }

  // Sort by score (highest compatibility first)
  scoredMatches.sort((a, b) => b.score - a.score);

  // Take only the requested page size
  const finalMatches = scoredMatches.slice(0, pageSize);

  // Get total count for pagination
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(
      and(
        ne(usersTable.id, userId),
        genderFilter,
        proximityFilter,
        sql`EXTRACT(YEAR FROM ${usersTable.dob}) BETWEEN ${minBirthYear} AND ${maxBirthYear}`
      )
    );

  const totalCount = Number(totalCountResult[0]?.count || 0);
  const hasMore = (offset + pageSize) < totalCount;

  return {
    users: finalMatches,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
    totalCount,
    currentPage: page
  };
}

/**
 * Calculate similarity score between two users' thought embeddings
 */
async function calculatePairwiseSimilarity(userAThoughts: number[][], userBThoughts: number[][]) {
  // Calculate cosine similarity between all pairs of thoughts
  const similarityMatrix = [] as number[][];
  
  for (let i = 0; i < userAThoughts.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < userBThoughts.length; j++) {
      const similarity = Number(math.dot(userAThoughts[i], userBThoughts[j])) / 
        (Number(math.norm(userAThoughts[i])) * Number(math.norm(userBThoughts[j])));
      similarityMatrix[i][j] = similarity;
    }
  }
  
  return similarityMatrix;
}

/**
 * Get top N most similar thought pairs between two users
 */
async function getTopSimilarThoughtPairs(
  userAId: string,
  userBId: string,
  topN: number = 4
) {
  try {
    // Fetch thought embeddings for both users
    const userAThoughts = await getUserThoughtEmbeddings(userAId);
    const userBThoughts = await getUserThoughtEmbeddings(userBId);
    
    if (!userAThoughts.embeddings.length || !userBThoughts.embeddings.length) {
      return [];
    }
    
    // Calculate similarity matrix
    const similarityMatrix = await calculatePairwiseSimilarity(
      userAThoughts.embeddings,
      userBThoughts.embeddings
    );
    
    // Find top N pairs
    const pairs = [] as {
      userAThoughtId: string;
      userBThoughtId: string;
      similarity: number;
      userAThoughtText: string;
      userBThoughtText: string;
    }[];
    
    // Flatten matrix and sort by similarity
    const flatPairs = [];
    for (let i = 0; i < similarityMatrix.length; i++) {
      for (let j = 0; j < similarityMatrix[i].length; j++) {
        flatPairs.push({
          userAIdx: i,
          userBIdx: j,
          similarity: similarityMatrix[i][j]
        });
      }
    }
    
    // Sort by similarity descending
    flatPairs.sort((a, b) => b.similarity - a.similarity);
    
    // Take top N pairs
    const topPairs = flatPairs.slice(0, topN);
    
    // Map indices back to actual thoughts
    for (const pair of topPairs) {
      pairs.push({
        userAThoughtId: userAThoughts.thoughtIds[pair.userAIdx],
        userBThoughtId: userBThoughts.thoughtIds[pair.userBIdx],
        similarity: pair.similarity,
        userAThoughtText: userAThoughts.thoughtTexts[pair.userAIdx],
        userBThoughtText: userBThoughts.thoughtTexts[pair.userBIdx]
      });
    }
    
    return pairs;
  } catch (error) {
    console.error("Error getting top similar thought pairs:", error);
    return [];
  }
}

/**
 * Generate user summary based on top thoughts
 */
async function generateUserSummary(
  userId: string,
  username: string,
  thoughts: string[]
): Promise<string> {
  // For now, just concatenate thoughts with a character limit
  const combinedThoughts = thoughts.join(" ");
  return combinedThoughts.substring(0, 400);
}

/**
 * Generate explanation for why two users should connect
 * Enhanced with database fallback
 */
export async function generateConnectionExplanation(
  userA: RecommendedUser,
  currentUserId: string
): Promise<string> {
  try {
    // Try AI-based explanation first if OpenAI is configured
    if (process.env.OPENAI_API_KEY) {
      return await generateAIExplanation(userA, currentUserId);
    }
  } catch (error) {
    console.warn("AI explanation failed, falling back to database:", error);
  }
  
  // Fallback to database-based explanation
  return await generateDatabaseExplanation(userA, currentUserId);
}

/**
 * AI-based explanation generation with updated prompt
 */
async function generateAIExplanation(
  userA: RecommendedUser,
  currentUserId: string
): Promise<string> {
  // Get top similar thought pairs
  const topPairs = await getTopSimilarThoughtPairs(currentUserId, userA.id);
  
  if (topPairs.length === 0) {
    throw new Error("No thought pairs found");
  }
  
  // Create summaries for both users
  const userAThoughts = topPairs.map(p => p.userAThoughtText);
  const userBThoughts = topPairs.map(p => p.userBThoughtText);
  
  const currentUser = await getUserBasicInfo(currentUserId);
  
  const userASummary = await generateUserSummary(
    currentUserId,
    currentUser.username,
    userAThoughts
  );
  
  const userBSummary = await generateUserSummary(
    userA.id,
    userA.username,
    userBThoughts
  );
  
  // Get display names (nickname if available, otherwise username)
  const currentUserNickname = currentUser.username; // This already handles nickname fallback
  const recommendedUserNickname = userA.nickname || userA.username;
  
  // Call OpenAI with your new prompt structure
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", 
    messages: [
      {
        role: "system",
        content: `You create explanations about why two users might connect. Write in 80-100 words total. The first half should be a narrative about the person being recommended (using their nickname), describing their journey and approach. The second half should explain similarities and potential connections, addressing the user as "you" and referring to the recommended person by their nickname.

Examples:
"Alex documents their creative process through thoughtful reflections, capturing moments of inspiration and struggle alike. Their entries about finding balance between structure and spontaneity in art mirror your own creative journey. Your shared passion for mindfulness practices and creative expression suggests a potential meaningful connection. Their experience with meditation retreats aligns with your interest in developing a consistent practice, while their approach to integrating creativity into daily life complements your exploration of artistic expression as a form of self-discovery."

"Belle uses Mirro to remember who she was when the world told her to forget. Her journal entries about self-discovery and resilience mirror your own journey of finding authenticity in a world that often demands conformity. The way she describes her hiking adventures and moments of clarity while surrounded by nature resonates with your own reflections. You both share a deep appreciation for literature that explores identity and transformation. Her perspective on coming-of-age stories could complement your interest in narratives about personal growth and self-acceptance. You're both navigating similar life transitions with thoughtfulness and introspection."`
      },
      {
        role: "user",
        content: `Generate an 80-100 word explanation for why you should connect with ${recommendedUserNickname}.
        
        First half: Write a narrative about ${recommendedUserNickname} and their journey/approach based on: ${userBSummary}
        
        Second half: Explain similarities and connections between you (the user) and ${recommendedUserNickname}, addressing the user directly as "you". You (the user) are described as: ${userASummary}`
      }
    ],
    max_tokens: 200,
    temperature: 0.7,
  });
  
  return response.choices[0].message.content || "We think you two might have a lot in common based on your thoughts and interests.";
}

/**
 * Database-based explanation generation (fallback)
 */
async function generateDatabaseExplanation(
  userA: RecommendedUser,
  currentUserId: string
): Promise<string> {
  // Get current user's tags
  const currentUserTags = await db
    .select({
      tagName: tagsTable.name,
      category: tagsTable.category
    })
    .from(userTagsTable)
    .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
    .where(eq(userTagsTable.userId, currentUserId));

  // Get recommended user's tags
  const recommendedUserTags = await db
    .select({
      tagName: tagsTable.name,
      category: tagsTable.category
    })
    .from(userTagsTable)
    .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
    .where(eq(userTagsTable.userId, userA.id));

  // Find common interests
  const currentUserInterests = currentUserTags
    .filter(tag => tag.category === 'interest')
    .map(tag => tag.tagName);
  
  const recommendedUserInterests = recommendedUserTags
    .filter(tag => tag.category === 'interest')
    .map(tag => tag.tagName);

  const commonInterests = currentUserInterests.filter(interest => 
    recommendedUserInterests.includes(interest)
  );

  // Find common contexts
  const currentUserContexts = currentUserTags
    .filter(tag => tag.category === 'context')
    .map(tag => tag.tagName);
  
  const recommendedUserContexts = recommendedUserTags
    .filter(tag => tag.category === 'context')
    .map(tag => tag.tagName);

  const commonContexts = currentUserContexts.filter(context => 
    recommendedUserContexts.includes(context)
  );

  // Find common intentions
  const currentUserIntentions = currentUserTags
    .filter(tag => tag.category === 'intention')
    .map(tag => tag.tagName);
  
  const recommendedUserIntentions = recommendedUserTags
    .filter(tag => tag.category === 'intention')
    .map(tag => tag.tagName);

  const commonIntentions = currentUserIntentions.filter(intention => 
    recommendedUserIntentions.includes(intention)
  );

  // Generate explanation based on commonalities
  const displayName = userA.nickname || userA.username;
  let explanation = "";

  if (commonInterests.length > 0) {
    if (commonInterests.length === 1) {
      explanation = `You both share an interest in ${commonInterests[0]}.`;
    } else if (commonInterests.length === 2) {
      explanation = `You both enjoy ${commonInterests[0]} and ${commonInterests[1]}.`;
    } else {
      const firstTwo = commonInterests.slice(0, 2);
      const remaining = commonInterests.length - 2;
      explanation = `You both enjoy ${firstTwo.join(', ')} and ${remaining} other shared interest${remaining > 1 ? 's' : ''}.`;
    }
  }

  if (commonContexts.length > 0) {
    const contextText = commonContexts.length === 1 
      ? commonContexts[0] 
      : `${commonContexts[0]} and other similar situations`;
    
    if (explanation) {
      explanation += ` You're also both navigating ${contextText.toLowerCase()}.`;
    } else {
      explanation = `You're both in similar life situations around ${contextText.toLowerCase()}.`;
    }
  }

  if (commonIntentions.length > 0) {
    const intentionText = commonIntentions.length === 1 
      ? commonIntentions[0] 
      : `${commonIntentions[0]} and other shared goals`;
    
    if (explanation) {
      explanation += ` Plus, you both are looking for ${intentionText.toLowerCase()}.`;
    } else {
      explanation = `You both are seeking ${intentionText.toLowerCase()}.`;
    }
  }

  // Fallback if no common tags
  if (!explanation) {
    explanation = `${displayName} might offer a fresh perspective with different interests and experiences.`;
  }

  return explanation;
}

// Helper functions that integrate with your existing scripts

/**
 * Parse embedding string to number array (from syncEmbeddingsToPinecone.ts)
 */
function parseEmbedding(str: string): number[] | null {
  try {
    const embedding = JSON.parse(str);
    // Validate it's actually an array of numbers with reasonable length
    if (
      Array.isArray(embedding) && 
      embedding.length > 0 &&
      embedding.every(val => typeof val === 'number')
    ) {
      return embedding;
    }
    console.warn("Invalid embedding format:", typeof embedding, Array.isArray(embedding) ? `length: ${embedding.length}` : "");
    return null;
  } catch (error) {
    console.error("Failed to parse embedding:", error);
    return null;
  }
}

/**
 * Get most recent user embedding - integrated from syncEmbeddingsToPinecone.ts
 */
async function getMostRecentUserEmbedding(userId: string): Promise<number[]> {
  try {
    // Get the most recent thought with embedding for this specific user
    const userThought = await db
      .select()
      .from(thoughtsTable)
      .where(
        and(
          eq(thoughtsTable.userId, userId),
          isNotNull(thoughtsTable.embedding)
        )
      )
      .orderBy(desc(thoughtsTable.createdAt))
      .limit(1);

    if (userThought.length === 0) {
      console.log(`No thoughts with embeddings found for user ${userId}`);
      return [];
    }

    const embedding = parseEmbedding(userThought[0].embedding);
    if (!embedding) {
      console.log(`Invalid embedding found for user ${userId}`);
      return [];
    }

    return embedding;
  } catch (error) {
    console.error("Error getting user embedding:", error);
    return [];
  }
}

/**
 * Get all thought embeddings for a user - integrated from updateThoughtEmbeddings.ts
 */
async function getUserThoughtEmbeddings(userId: string) {
  try {
    // Get all thoughts with embeddings for this user
    const thoughts = await db
      .select()
      .from(thoughtsTable)
      .where(
        and(
          eq(thoughtsTable.userId, userId),
          isNotNull(thoughtsTable.embedding),
          isNotNull(thoughtsTable.content)
        )
      )
      .orderBy(desc(thoughtsTable.createdAt));

    const thoughtIds: string[] = [];
    const thoughtTexts: string[] = [];
    const embeddings: number[][] = [];

    for (const thought of thoughts) {
      if (!thought.content || !thought.embedding) continue;

      const embedding = parseEmbedding(thought.embedding);
      if (embedding) {
        thoughtIds.push(thought.id.toString());
        thoughtTexts.push(thought.content);
        embeddings.push(embedding);
      }
    }

    console.log(`Retrieved ${embeddings.length} valid embeddings for user ${userId}`);

    return {
      thoughtIds,
      thoughtTexts,
      embeddings,
    };
  } catch (error) {
    console.error("Error getting user thought embeddings:", error);
    return {
      thoughtIds: [] as string[],
      thoughtTexts: [] as string[],
      embeddings: [] as number[][],
    };
  }
}

async function getUserBasicInfo(userId: string) {
  // Get basic user info from your database
  try {
    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    
    return {
      username: user[0]?.nickname || user[0]?.username || `user${userId}`,
    };
  } catch (error) {
    console.error("Error getting user basic info:", error);
    return {
      username: `user${userId}`,
    };
  }
}

function calculateOverallScore(similarity: number, proximity?: number): number {
  // Your existing logic for calculating an overall score
  if (proximity === undefined) return similarity;
  
  // Example: Weight similarity more than proximity
  const proximityNormalized = 100 - Math.min(proximity, 100);
  return (similarity * 0.7) + ((proximityNormalized / 100) * 0.3);
}

// Export functions that might be used by other scripts
export {
  getMostRecentUserEmbedding,
  getUserThoughtEmbeddings,
  parseEmbedding
};