import { db } from "./index";
import { thoughtsTable, usersTable } from "./schema";
import { eq } from "drizzle-orm";

// Generate a fake embedding (e.g. 1536-d vector with float values)
function generateFakeEmbedding(length = 1536): number[] {
  return Array.from({ length }, () => Math.random());
}

const sampleThoughts = [
  "I'm feeling hopeful about starting a new chapter in life.",
  "Looking to connect with others who share my love for science.",
  "Recently moved to a new city and seeking a sense of belonging.",
];

async function seedThoughts() {
  const users = await db.select().from(usersTable);
  const thoughts = [];

  for (const user of users) {
    for (const content of sampleThoughts) {
      thoughts.push({
        userId: user.id,
        content,
        embedding: JSON.stringify(generateFakeEmbedding()), // realistic placeholder
      });
    }
  }

  await db.insert(thoughtsTable).values(thoughts);
  console.log("✅ Thoughts seed complete");
}

seedThoughts().catch((err) => {
  console.error("❌ Seed failed:", err);
});
