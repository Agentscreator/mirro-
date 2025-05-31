// src/lib/stream.ts
import { StreamChat } from 'stream-chat';

// Create a singleton instance
let clientInstance: StreamChat | null = null;

export const getStreamClient = () => {
  if (!clientInstance) {
    clientInstance = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!
    );
  }
  return clientInstance;
};

// For backward compatibility - use a different name to avoid redeclaration
export const streamClient = getStreamClient();

// Alternative approach: Create a class-based singleton
export class StreamClientManager {
  private static instance: StreamChat | null = null;

  static getInstance(): StreamChat {
    if (!StreamClientManager.instance) {
      StreamClientManager.instance = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!
      );
    }
    return StreamClientManager.instance;
  }

  static reset() {
    StreamClientManager.instance = null;
  }
}