// app/api/auth/check-username/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/src/db'
import { usersTable } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      )
    }

    // Trim whitespace and validate username
    const trimmedUsername = username.trim()
    
    if (trimmedUsername.length === 0) {
      return NextResponse.json(
        { error: 'Username cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { available: false, error: 'Username must be at least 3 characters long' },
        { status: 200 }
      )
    }

    if (trimmedUsername.length > 30) {
      return NextResponse.json(
        { available: false, error: 'Username must be 30 characters or less' },
        { status: 200 }
      )
    }

    // Check for valid characters (alphanumeric, underscore, hyphen)
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!validUsernameRegex.test(trimmedUsername)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 200 }
      )
    }

    // Check if username exists in database
    const existingUser = await withRetry(async () => {
      return await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, trimmedUsername))
        .limit(1)
    }, 2, 300)

    const isAvailable = !existingUser || existingUser.length === 0

    return NextResponse.json({
      available: isAvailable,
      username: trimmedUsername
    })

  } catch (error) {
    console.error('Error checking username availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}