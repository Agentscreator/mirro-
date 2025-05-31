import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { followersTable, usersTable } from "@/src/db/schema"
import { eq, and, count } from "drizzle-orm"

// POST - Follow a user
export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    console.log("Following user...")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: followingId } = await context.params
    const followerId = session.user.id

    console.log("Following ID:", followingId)
    console.log("Follower ID:", followerId)

    // Can't follow yourself
    if (followingId === followerId) {
      console.error("Cannot follow yourself")
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(followingId)) {
      console.error("Invalid user ID format:", followingId)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Check if user to follow exists
    const userToFollow = await db.select().from(usersTable).where(eq(usersTable.id, followingId)).limit(1)

    if (userToFollow.length === 0) {
      console.error("User to follow not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already following
    const existingFollow = await db
      .select()
      .from(followersTable)
      .where(and(eq(followersTable.followerId, followerId), eq(followersTable.followingId, followingId)))
      .limit(1)

    if (existingFollow.length > 0) {
      console.error("Already following this user")
      return NextResponse.json({ error: "Already following this user" }, { status: 400 })
    }

    console.log("Creating follow relationship...")
    await db.insert(followersTable).values({
      followerId,
      followingId,
    })

    // Get updated follower count
    const followerCountResult = await db
      .select({ count: count() })
      .from(followersTable)
      .where(eq(followersTable.followingId, followingId))

    const followerCount = followerCountResult[0]?.count || 0
    console.log("Updated follower count:", followerCount)

    console.log("Follow relationship created successfully")

    return NextResponse.json({
      message: "User followed successfully",
      followerCount,
    })
  } catch (error) {
    console.error("Follow user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    console.log("Unfollowing user...")
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

    if (existingFollow.length === 0) {
      console.error("Not following this user")
      return NextResponse.json({ error: "Not following this user" }, { status: 400 })
    }

    console.log("Removing follow relationship...")
    await db
      .delete(followersTable)
      .where(and(eq(followersTable.followerId, followerId), eq(followersTable.followingId, followingId)))

    // Get updated follower count
    const followerCountResult = await db
      .select({ count: count() })
      .from(followersTable)
      .where(eq(followersTable.followingId, followingId))

    const followerCount = followerCountResult[0]?.count || 0
    console.log("Updated follower count:", followerCount)

    console.log("Follow relationship removed successfully")

    return NextResponse.json({
      message: "User unfollowed successfully",
      followerCount,
    })
  } catch (error) {
    console.error("Unfollow user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
