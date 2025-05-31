// app/api/conversations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { StreamChat } from "stream-chat"
import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema"
import { eq, inArray } from "drizzle-orm"

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all channels where the current user is a member
    const channelsResponse = await serverClient.queryChannels({
      type: "messaging",
      members: { $in: [userId] },
    }, {
      created_at: -1, // Sort by most recent
    }, {
      limit: 50,
      watch: false,
      state: true,
    })

    if (!channelsResponse || channelsResponse.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Extract other user IDs from channels
    const otherUserIds = new Set<string>()
    const channelData = channelsResponse.map(channel => {
      // Find the other user in this DM channel
      const otherUserId = Object.keys(channel.state.members).find(id => id !== userId)
      if (otherUserId) {
        otherUserIds.add(otherUserId)
      }
      
      // Get unread count safely
      let unreadCount = 0
      try {
        // countUnread expects a Date object or no parameter
        const unreadResult = channel.countUnread()
        unreadCount = typeof unreadResult === 'number' ? unreadResult : (unreadResult as any)?.unread_count || 0
      } catch (error) {
        console.warn('Error getting unread count:', error)
        unreadCount = 0
      }
      
      return {
        channelId: channel.id,
        otherUserId,
        lastMessage: channel.state.messages.length > 0 
          ? channel.state.messages[channel.state.messages.length - 1]
          : null,
        unreadCount,
        updatedAt: channel.state.last_message_at || channel.data?.created_at || new Date().toISOString(),
      }
    }).filter(item => item.otherUserId) // Only include channels with valid other users

    // Fetch user data from database for all other users
    const userIds = Array.from(otherUserIds)
    const users = userIds.length > 0 
      ? await db.select({
          id: usersTable.id,
          username: usersTable.username,
          nickname: usersTable.nickname,
          image: usersTable.image,
          profileImage: usersTable.profileImage,
        }).from(usersTable)
        .where(inArray(usersTable.id, userIds))
      : []

    // Create a map for quick user lookup
    const userMap = new Map(users.map(user => [user.id, user]))

    // Build conversations array
    const conversations = channelData
      .map(channel => {
        const otherUser = userMap.get(channel.otherUserId!)
        if (!otherUser) return null

        return {
          id: channel.channelId,
          otherUser: {
            id: otherUser.id,
            username: otherUser.username,
            nickname: otherUser.nickname,
            image: otherUser.image || otherUser.profileImage,
          },
          lastMessage: channel.lastMessage ? {
            text: channel.lastMessage.text || "",
            timestamp: channel.lastMessage.created_at,
            senderId: channel.lastMessage.user?.id,
          } : undefined,
          unreadCount: channel.unreadCount,
          updatedAt: channel.updatedAt,
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => {
        // Sort by most recent activity
        const aTime = new Date(a!.updatedAt).getTime()
        const bTime = new Date(b!.updatedAt).getTime()
        return bTime - aTime
      })

    return NextResponse.json({ conversations })

  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId } = await request.json()

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      )
    }

    // Verify recipient exists
    const recipient = await db.select({
      id: usersTable.id,
      username: usersTable.username,
    }).from(usersTable)
    .where(eq(usersTable.id, recipientId))
    .limit(1)

    if (recipient.length === 0) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      )
    }

    const userId = session.user.id

    // Create consistent channel ID (same logic as your channel creation)
    const channelId = [userId, recipientId].sort().join("_")
    const channelIdWithPrefix = `dm_${channelId}`

    // Create or get the channel
    const channel = serverClient.channel("messaging", channelIdWithPrefix, {
      members: [userId, recipientId],
      created_by_id: userId,
    })

    await channel.create()

    return NextResponse.json({
      success: true,
      channelId: channelIdWithPrefix,
      recipientId,
    })

  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}