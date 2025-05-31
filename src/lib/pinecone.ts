import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  // ❌ remove `environment` — it's no longer valid in v2
});

export { pinecone };

