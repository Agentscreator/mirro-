import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { followersTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"

// GET - Check if current user is following the specified user
export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    console.log("Checking follow status...")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: followingId } = await context.params
    const followerId = session.user.id

    console.log("Following ID:", followingId)
    console.log("Follower ID:", followerId)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(followingId)) {
      console.error("Invalid user ID format:", followingId)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Check if follow relationship exists
    const existingFollow = await db
      .select()
      .from(followersTable)
      .where(and(eq(followersTable.followerId, followerId), eq(followersTable.followingId, followingId)))
      .limit(1)

    const isFollowing = existingFollow.length > 0
    console.log("Is following:", isFollowing)

    return NextResponse.json({ isFollowing })
  } catch (error) {
    console.error("Check follow status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
