import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable, usersTable } from "@/src/db/schema"
import { eq } from "drizzle-orm"

// POST - Share a post (generate shareable link and metadata)
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== SHARE POST API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    console.log("Sharing post ID:", postId)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Fetch post with user info
    const postWithUser = await db
      .select({
        id: postsTable.id,
        content: postsTable.content,
        image: postsTable.image,
        createdAt: postsTable.createdAt,
        userId: postsTable.userId,
        user: {
          username: usersTable.username,
          nickname: usersTable.nickname,
          profileImage: usersTable.profileImage,
        },
      })
      .from(postsTable)
      .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
      .where(eq(postsTable.id, postId))
      .limit(1)

    if (postWithUser.length === 0) {
      console.error("Post not found")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const post = postWithUser[0]
    console.log("Post found for sharing:", { id: post.id, userId: post.userId })

    // Check if user data exists (handle the case where leftJoin returns null)
    if (!post.user) {
      console.error("User data not found for post")
      return NextResponse.json({ error: "User data not found" }, { status: 404 })
    }

    // Generate shareable content
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const shareUrl = `${baseUrl}/post/${postId}`

    const shareText = `Check out this post by ${post.user.nickname || post.user.username}: ${post.content.substring(0, 100)}${post.content.length > 100 ? "..." : ""}`

    const shareData = {
      url: shareUrl,
      title: `Post by ${post.user.nickname || post.user.username}`,
      text: shareText,
      image: post.image,
      author: {
        username: post.user.username,
        nickname: post.user.nickname,
        profileImage: post.user.profileImage,
      },
      post: {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
      },
    }

    console.log("✅ Share data generated successfully")
    console.log("=== SHARE POST API DEBUG END ===")

    return NextResponse.json(shareData)
  } catch (error) {
    console.error("❌ Share post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}