import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    console.log("=== PROFILE UPDATE API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Update request body:", body)

    const { about, nickname, metro_area } = body

    // Build update object with only provided fields
    const updateData: any = {}
    if (about !== undefined) updateData.about = about
    if (nickname !== undefined) updateData.nickname = nickname
    if (metro_area !== undefined) updateData.metro_area = metro_area

    console.log("Update data:", updateData)

    if (Object.keys(updateData).length === 0) {
      console.error("No valid fields to update")
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await db
      .update(usersTable)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, session.user.id))
      .returning()

    if (updatedUser.length === 0) {
      console.error("User not found or update failed")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ Profile updated successfully")
    console.log("=== PROFILE UPDATE API DEBUG END ===")

    return NextResponse.json({
      user: updatedUser[0],
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("❌ Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
