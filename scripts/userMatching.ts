import { db } from "../src/db";
import { usersTable, userTagsTable, thoughtsTable } from "../src/db/schema";
import { eq, and, ne, lte, gte } from "drizzle-orm";
import { querySimilarUsers } from "../src/lib/vectorStore";

type Proximity = "Local" | "Metro" | "Countrywide" | "Global";

const proximityToKm: Record<Proximity, number> = {
  Local: 50,
  Metro: 100,
  Countrywide: 1000,
  Global: Infinity,
};

function calculateAge(dob: Date | string): number {
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return new Date(diff).getUTCFullYear() - 1970;
}

function parseEmbedding(str: string): number[] {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

function getMostRecentEmbedding(thoughts: any[]): number[] | null {
  if (!thoughts || thoughts.length === 0) {
    console.log("No thoughts found for user");
    return null;
  }
  
  const latest = thoughts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  
  if (!latest?.embedding) {
    console.log("Latest thought has no embedding");
    return null;
  }
  
  const parsed = parseEmbedding(latest.embedding);
  if (parsed.length === 0) {
    console.log("Failed to parse embedding");
    return null;
  }
  
  return parsed;
}

interface UserSimilarityMatch {
  userId: string;
  similarity: number;
}

async function getEmbeddingSimilarityMatches(
  currentUserId: string,
  candidateIds: string[]
): Promise<UserSimilarityMatch[]> {
  if (candidateIds.length === 0) {
    console.log("No candidate IDs provided for similarity matching");
    return [];
  }

  const currentUserThoughts = await db
    .select()
    .from(thoughtsTable)
    .where(eq(thoughtsTable.userId, currentUserId));

  const currentUserEmbedding = getMostRecentEmbedding(currentUserThoughts);

  if (!currentUserEmbedding) {
    console.warn("No valid embedding for current user");
    // Return candidates with zero similarity score
    return candidateIds.map((id) => ({ userId: id, similarity: 0 }));
  }

  try {
    const matchesRaw = await querySimilarUsers(
      currentUserEmbedding,
      candidateIds,
      candidateIds.length
    );

    return matchesRaw.map((match) => ({
      userId: match.userId,
      similarity: match.similarity,
    }));
  } catch (error) {
    console.error("Error querying similar users:", error);
    // Fallback to returning candidates with zero similarity
    return candidateIds.map((id) => ({ userId: id, similarity: 0 }));
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreCandidate(
  sharedTagsCount: number,
  embeddingSimilarity: number,
  proximityKm: number
): number {
  const tagWeight = 0.4;
  const embeddingWeight = 0.5;
  const proximityWeight = 0.1;

  const proximityScore = proximityKm === 0 ? 1 : 1 / proximityKm;

  return (
    tagWeight * sharedTagsCount +
    embeddingWeight * embeddingSimilarity +
    proximityWeight * proximityScore
  );
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
    totalCount?: number;
  };
}

export async function getCandidateUsers(
  userId: string,
  page: number = 1,
  pageSize: number = 2
): Promise<PaginatedResponse<{
  user: any;
  sharedTags: number[];
  similarity: number;
  proximityKm: number;
  score: number;
}>> {
  console.log(`Looking for matches for user: ${userId}`);
  
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) throw new Error(`User not found: ${userId}`);
  console.log(`Found user: ${user.username || user.id}`);

  const userAge = calculateAge(user.dob);
  console.log(`User age: ${userAge}`);
  
  // Get user's tags
  const userTagRows = await db
    .select({ tagId: userTagsTable.tagId })
    .from(userTagsTable)
    .where(eq(userTagsTable.userId, userId));

  const userTagIds = userTagRows.map((row) => row.tagId);
  console.log(`User has ${userTagIds.length} tags`);

  // Build gender preference condition
  const genderCondition =
    !user.genderPreference || user.genderPreference === "No Preference"
      ? undefined
      : eq(usersTable.gender, user.genderPreference);
      
  console.log(`Gender preference: ${user.genderPreference || "No Preference"}`);

  // Build query conditions
  const candidateConditions = [
    ne(usersTable.id, userId), // Not the same user
  ];
  
  // Only add gender filter if specified
  if (genderCondition) {
    candidateConditions.push(genderCondition);
  }
  
  // Only add age filters if values are set
  if (user.preferredAgeMin !== null && user.preferredAgeMin !== undefined) {
    candidateConditions.push(lte(usersTable.preferredAgeMin, userAge));
  }
  
  if (user.preferredAgeMax !== null && user.preferredAgeMax !== undefined) {
    candidateConditions.push(gte(usersTable.preferredAgeMax, userAge));
  }

  // Get all potential candidates
  const candidates = await db
    .select()
    .from(usersTable)
    .where(and(...candidateConditions))
    .limit(1000); // Still need a reasonable limit

  console.log(`Found ${candidates.length} initial candidates after gender/age filtering`);

  // Apply proximity filtering
  const proximityKmLimit = proximityToKm[user.proximity as Proximity] || Infinity;
  console.log(`Proximity limit: ${proximityKmLimit} km (${user.proximity || "Global"})`);
  
  const proximityFiltered = candidates.filter((candidate) => {
    // Skip proximity check if coordinates missing
    if (
      user.latitude == null ||
      user.longitude == null ||
      candidate.latitude == null ||
      candidate.longitude == null
    ) {
      console.log(`Skipping proximity check for ${candidate.id} - missing coordinates`);
      return true; // Include candidates without location data
    }
    
    const dist = haversineDistance(
      user.latitude,
      user.longitude,
      candidate.latitude,
      candidate.longitude
    );
    return dist <= proximityKmLimit;
  });

  console.log(`${proximityFiltered.length} candidates after proximity filtering`);

  // Check for shared tags
  const tagMatched: {
    user: typeof user;
    sharedTags: number[];
  }[] = [];

  for (const candidate of proximityFiltered) {
    const candidateTags = await db
      .select({ tagId: userTagsTable.tagId })
      .from(userTagsTable)
      .where(eq(userTagsTable.userId, candidate.id));

    const candidateTagIds = candidateTags.map((t) => t.tagId);
    const sharedTags = candidateTagIds.filter((tagId) => userTagIds.includes(tagId));

    // Even if no shared tags, still consider them if we don't have enough matches
    if (sharedTags.length > 0 || tagMatched.length < 10) {
      tagMatched.push({ user: candidate, sharedTags });
    }
  }

  console.log(`${tagMatched.length} candidates after tag filtering`);
  
  // If we have no candidates at this point, return empty results
  if (tagMatched.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        pageSize,
        hasMore: false,
        totalCount: 0
      }
    };
  }

  // Get similarity scores
  const similarityMatches = await getEmbeddingSimilarityMatches(
    userId,
    tagMatched.map((c) => c.user.id)
  );

  console.log(`Got ${similarityMatches.length} similarity scores`);

  // Match up the data
  const final = tagMatched.map(candidateData => {
    const similarityMatch = similarityMatches.find(m => m.userId === candidateData.user.id);
    return {
      user: candidateData.user,
      sharedTags: candidateData.sharedTags,
      similarity: similarityMatch?.similarity || 0
    };
  });

  // Score candidates
  const scoredCandidates = final.map(({ user: candidate, sharedTags, similarity }) => {
    let dist = 0;
    
    // Calculate distance if coordinates available
    if (
      user.latitude != null &&
      user.longitude != null &&
      candidate.latitude != null &&
      candidate.longitude != null
    ) {
      dist = haversineDistance(
        user.latitude,
        user.longitude,
        candidate.latitude,
        candidate.longitude
      );
    }

    const score = scoreCandidate(sharedTags.length, similarity, dist);

    return { 
      user: candidate, 
      sharedTags, 
      similarity, 
      proximityKm: dist, 
      score 
    };
  });

  // Sort by score
  const rankedCandidates = scoredCandidates.sort((a, b) => b.score - a.score);
  
  // Total count of candidates
  const totalCount = rankedCandidates.length;
  
  // Paginate the results
  const startIndex = (page - 1) * pageSize;
  const paginatedResults = rankedCandidates.slice(startIndex, startIndex + pageSize);
  
  // Check if there are more results available
  const hasMore = startIndex + pageSize < totalCount;

  return {
    data: paginatedResults,
    pagination: {
      page,
      pageSize,
      hasMore,
      totalCount
    }
  };
}