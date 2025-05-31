import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"
import { postCommentsTable, postLikesTable } from "@/src/db/schema"

// DELETE - Delete a post
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== DELETE POST API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    console.log("Deleting post ID:", postId)
    console.log("User ID:", session.user.id)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Check if post exists and belongs to the user
    const post = await db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.id, postId), eq(postsTable.userId, session.user.id)))
      .limit(1)

    if (post.length === 0) {
      console.error("Post not found or not owned by user")
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 })
    }

    console.log("Post found, proceeding with deletion")

    // First, delete all comments associated with this post
    console.log("Deleting associated comments...")
    const deletedComments = await db.delete(postCommentsTable).where(eq(postCommentsTable.postId, postId)).returning()

    console.log(`Deleted ${deletedComments.length} comments`)

    // Then, delete all likes associated with this post
    console.log("Deleting associated likes...")
    const deletedLikes = await db.delete(postLikesTable).where(eq(postLikesTable.postId, postId)).returning()

    console.log(`Deleted ${deletedLikes.length} likes`)

    // Finally, delete the post
    console.log("Deleting the post...")
    await db.delete(postsTable).where(and(eq(postsTable.id, postId), eq(postsTable.userId, session.user.id)))

    console.log("✅ Post deleted successfully")
    console.log("=== DELETE POST API DEBUG END ===")

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("❌ Delete post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
