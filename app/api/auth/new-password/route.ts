import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { usersTable, eq, and, gt } from "@/src/db/schema"
import crypto from "crypto"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    // Find user with valid reset token
    const users = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.resetToken, resetTokenHash),
          gt(usersTable.resetTokenExpiry, new Date())
        )
      )
    const user = users[0]

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user's password and clear reset token
    await db
      .update(usersTable)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(usersTable.id, user.id))

    return NextResponse.json({ 
      success: true,
      message: "Password updated successfully" 
    })

  } catch (error) {
    console.error("New password error:", error)
    return NextResponse.json(
      { error: "An error occurred while setting your new password" },
      { status: 500 }
    )
  }
} 