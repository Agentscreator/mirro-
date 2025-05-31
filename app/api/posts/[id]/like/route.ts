// app/api/posts/[id]/like/route.ts (Alternative version)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/lib/auth';
import { db } from '@/src/db';
import { postLikesTable, postsTable } from '@/src/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Like Route Debug ===');
    
    // Get the authenticated session first
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    console.log('Session user:', session?.user);
    
    if (!session || !session.user || !session.user.id) {
      console.log('Authentication failed - no valid session');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('Authenticated user ID:', userId);

    // Get the post ID from params
    const { id } = await context.params;
    const postId = parseInt(id);
    
    console.log('Post ID from URL:', id);
    console.log('Parsed post ID:', postId);
    
    if (isNaN(postId)) {
      console.log('Invalid post ID');
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Check if post exists
    console.log('Checking if post exists...');
    const post = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (post.length === 0) {
      console.log('Post not found');
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    console.log('Post found:', post[0]);

    // Check if user already liked this post
    console.log('Checking existing like...');
    const existingLike = await db
      .select()
      .from(postLikesTable)
      .where(
        and(
          eq(postLikesTable.postId, postId),
          eq(postLikesTable.userId, userId)
        )
      )
      .limit(1);

    console.log('Existing like:', existingLike);

    let isLiked: boolean;

    if (existingLike.length > 0) {
      // Unlike - remove the like
      console.log('Removing like...');
      await db
        .delete(postLikesTable)
        .where(
          and(
            eq(postLikesTable.postId, postId),
            eq(postLikesTable.userId, userId)
          )
        );
      isLiked = false;
      console.log('Post unliked successfully');
    } else {
      // Like - add the like
      console.log('Adding like...');
      await db
        .insert(postLikesTable)
        .values({
          postId,
          userId,
        });
      isLiked = true;
      console.log('Post liked successfully');
    }

    // Get updated like count
    console.log('Getting updated like count...');
    const likeCountResult = await db
      .select({ count: count() })
      .from(postLikesTable)
      .where(eq(postLikesTable.postId, postId));

    const likeCount = likeCountResult[0]?.count || 0;
    console.log('Updated like count:', likeCount);

    const response = {
      success: true,
      isLiked,
      likes: likeCount,
      message: isLiked ? 'Post liked' : 'Post unliked'
    };

    console.log('Sending response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in like endpoint:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await context.params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const existingLike = await db
      .select()
      .from(postLikesTable)
      .where(
        and(
          eq(postLikesTable.postId, postId),
          eq(postLikesTable.userId, userId)
        )
      )
      .limit(1);

    const likeCountResult = await db
      .select({ count: count() })
      .from(postLikesTable)
      .where(eq(postLikesTable.postId, postId));

    const likeCount = likeCountResult[0]?.count || 0;

    return NextResponse.json({
      isLiked: existingLike.length > 0,
      likes: likeCount
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
