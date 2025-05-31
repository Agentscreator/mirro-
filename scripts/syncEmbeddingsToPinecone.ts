import { db } from "../src/db";
import { thoughtsTable } from "../src/db/schema";
import { upsertVectorEmbedding } from "../src/lib/vectorStore";
import { desc, isNotNull } from "drizzle-orm";

// Parse embedding string to number array
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

// Get most recent thought with valid embedding for each user
async function getLatestThoughtsWithEmbeddings() {
  // Get all thoughts with embeddings
  const thoughts = await db
    .select()
    .from(thoughtsTable)
    .where(isNotNull(thoughtsTable.embedding))
    .orderBy(desc(thoughtsTable.createdAt));

  console.log(`Retrieved ${thoughts.length} thoughts with embeddings`);

  // Map of userId to their latest thought with valid embedding
  const userLatestThoughts = new Map();

  for (const thought of thoughts) {
    // Skip if we already have a more recent thought for this user
    if (userLatestThoughts.has(thought.userId)) continue;
    
    // Verify embedding is valid
    const embedding = parseEmbedding(thought.embedding);
    if (embedding) {
      userLatestThoughts.set(thought.userId, {
        thoughtId: thought.id,
        userId: thought.userId,
        embedding
      });
    }
  }

  return Array.from(userLatestThoughts.values());
}

// Main function to sync embeddings to Pinecone
async function syncEmbeddingsToPinecone() {
  try {
    // Get latest thoughts with valid embeddings
    const latestThoughts = await getLatestThoughtsWithEmbeddings();
    
    console.log(`Found ${latestThoughts.length} users with valid embeddings`);
    
    if (latestThoughts.length === 0) {
      console.log("No valid embeddings found to sync to Pinecone");
      return;
    }
    
    // Process each embedding
    for (const { userId, thoughtId, embedding } of latestThoughts) {
      try {
        // Check if embedding is valid
        if (!embedding || embedding.length === 0) {
          console.log(`Skipping user ${userId}, no valid embedding`);
          continue;
        }
        
        // Debug info about embedding
        console.log(`Processing user ${userId} with embedding of length ${embedding.length}`);
        
        // Upsert to Pinecone
        await upsertVectorEmbedding({
          id: userId,  // Use the userId as the vector ID
          values: embedding,
          metadata: {
            userId,
            thoughtId
          }
        });
        
        console.log(`Successfully synced embedding for user ${userId}`);
        
      } catch (error) {
        console.error(`Error syncing embedding for user ${userId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in syncEmbeddingsToPinecone:", error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  syncEmbeddingsToPinecone()
    .then(() => {
      console.log("Embedding sync completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error syncing embeddings:", error);
      process.exit(1);
    });
}