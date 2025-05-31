//app/api/users/profile/[userId]/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable, userTagsTable, tagsTable, followersTable, profileVisitorsTable } from "@/src/db/schema"
import { eq, count } from "drizzle-orm"

// GET - Fetch user profile with counts
export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    console.log("=== PROFILE API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeTags = searchParams.get("includeTags") === "true"

    // Await the params promise
    const params = await context.params
    const userId = params.userId

    console.log("Fetching profile for user ID:", userId)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Clean the userId in case it has query parameters attached
    const cleanUserId = userId.split("?")[0]

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(cleanUserId)) {
      console.error("Invalid user ID format:", cleanUserId)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Get user basic info
    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        image: usersTable.image,
        profileImage: usersTable.profileImage,
        about: usersTable.about,
        metro_area: usersTable.metro_area,
        created_at: usersTable.created_at,
      })
      .from(usersTable)
      .where(eq(usersTable.id, cleanUserId))
      .limit(1)

    if (user.length === 0) {
      console.error("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User found:", { id: user[0].id, username: user[0].username })

    // Fetch counts in parallel
    const [followersCountResult, followingCountResult, visitorsCountResult] = await Promise.all([
      // Count followers (people who follow this user)
      db
        .select({ count: count() })
        .from(followersTable)
        .where(eq(followersTable.followingId, cleanUserId)),
      // Count following (people this user follows)
      db
        .select({ count: count() })
        .from(followersTable)
        .where(eq(followersTable.followerId, cleanUserId)),
      // Count visitors
      db
        .select({ count: count() })
        .from(profileVisitorsTable)
        .where(eq(profileVisitorsTable.profileId, cleanUserId)),
    ])

    const followersCount = followersCountResult[0]?.count || 0
    const followingCount = followingCountResult[0]?.count || 0
    const visitorsCount = visitorsCountResult[0]?.count || 0

    console.log("Counts fetched:", {
      followers: followersCount,
      following: followingCount,
      visitors: visitorsCount,
    })

    // Add counts to user object
    const userWithCounts = {
      ...user[0],
      followers: followersCount,
      following: followingCount,
      visitors: visitorsCount,
    }

    const response: any = {
      user: userWithCounts,
      success: true,
    }

    // Optionally include tags if requested
    if (includeTags) {
      console.log("Including tags in response")
      const userTags = await db
        .select({
          tagId: userTagsTable.tagId,
          tagName: tagsTable.name,
          tagCategory: tagsTable.category,
        })
        .from(userTagsTable)
        .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
        .where(eq(userTagsTable.userId, cleanUserId))

      response.tags = userTags
      console.log("Tags included:", userTags.length)
    }

    console.log("✅ Profile fetched successfully with counts")
    console.log("=== PROFILE API DEBUG END ===")

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
