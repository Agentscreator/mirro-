// app/api/stream/conversations/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { StreamChat } from "stream-chat"
import { db } from "@/src/db" // Adjust import path as needed
import { usersTable } from "@/src/db/schema" // Adjust import path as needed
import { eq, inArray } from "drizzle-orm"

// Create server client instance with error handling
let serverClient: StreamChat | null = null

const getServerClient = () => {
  if (!serverClient) {
    const apiKey = process.env.STREAM_API_KEY
    const secret = process.env.STREAM_SECRET_KEY

    if (!apiKey || !secret) {
      throw new Error("Stream API key or secret not configured")
    }

    serverClient = StreamChat.getInstance(apiKey, secret)
  }
  return serverClient
}

// Helper function to get multiple users from database
async function getUsersFromDatabase(userIds: string[]) {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
        image: usersTable.image
      })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds))

    // Convert to a map for easy lookup
    const userMap = new Map()
    users.forEach(user => {
      userMap.set(user.id, user)
    })
    
    return userMap
  } catch (error) {
    console.error("Error fetching users from database:", error)
    return new Map()
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = getServerClient()
    const userId = session.user.id

    // Query channels where the current user is a member
    const filter = {
      type: "messaging",
      members: { $in: [userId] }
    }

    const sort = [{ last_message_at: -1 as const }]
    const options = {
      state: true,
      watch: false,
      presence: false,
      limit: 50
    }

    const channels = await client.queryChannels(filter, sort, options)

    // Get all other user IDs from the conversations
    const otherUserIds = channels
      .map(channel => Object.keys(channel.state.members).find(id => id !== userId))
      .filter(Boolean) as string[]

    // Fetch user data from database
    const usersMap = await getUsersFromDatabase(otherUserIds)

    // Transform channels into conversation format
    const conversations = channels.map(channel => {
      // Get the other user in the conversation (assuming 1-on-1 chats)
      const otherUserId = Object.keys(channel.state.members).find(id => id !== userId)
      const otherUserFromStream = otherUserId ? channel.state.members[otherUserId]?.user : null
      const otherUserFromDb = otherUserId ? usersMap.get(otherUserId) : null

      // Get the last message
      const lastMessage = channel.state.messages.length > 0 
        ? channel.state.messages[channel.state.messages.length - 1]
        : null

      // Check if there are unread messages
      const unread = (channel.state.unreadCount || 0) > 0

      // Prioritize database data over Stream data for user info
      const displayUsername = otherUserFromDb?.username || 
                             otherUserFromDb?.nickname || 
                             otherUserFromStream?.username ||
                             otherUserFromStream?.name ||
                             `User_${otherUserId?.slice(-8)}` ||
                             "Unknown User"

      return {
        id: channel.id || channel.cid,
        user: {
          id: otherUserId || "unknown",
          username: displayUsername,
          nickname: otherUserFromDb?.nickname || otherUserFromStream?.name,
          image: otherUserFromDb?.profileImage || 
                 otherUserFromDb?.image || 
                 otherUserFromStream?.image
        },
        lastMessage: lastMessage?.text || undefined,
        timestamp: lastMessage?.created_at || channel.state.last_message_at,
        unread
      }
    })

    // Filter out conversations where we couldn't find the other user
    const validConversations = conversations.filter(conv => conv.user.id !== "unknown")

    return NextResponse.json({
      conversations: validConversations,
      total: validConversations.length
    })

  } catch (error) {
    console.error("Stream conversations API error:", error)

    let errorMessage = "Failed to fetch conversations"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "Chat service configuration error"
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "Authentication failed"
        statusCode = 401
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
