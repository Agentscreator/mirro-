import { db } from "../src/db";
import { usersTable, userTagsTable, thoughtsTable } from "../src/db/schema";
import { eq, and, ne, lte, gte, isNotNull } from "drizzle-orm";
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
    const parsed = JSON.parse(str);
    // Validate it's an array of numbers
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(n => typeof n === 'number')) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn("Failed to parse embedding:", error);
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
    console.log("Failed to parse embedding or empty embedding");
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
  // Return early if no candidates to check
  if (!candidateIds.length) {
    console.log("No candidate IDs provided for similarity matching");
    return [];
  }

  // Get current user's thoughts
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
    // Call Pinecone with valid parameters
    console.log(`Querying for similarity among ${candidateIds.length} candidates`);
    const matchesRaw = await querySimilarUsers(
      currentUserEmbedding,
      candidateIds,
      Math.min(candidateIds.length, 100) // Ensure we don't request more than we have
    );

    console.log(`Received ${matchesRaw.length} similarity matches from Pinecone`);
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
  // Skip calculation if any coordinate is missing
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return Infinity;
  }
  
  const R = 6371; // Earth radius in km
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

  // Normalize proximity score (closer is better)
  const proximityScore = proximityKm === Infinity ? 0 : 
                         proximityKm === 0 ? 1 : 
                         1 / (1 + proximityKm/100); // Gradually decreases with distance

  return (
    tagWeight * Math.min(sharedTagsCount, 5) / 5 + // Normalize to max of 5 shared tags
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
  
  // Validate inputs
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(20, pageSize)); // Limit page size
  
  // Get the user
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

  // If we have no candidates at this point, return empty results
  if (proximityFiltered.length === 0) {
    return {
      data: [],
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: 0
      }
    };
  }

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
    if (sharedTags.length > 0 || tagMatched.length < 20) {
      tagMatched.push({ user: candidate, sharedTags });
    }
  }

  console.log(`${tagMatched.length} candidates after tag filtering`);
  
  // If we have no candidates at this point, return empty results
  if (tagMatched.length === 0) {
    return {
      data: [],
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: 0
      }
    };
  }

  // Get similarity scores
  const candidateIds = tagMatched.map((c) => c.user.id);
  console.log(`Getting similarity scores for ${candidateIds.length} candidates`);
  
  const similarityMatches = await getEmbeddingSimilarityMatches(
    userId,
    candidateIds
  );

  console.log(`Got ${similarityMatches.length} similarity scores`);

  // Match up the data and calculate scores
  const scoredCandidates = tagMatched.map(({ user: candidate, sharedTags }) => {
    const similarityMatch = similarityMatches.find(m => m.userId === candidate.id) || { similarity: 0 };
    
    // Calculate distance if coordinates available
    let dist = Infinity;
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

    const score = scoreCandidate(sharedTags.length, similarityMatch.similarity, dist);

    return { 
      user: candidate, 
      sharedTags, 
      similarity: similarityMatch.similarity, 
      proximityKm: dist, 
      score 
    };
  });

  // Sort by score in descending order
  const rankedCandidates = scoredCandidates.sort((a, b) => b.score - a.score);
  
  // Total count of candidates
  const totalCount = rankedCandidates.length;
  
  // Paginate the results
  const startIndex = (safePage - 1) * safePageSize;
  const paginatedResults = rankedCandidates.slice(startIndex, startIndex + safePageSize);
  
  // Check if there are more results available
  const hasMore = startIndex + safePageSize < totalCount;

  return {
    data: paginatedResults,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      hasMore,
      totalCount
    }
  };
}

// Run manually for testing
if (require.main === module) {
  // Use a test user ID or get from command line args
  const testUserId = process.argv[2] || "149c09b6-7690-4265-9459-8d9fe2fd92b4";
  
  // Test first page
  getCandidateUsers(testUserId, 1, 2)
    .then((results) => {
      console.log(`✅ Found ${results.pagination.totalCount || 0} candidates total`);
      console.log(`Page ${results.pagination.page} of size ${results.pagination.pageSize}`);
      console.log(`Has more: ${results.pagination.hasMore}`);
      
      for (const { user, sharedTags, similarity, proximityKm, score } of results.data) {
        console.log(
          `- ${user.username || user.id} | tags: [${sharedTags.join(", ")}] | similarity: ${similarity.toFixed(
            3
          )} | proximity: ${proximityKm === Infinity ? "Unknown" : proximityKm.toFixed(2) + " km"} | score: ${score.toFixed(3)}`
        );
      }
      
      // Test second page if we have more results
      if (results.pagination.hasMore) {
        return getCandidateUsers(testUserId, 2, 2);
      }
    })
    .then(results => {
      if (results) {
        console.log(`\nPage ${results.pagination.page} of size ${results.pagination.pageSize}`);
        console.log(`Has more: ${results.pagination.hasMore}`);
        
        for (const { user, sharedTags, similarity, proximityKm, score } of results.data) {
          console.log(
            `- ${user.username || user.id} | tags: [${sharedTags.join(", ")}] | similarity: ${similarity.toFixed(
              3
            )} | proximity: ${proximityKm === Infinity ? "Unknown" : proximityKm.toFixed(2) + " km"} | score: ${score.toFixed(3)}`
          );
        }
      }
    })
    .catch(error => {
      console.error("Error running candidate matching:", error);
      process.exit(1);
    });
}