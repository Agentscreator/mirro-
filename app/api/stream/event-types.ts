// This file defines custom event types for Stream Chat 
import type { StreamChat, Event, Channel } from "stream-chat"

// Define custom event data interfaces
export interface CustomEventData {
  type: string
  [key: string]: any
}

export interface CallInitiatedEventData extends CustomEventData {
  type: 'call.initiated'
  call_id: string
  caller_id: string
  channel_id: string
}

export interface CallAcceptedEventData extends CustomEventData {
  type: 'call.accepted'
  call_id: string
  user_id: string
}

export interface CallRejectedEventData extends CustomEventData {
  type: 'call.rejected'
  call_id: string
  user_id: string
  reason?: string
}

export interface CallEndedEventData extends CustomEventData {
  type: 'call.ended'
  call_id: string
  ended_by: string
  duration?: number
}

// Union type for all custom event data
export type CustomEventDataTypes = 
  | CallInitiatedEventData 
  | CallAcceptedEventData 
  | CallRejectedEventData 
  | CallEndedEventData

// Type guard to check if an event is a custom call event
function isCustomCallEvent(event: any): event is CustomEventDataTypes {
  return event && typeof event.type === 'string' && event.type.startsWith('call.')
}

// Setup custom event listeners
export function setupCustomEventListeners(client: StreamChat) {
  // Listen for all events and filter for custom ones
  client.on((event: any) => {
    // Handle custom call events by checking the type as a string
    if (isCustomCallEvent(event)) {
      switch (event.type) {
        case 'call.initiated':
          console.log('Call initiated:', event)
          handleCallInitiated(event)
          break
        case 'call.accepted':
          console.log('Call accepted:', event)
          handleCallAccepted(event)
          break
        case 'call.rejected':
          console.log('Call rejected:', event)
          handleCallRejected(event)
          break
        case 'call.ended':
          console.log('Call ended:', event)
          handleCallEnded(event)
          break
      }
    }
  })

  return client
}

// Event handler functions
function handleCallInitiated(event: CallInitiatedEventData) {
  const { call_id, caller_id, channel_id } = event
  console.log(`Call ${call_id} initiated by ${caller_id} in channel ${channel_id}`)
  // Add your call initiation logic here
}

function handleCallAccepted(event: CallAcceptedEventData) {
  const { call_id, user_id } = event
  console.log(`Call ${call_id} accepted by ${user_id}`)
  // Add your call acceptance logic here
}

function handleCallRejected(event: CallRejectedEventData) {
  const { call_id, user_id, reason } = event
  console.log(`Call ${call_id} rejected by ${user_id}`, reason ? `Reason: ${reason}` : '')
  // Add your call rejection logic here
}

function handleCallEnded(event: CallEndedEventData) {
  const { call_id, ended_by, duration } = event
  console.log(`Call ${call_id} ended by ${ended_by}`, duration ? `Duration: ${duration}s` : '')
  // Add your call end logic here
}

// Helper function to send custom events to a channel
export async function sendCustomEvent(
  client: StreamChat,
  channelType: string,
  channelId: string,
  eventData: CustomEventDataTypes
) {
  try {
    const channel = client.channel(channelType, channelId)
    
    // Cast to any to bypass TypeScript's Event type restriction
    // Stream Chat allows custom events, but TypeScript doesn't know about them
    await channel.sendEvent(eventData as any)
    
    console.log(`Custom event ${eventData.type} sent successfully`)
  } catch (error) {
    console.error('Error sending custom event:', error)
    throw error
  }
}

// Specific helper functions for call events
export async function initiateCall(
  client: StreamChat,
  channelType: string,
  channelId: string,
  callId: string,
  callerId: string
) {
  const eventData: CallInitiatedEventData = {
    type: 'call.initiated',
    call_id: callId,
    caller_id: callerId,
    channel_id: channelId
  }
  
  await sendCustomEvent(client, channelType, channelId, eventData)
}

export async function acceptCall(
  client: StreamChat,
  channelType: string,
  channelId: string,
  callId: string,
  userId: string
) {
  const eventData: CallAcceptedEventData = {
    type: 'call.accepted',
    call_id: callId,
    user_id: userId
  }
  
  await sendCustomEvent(client, channelType, channelId, eventData)
}

export async function rejectCall(
  client: StreamChat,
  channelType: string,
  channelId: string,
  callId: string,
  userId: string,
  reason?: string
) {
  const eventData: CallRejectedEventData = {
    type: 'call.rejected',
    call_id: callId,
    user_id: userId,
    ...(reason && { reason })
  }
  
  await sendCustomEvent(client, channelType, channelId, eventData)
}

export async function endCall(
  client: StreamChat,
  channelType: string,
  channelId: string,
  callId: string,
  endedBy: string,
  duration?: number
) {
  const eventData: CallEndedEventData = {
    type: 'call.ended',
    call_id: callId,
    ended_by: endedBy,
    ...(duration && { duration })
  }
  
  await sendCustomEvent(client, channelType, channelId, eventData)
}

// Alternative approach: Listen for specific events on specific channels
export function setupChannelEventListeners(
  client: StreamChat,
  channelType: string,
  channelId: string
) {
  const channel = client.channel(channelType, channelId)
  
  // Watch the channel to receive events
  channel.watch()
  
  // Listen for all events on this specific channel
  channel.on('*' as any, (event: any) => {
    // Filter for custom call events
    if (isCustomCallEvent(event)) {
      console.log('Channel call event:', event)
      
      switch (event.type) {
        case 'call.initiated':
          handleCallInitiated(event)
          break
        case 'call.accepted':
          handleCallAccepted(event)
          break
        case 'call.rejected':
          handleCallRejected(event)
          break
        case 'call.ended':
          handleCallEnded(event)
          break
      }
    }
  })
  
  return channel
}

// Advanced: Type-safe event listener setup with proper typing
export function setupTypedCustomEventListeners<T extends Record<string, any>>(
  client: StreamChat,
  handlers: {
    'call.initiated'?: (event: CallInitiatedEventData) => void
    'call.accepted'?: (event: CallAcceptedEventData) => void
    'call.rejected'?: (event: CallRejectedEventData) => void
    'call.ended'?: (event: CallEndedEventData) => void
  }
) {
  client.on((event: any) => {
    if (isCustomCallEvent(event)) {
      const handler = handlers[event.type as keyof typeof handlers]
      if (handler) {
        handler(event as any)
      }
    }
  })

  return client
}

// Usage example for the typed event listeners:
/*
setupTypedCustomEventListeners(client, {
  'call.initiated': (event) => {
    // event is properly typed as CallInitiatedEventData
    console.log('Call initiated by:', event.caller_id)
  },
  'call.accepted': (event) => {
    // event is properly typed as CallAcceptedEventData
    console.log('Call accepted by:', event.user_id)
  }
})
*/