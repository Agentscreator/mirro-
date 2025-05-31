// app/api/stream/channel/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { StreamChat } from "stream-chat"
import { db } from "@/src/db" // Adjust import path as needed
import { usersTable } from "@/src/db/schema" // Adjust import path as needed
import { eq } from "drizzle-orm"
import crypto from "crypto"

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
)

function createChannelId(userId1: string, userId2: string): string {
  // Sort IDs to ensure consistency regardless of order
  const sortedIds = [userId1, userId2].sort()
  const combined = sortedIds.join('_')
  
  // If the combined string is short enough, use it directly
  if (combined.length <= 60) { // Leave room for 'dm_' prefix
    return `dm_${combined}`
  }
  
  // Otherwise, create a hash to ensure it's under 64 characters
  const hash = crypto.createHash('md5').update(combined).digest('hex')
  return `dm_${hash}` // This will be exactly 35 characters (dm_ + 32 char hash)
}

// Helper function to get user data from database
async function getUserFromDatabase(userId: string) {
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
      .where(eq(usersTable.id, userId))
      .limit(1)

    return users[0] || null
  } catch (error) {
    console.error(`Error fetching user ${userId} from database:`, error)
    return null
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
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 })
    }

    const currentUserId = session.user.id
    
    // Create deterministic channel ID that's guaranteed to be under 64 characters
    const channelId = createChannelId(currentUserId, recipientId)
    
    console.log(`Creating channel with ID: ${channelId} (length: ${channelId.length})`)

    try {
      // Fetch user data from database
      const [currentUserData, recipientUserData] = await Promise.all([
        getUserFromDatabase(currentUserId),
        getUserFromDatabase(recipientId)
      ])

      // Prepare user data for Stream Chat
      const currentUserStreamData = {
        id: currentUserId,
        name: currentUserData?.username || currentUserData?.nickname || session.user.name || `User_${currentUserId.slice(-8)}`,
        username: currentUserData?.username || `User_${currentUserId.slice(-8)}`,
        image: currentUserData?.profileImage || currentUserData?.image || session.user.image || undefined,
      }

      const recipientUserStreamData = {
        id: recipientId,
        name: recipientUserData?.username || recipientUserData?.nickname || `User_${recipientId.slice(-8)}`,
        username: recipientUserData?.username || `User_${recipientId.slice(-8)}`,
        image: recipientUserData?.profileImage || recipientUserData?.image || undefined,
      }

      // Ensure both users exist in Stream Chat with proper usernames
      await Promise.all([
        serverClient.upsertUser(currentUserStreamData),
        serverClient.upsertUser(recipientUserStreamData)
      ])

      // Create or get existing channel
      const channel = serverClient.channel('messaging', channelId, {
        members: [currentUserId, recipientId],
        created_by_id: currentUserId,
      })

      // Create the channel if it doesn't exist
      await channel.create()

      return NextResponse.json({ 
        channelId,
        success: true 
      })
    } catch (streamError: any) {
      console.error("Stream error:", streamError)
      
      // Handle Stream Chat specific errors
      if (streamError.code === 4 && streamError.message?.includes('already exists')) {
        // Channel already exists, that's fine
        return NextResponse.json({ 
          channelId,
          success: true,
          message: "Channel already exists"
        })
      }
      
      // Re-throw other Stream errors
      throw streamError
    }
  } catch (error: any) {
    console.error("Channel creation error:", error)
    return NextResponse.json({ 
      error: "Failed to create channel",
      details: error.message || "Unknown error",
      success: false
    }, { status: 500 })
  }
}
