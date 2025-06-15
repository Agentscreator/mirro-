import { DefaultMessageData } from 'stream-chat-react';

declare module 'stream-chat' {
  interface CustomMessageData extends DefaultMessageData {
    custom?: {
      is_call?: boolean;
      call_type?: string;
      target_user?: string;
    };
  }
} 