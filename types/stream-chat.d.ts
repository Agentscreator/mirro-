// Extend Stream Chat types to support custom events
import type { DefaultGenerics, Event } from "stream-chat"

// Extend the EventTypes to include our custom event types
declare module "stream-chat" {
  interface EventTypes {
    custom: "custom"
    call_initiated: "call.initiated"
    call_accepted: "call.accepted"
    call_rejected: "call.rejected"
    call_ended: "call.ended"
  }

  // Extend the Event interface to include our custom event properties
  interface Event<StreamChatGenerics extends DefaultGenerics = DefaultGenerics> {
    call_initiated?: boolean
    call_type?: "audio" | "video"
    target_user?: string
    call_id?: string
  }

  // Extend the ChannelData interface to include our custom properties
  interface ChannelData {
    archived?: boolean
    pinned?: boolean
    pinned_at?: string
    pinned_by?: string
    name?: string
    image?: string
    [key: string]: any
  }
}

// Export custom event types for use in components
export interface CustomCallEvent extends Event {
  type: "custom"
  call_initiated?: boolean
  call_type?: "audio" | "video"
  target_user?: string
  user?: {
    id: string
    name?: string
    image?: string
  }
}
