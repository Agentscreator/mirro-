// app/api/users/[userId]/route.ts - Fixed user profile endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth'
import { db } from '@/src/db'
import { usersTable, userTagsTable, tagsTable } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeTags = searchParams.get('includeTags') === 'true'

    // Await the params promise
    const params = await context.params
    const userId = params.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Clean the userId in case it has query parameters attached
    const cleanUserId = userId.split('?')[0]

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
        created_at: usersTable.created_at
      })
      .from(usersTable)
      .where(eq(usersTable.id, cleanUserId))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = user[0]
    
    const response: any = {
      user: {
        ...userData,
        // Include both image fields for frontend flexibility
        image: userData.image,
        profileImage: userData.profileImage
      },
      success: true
    }

    // Optionally include tags if requested
    if (includeTags) {
      const userTags = await db
        .select({
          tagId: userTagsTable.tagId,
          tagName: tagsTable.name,
          tagCategory: tagsTable.category
        })
        .from(userTagsTable)
        .innerJoin(tagsTable, eq(userTagsTable.tagId, tagsTable.id))
        .where(eq(userTagsTable.userId, cleanUserId))

      response.tags = userTags
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}