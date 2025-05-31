// app/api/users/search/route.ts - Fixed search endpoint
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { db } from '@/src/db'
import { usersTable } from '@/src/db/schema'
import { ilike, or, ne, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [], success: true })
    }

    // Search users by username or nickname, excluding current user
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        image: usersTable.image,
        profileImage: usersTable.profileImage
      })
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, session.user.id),
          or(
            ilike(usersTable.username, `%${query}%`),
            ilike(usersTable.nickname, `%${query}%`)
          )
        )
      )
      .limit(limit)

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        // Return both fields so frontend can choose the best one
        image: user.image,
        profileImage: user.profileImage
      })),
      success: true
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}
