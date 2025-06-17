import { NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/src/db"
import { usersTable, eq } from "@/src/db/schema"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)
const RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000 // 1 hour in milliseconds

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()))
    const user = users[0]

    if (!user) {
      // Return success even if user not found for security
      return NextResponse.json({ 
        success: true,
        message: "If an account exists with this email, you will receive a password reset link" 
      })
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    // Save reset token and expiry to database
    await db
      .update(usersTable)
      .set({
        resetToken: resetTokenHash,
        resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_EXPIRES_IN)
      })
      .where(eq(usersTable.id, user.id))

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-password?token=${resetToken}`

    // Send email using Resend
    await resend.emails.send({
      from: "Mirro <noreply@mirro.app>",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Mirro Team</p>
        </div>
      `
    })

    return NextResponse.json({ 
      success: true,
      message: "If an account exists with this email, you will receive a password reset link" 
    })

  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    )
  }
} 