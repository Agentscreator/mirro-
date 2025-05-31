import { PineconeClient } from "@pinecone-database/pinecone";

async function patchMetadataConfig() {
  const client = new PineconeClient();

  await client.init({
    apiKey: "pcsk_WLe3Z_NTssDXJiHUdLjw7c65gemD545fPA93VfJvPWNSNg5hkWUza9rsm4sx1C24yUPZ6",
    environment: "us-east-1-aws", // your environment string, usually region-cloud combo
  });

  const index = client.Index("mirro-public");

  const response = await index._client._restController.patchDatabase({
    databaseName: "mirro-public",
    metadataConfig: {
      indexed: ["userId"],
    },
  });

  console.log("Patch response:", response);
}

patchMetadataConfig().catch(console.error);
