// scripts/updateThoughtEmbeddings.ts
import { db } from "../src/db/index"; // Drizzle client
import { thoughtsTable } from "../src/db/schema"; // Table schema
import { getEmbedding } from "../src/lib/generateEmbeddings"; // Embedding generator
import { eq } from "drizzle-orm";

async function updateEmbeddings() {
  const thoughts = await db.select().from(thoughtsTable);

  for (const thought of thoughts) {
    if (!thought.content) continue; // skip if content is missing

    try {
      const embedding = await getEmbedding(thought.content);
      const embeddingStr = JSON.stringify(embedding);

      await db
        .update(thoughtsTable)
        .set({ embedding: embeddingStr })
        .where(eq(thoughtsTable.id, thought.id));

      console.log(`🧠 Updated embedding for thought ${thought.id}`);
    } catch (error) {
      console.error(`❌ Failed to update thought ${thought.id}:`, error);
    }
  }

  console.log("✅ All embeddings updated");
}

updateEmbeddings().catch(console.error);
