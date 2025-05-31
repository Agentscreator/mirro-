// Enhanced custom types for Stream Chat extensions
export interface CustomChannelData {
  pinned?: boolean
  pinned_at?: string
  pinned_by?: string
  archived?: boolean
  archived_at?: string
  name?: string
  image?: string
  [key: string]: any // Allow additional custom properties
}

export interface CallEvent {
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

// Type assertion helper for channel data
export const getChannelCustomData = (channel: any): CustomChannelData => {
  return (channel.data || {}) as CustomChannelData
}

// Helper to safely update channel with custom data
export const updateChannelWithCustomData = async (channel: any, customData: Partial<CustomChannelData>) => {
  try {
    await channel.update(customData as any)
  } catch (error) {
    console.error("Error updating channel:", error)
    throw error
  }
}
