import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postCommentsTable, usersTable, postsTable } from "@/src/db/schema"
import { desc, eq, and } from "drizzle-orm"

// GET - Fetch comments for a post
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("Fetching comments...")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    console.log("Post ID:", postId)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Check if post exists
    const post = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1)

    if (post.length === 0) {
      console.error("Post not found")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Fetch comments with user info
    const comments = await db
      .select({
        id: postCommentsTable.id,
        postId: postCommentsTable.postId,
        userId: postCommentsTable.userId,
        content: postCommentsTable.content,
        createdAt: postCommentsTable.createdAt,
        user: {
          username: usersTable.username,
          nickname: usersTable.nickname,
          profileImage: usersTable.profileImage,
        },
      })
      .from(postCommentsTable)
      .leftJoin(usersTable, eq(postCommentsTable.userId, usersTable.id))
      .where(eq(postCommentsTable.postId, postId))
      .orderBy(desc(postCommentsTable.createdAt))

    console.log(`Fetched ${comments.length} comments for post ${postId}`)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Fetch comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("Creating new comment...")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    console.log("Post ID:", postId)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    console.log("Comment content:", content)

    if (!content?.trim()) {
      console.error("No content provided")
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Check if post exists
    const post = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1)

    if (post.length === 0) {
      console.error("Post not found")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    console.log("Inserting comment into database...")
    const comment = await db
      .insert(postCommentsTable)
      .values({
        postId,
        userId: session.user.id,
        content: content.trim(),
      })
      .returning()

    console.log("Comment created successfully:", comment[0])

    // Fetch the comment with user info
    const commentWithUser = await db
      .select({
        id: postCommentsTable.id,
        postId: postCommentsTable.postId,
        userId: postCommentsTable.userId,
        content: postCommentsTable.content,
        createdAt: postCommentsTable.createdAt,
        user: {
          username: usersTable.username,
          nickname: usersTable.nickname,
          profileImage: usersTable.profileImage,
        },
      })
      .from(postCommentsTable)
      .leftJoin(usersTable, eq(postCommentsTable.userId, usersTable.id))
      .where(eq(postCommentsTable.id, comment[0].id))
      .limit(1)

    return NextResponse.json(commentWithUser[0])
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== DELETE COMMENT API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    console.log("Post ID:", postId)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      console.error("Comment ID is required")
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    const commentIdNum = Number.parseInt(commentId)
    if (isNaN(commentIdNum)) {
      console.error("Invalid comment ID")
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 })
    }

    console.log("Deleting comment ID:", commentIdNum)

    // Check if comment exists and belongs to the user
    const comment = await db
      .select()
      .from(postCommentsTable)
      .where(and(eq(postCommentsTable.id, commentIdNum), eq(postCommentsTable.userId, session.user.id)))
      .limit(1)

    if (comment.length === 0) {
      console.error("Comment not found or not owned by user")
      return NextResponse.json({ error: "Comment not found or unauthorized" }, { status: 404 })
    }

    console.log("Comment found, proceeding with deletion")

    // Delete the comment
    await db.delete(postCommentsTable).where(eq(postCommentsTable.id, commentIdNum))

    console.log("✅ Comment deleted successfully")
    console.log("=== DELETE COMMENT API DEBUG END ===")

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("❌ Delete comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
