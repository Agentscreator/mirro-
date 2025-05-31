import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

// The index name where user embeddings are stored
const INDEX_NAME = process.env.PINECONE_INDEX || 'users';
const NAMESPACE = 'user-embeddings';

interface UpsertVectorParams {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

/**
 * Upserts a vector embedding to Pinecone
 */
export async function upsertVectorEmbedding(params: UpsertVectorParams) {
  try {
    const index = pinecone.index(INDEX_NAME);
    
    // Log steps for debugging
    console.log(`Upserting vector ${params.id} with ${params.values.length} dimensions`);
    
    // Check vector dimensions (Pinecone requires consistent dimensions)
    if (params.values.length < 1) {
      throw new Error(`Invalid vector dimension: ${params.values.length}`);
    }
    
    await index.namespace(NAMESPACE).upsert([
      {
        id: params.id,
        values: params.values,
        metadata: params.metadata || {},
      },
    ]);
    
    return true;
  } catch (error) {
    console.error('Error upserting vector:', error);
    throw error;
  }
}

/**
 * Queries similar users based on embedding vector
 */
export async function querySimilarUsers(
  embedding: number[],
  candidateIds: string[] = [],
  topK: number = 10
) {
  try {
    // Validate inputs to avoid PineconeArgumentError
    if (!embedding || embedding.length === 0) {
      console.error('Empty embedding vector provided');
      return [];
    }
    
    // Ensure topK is a valid positive integer
    const safeTopK = Math.max(1, Math.floor(topK));
    
    // Ensure we have candidates to query
    if (candidateIds.length === 0) {
      console.log('No candidate IDs provided, returning empty results');
      return [];
    }
    
    const index = pinecone.index(INDEX_NAME);
    
    // Build Pinecone query options
    const queryOptions: any = {
      vector: embedding,
      topK: safeTopK,
      includeMetadata: true,
    };
    
    // Add filter for specific users if provided
    if (candidateIds.length > 0) {
      queryOptions.filter = {
        id: { $in: candidateIds },
      };
    }
    
    // Execute query
    console.log(`Querying Pinecone for ${safeTopK} similar users from ${candidateIds.length} candidates`);
    const results = await index.namespace(NAMESPACE).query(queryOptions);
    
    // Return formatted results
    return (results.matches || []).map((match) => ({
      userId: match.id,
      similarity: match.score || 0,
      metadata: match.metadata,
    }));
  } catch (error) {
    console.error('Error querying similar users:', error);
    // Return empty results on error
    return [];
  }
}

/**
 * Deletes a vector from Pinecone
 */
export async function deleteVector(id: string) {
  try {
    const index = pinecone.index(INDEX_NAME);
    await index.namespace(NAMESPACE).deleteOne(id);
    return true;
  } catch (error) {
    console.error('Error deleting vector:', error);
    throw error;
  }
}