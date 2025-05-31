import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { profileVisitorsTable, usersTable } from "@/src/db/schema"
import { eq, and, count } from "drizzle-orm"

// POST - Record a profile visit
export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    console.log("Recording profile visit...")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: profileUserId } = await context.params
    const visitorUserId = session.user.id

    console.log("Profile user ID:", profileUserId)
    console.log("Visitor user ID:", visitorUserId)

    // Don't record visits to own profile
    if (profileUserId === visitorUserId) {
      console.log("User visiting own profile, not recording")
      return NextResponse.json({ message: "Own profile visit not recorded" })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(profileUserId)) {
      console.error("Invalid user ID format:", profileUserId)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Check if profile user exists
    const profileUser = await db.select().from(usersTable).where(eq(usersTable.id, profileUserId)).limit(1)

    if (profileUser.length === 0) {
      console.error("Profile user not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if visit already recorded today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingVisit = await db
      .select()
      .from(profileVisitorsTable)
      .where(
        and(
          eq(profileVisitorsTable.profileId, profileUserId),
          eq(profileVisitorsTable.visitorId, visitorUserId),
          // Only check for visits today to avoid duplicate counting
        ),
      )
      .limit(1)

    if (existingVisit.length === 0) {
      console.log("Recording new visit...")
      await db.insert(profileVisitorsTable).values({
        profileId: profileUserId,
        visitorId: visitorUserId,
      })
      console.log("Visit recorded successfully")
    } else {
      console.log("Visit already recorded")
    }

    // Get updated visit count
    const visitCountResult = await db
      .select({ count: count() })
      .from(profileVisitorsTable)
      .where(eq(profileVisitorsTable.profileId, profileUserId))

    const visitCount = visitCountResult[0]?.count || 0
    console.log("Updated visit count:", visitCount)

    return NextResponse.json({
      message: "Visit recorded",
      visitCount,
    })
  } catch (error) {
    console.error("Record visit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get profile visit count
export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    console.log("Getting profile visit count...")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: profileUserId } = await context.params
    console.log("Profile user ID:", profileUserId)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(profileUserId)) {
      console.error("Invalid user ID format:", profileUserId)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Get visit count
    const visitCountResult = await db
      .select({ count: count() })
      .from(profileVisitorsTable)
      .where(eq(profileVisitorsTable.profileId, profileUserId))

    const visitCount = visitCountResult[0]?.count || 0
    console.log("Visit count:", visitCount)

    return NextResponse.json({ visitCount })
  } catch (error) {
    console.error("Get visit count error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
