// src/lib/stream-server.ts (Stream Chat integration)
import { StreamChat } from 'stream-chat';

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY
);

export async function createDirectChannel(userId1: string, userId2: string) {
  try {
    // Sort user IDs to ensure consistent channel naming
    const members = [userId1, userId2].sort();
    const channelId = `${members.join('-')}`;
    
    const channel = serverClient.channel('messaging', channelId, {
      members,
      created_by_id: userId1,
    });
    
    await channel.create();
    
    return {
      id: channelId,
      type: 'messaging'
    };
  } catch (error) {
    console.error('Error creating Stream channel:', error);
    throw error;
  }
}
