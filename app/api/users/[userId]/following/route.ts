import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { followersTable, usersTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

// GET - Get users that this user is following
export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    console.log("Fetching following...")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await context.params
    console.log("User ID:", userId)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.error("Invalid user ID format:", userId)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Check if user exists
    const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1)

    if (user.length === 0) {
      console.error("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get following (people this user follows)
    const following = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        profileImage: usersTable.profileImage,
        image: usersTable.image,
      })
      .from(followersTable)
      .leftJoin(usersTable, eq(followersTable.followingId, usersTable.id))
      .where(eq(followersTable.followerId, userId))

    console.log(`Fetched ${following.length} following for user ${userId}`)

    return NextResponse.json({ following })
  } catch (error) {
    console.error("Fetch following error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
