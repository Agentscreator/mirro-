//app/api/users/settings/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable, userTagsTable, tagsTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

// GET - Fetch user settings data
export async function GET() {
  try {
    console.log("=== SETTINGS GET API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching settings for user ID:", session.user.id)

    // Get user data with all settings fields (removed age)
    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        email: usersTable.email,
        metro_area: usersTable.metro_area,
        gender: usersTable.gender,
        genderPreference: usersTable.genderPreference,
        preferredAgeMin: usersTable.preferredAgeMin,
        preferredAgeMax: usersTable.preferredAgeMax,
        proximity: usersTable.proximity,
        image: usersTable.image,
        profileImage: usersTable.profileImage,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1)

    if (user.length === 0) {
      console.error("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User found:", { id: user[0].id, username: user[0].username })

    // Get user tags
    const userTags = await db
      .select({
        tagId: userTagsTable.tagId,
        tagName: tagsTable.name,
        tagCategory: tagsTable.category,
      })
      .from(userTagsTable)
      .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
      .where(eq(userTagsTable.userId, session.user.id))

    console.log("Tags found:", userTags.length)
    console.log("✅ Settings data fetched successfully")
    console.log("=== SETTINGS GET API DEBUG END ===")

    return NextResponse.json({
      success: true,
      user: user[0],
      tags: userTags,
    })
  } catch (error) {
    console.error("❌ Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    console.log("=== SETTINGS UPDATE API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Settings update request body:", body)

    const {
      nickname,
      gender,
      genderPreference,
      preferredAgeMin,
      preferredAgeMax,
      proximity,
      tagIds,
    } = body

    // Validate age range
    if (preferredAgeMin !== undefined && preferredAgeMax !== undefined) {
      if (preferredAgeMin < 13 || preferredAgeMax > 100 || preferredAgeMin >= preferredAgeMax) {
        return NextResponse.json({ error: "Invalid age range" }, { status: 400 })
      }
    }

    // Validate gender preference
    if (genderPreference !== undefined) {
      const validGenderPrefs = ['male', 'female', 'no-preference']
      if (!validGenderPrefs.includes(genderPreference)) {
        return NextResponse.json({ error: "Invalid gender preference" }, { status: 400 })
      }
    }

    // Validate proximity
    if (proximity !== undefined) {
      const validProximity = ['local', 'metro', 'countrywide', 'global']
      if (!validProximity.includes(proximity)) {
        return NextResponse.json({ error: "Invalid proximity setting" }, { status: 400 })
      }
    }

    // Build update object with only provided fields (removed age)
    const updateData: any = {
      updated_at: new Date(),
    }
    
    if (nickname !== undefined) updateData.nickname = nickname
    if (gender !== undefined) updateData.gender = gender
    if (genderPreference !== undefined) updateData.genderPreference = genderPreference
    if (preferredAgeMin !== undefined) updateData.preferredAgeMin = preferredAgeMin
    if (preferredAgeMax !== undefined) updateData.preferredAgeMax = preferredAgeMax
    if (proximity !== undefined) updateData.proximity = proximity

    console.log("Update data:", updateData)

    // Update user settings
    const updatedUser = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, session.user.id))
      .returning()

    if (updatedUser.length === 0) {
      console.error("User not found or update failed")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update tags if provided
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      console.log("Updating tags:", tagIds)
      
      // Delete existing tags
      await db
        .delete(userTagsTable)
        .where(eq(userTagsTable.userId, session.user.id))

      // Insert new tags
      if (tagIds.length > 0) {
        const tagInserts = tagIds.map((tagId: string) => ({
          userId: session.user.id,
          tagId: parseInt(tagId),
        }))

        await db.insert(userTagsTable).values(tagInserts)
      }

      console.log("Tags updated successfully")
    }

    console.log("✅ Settings updated successfully")
    console.log("=== SETTINGS UPDATE API DEBUG END ===")

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("❌ Settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}