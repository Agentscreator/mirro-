// Custom Stream event types to avoid conflicts with DOM Event
import type { Event as StreamEvent } from "stream-chat"

// Define our custom event data interfaces without extending StreamEvent
export interface CallInitiatedEventData {
  call_initiated: boolean
  call_type: "audio" | "video"
  target_user: string
  user: {
    id: string
    name?: string
    image?: string
  }
}

export interface CallEndedEventData {
  call_ended: boolean
  call_id: string
  duration?: number
  ended_by: string
}

// Type guard functions that work with any object
export function isCallInitiatedEvent(event: any): event is StreamEvent & CallInitiatedEventData {
  return event && typeof event === "object" && event.call_initiated === true
}

export function isCallEndedEvent(event: any): event is StreamEvent & CallEndedEventData {
  return event && typeof event === "object" && event.call_ended === true
}

// Helper function to check if an event has user data
export function hasUserData(event: any): event is { user: { id: string; name?: string; image?: string } } {
  return event && event.user && typeof event.user.id === "string"
}
