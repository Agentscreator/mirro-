import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable, usersTable, postLikesTable } from "@/src/db/schema"
import { eq, and, count } from "drizzle-orm"
import { postCommentsTable } from "@/src/db/schema"
import { put } from "@vercel/blob"

async function uploadToStorage(options: {
  buffer: Buffer
  filename: string
  mimetype: string
  folder?: string
}): Promise<string> {
  const { buffer, filename, mimetype, folder = "post-media" } = options

  const timestamp = Date.now()
  const fileExtension = filename.split(".").pop()
  const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`
  const pathname = `${folder}/${uniqueFilename}`

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: mimetype,
  })

  return blob.url
}

// PUT - Edit a post
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== EDIT POST API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

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

    const formData = await request.formData()
    const content = formData.get("content") as string
    const media = formData.get("media") as File | null
    const removeMedia = formData.get("removeMedia") === "true"

    console.log("Edit data:", { content, hasMedia: !!media, removeMedia })

    if (!content?.trim() && !media && !post[0].image && !post[0].video) {
      console.error("No content or media provided")
      return NextResponse.json({ error: "Content or media is required" }, { status: 400 })
    }

    const updateData: any = {
      content: content?.trim() || "",
      updatedAt: new Date(),
    }

    // Handle media updates
    if (removeMedia) {
      updateData.image = null
      updateData.video = null
    } else if (media) {
      // Validate file type
      if (!media.type.startsWith("image/") && !media.type.startsWith("video/")) {
        return NextResponse.json({ error: "File must be an image or video" }, { status: 400 })
      }

      // Validate file size
      const maxSize = media.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (media.size > maxSize) {
        return NextResponse.json(
          {
            error: `File too large (max ${media.type.startsWith("video/") ? "50MB for videos" : "10MB for images"})`,
          },
          { status: 400 },
        )
      }

      try {
        const bytes = await media.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const mediaUrl = await uploadToStorage({
          buffer,
          filename: media.name,
          mimetype: media.type,
          folder: "post-media",
        })

        if (media.type.startsWith("video/")) {
          updateData.video = mediaUrl
          updateData.image = null
        } else {
          updateData.image = mediaUrl
          updateData.video = null
        }
      } catch (uploadError) {
        console.error("Media upload failed:", uploadError)
        return NextResponse.json({ error: "Failed to upload media" }, { status: 500 })
      }
    }

    // Update the post
    const updatedPost = await db
      .update(postsTable)
      .set(updateData)
      .where(and(eq(postsTable.id, postId), eq(postsTable.userId, session.user.id)))
      .returning()

    console.log("✅ Post updated successfully")
    return NextResponse.json(updatedPost[0])
  } catch (error) {
    console.error("❌ Edit post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    try {
      // Delete associated comments and likes first
      console.log("Deleting associated comments...")
      await db.delete(postCommentsTable).where(eq(postCommentsTable.postId, postId))

      console.log("Deleting associated likes...")
      await db.delete(postLikesTable).where(eq(postLikesTable.postId, postId))

      // Delete the post
      console.log("Deleting the post...")
      await db.delete(postsTable).where(and(eq(postsTable.id, postId), eq(postsTable.userId, session.user.id)))

      console.log("✅ Post deleted successfully")
      return NextResponse.json({ message: "Post deleted successfully" })
    } catch (dbError) {
      console.error("❌ Database deletion error:", dbError)
      return NextResponse.json({ error: "Failed to delete post from database" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Delete post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Fetch a single post
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== GET POST API DEBUG START ===")
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error("Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const postId = Number.parseInt(id)

    console.log("Fetching post ID:", postId)

    if (isNaN(postId)) {
      console.error("Invalid post ID")
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Fetch post with user info and like count
    const postWithUser = await db
      .select({
        id: postsTable.id,
        content: postsTable.content,
        image: postsTable.image,
        video: postsTable.video,
        createdAt: postsTable.createdAt,
        userId: postsTable.userId,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          nickname: usersTable.nickname,
          profileImage: usersTable.profileImage,
          image: usersTable.image,
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

    // Get like count and check if user liked the post
    const [likesResult, isLikedResult] = await Promise.all([
      db.select({ count: count() }).from(postLikesTable).where(eq(postLikesTable.postId, postId)),
      db
        .select()
        .from(postLikesTable)
        .where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, session.user.id)))
        .limit(1),
    ])

    const likes = likesResult[0]?.count || 0
    const isLiked = isLikedResult.length > 0

    // Get comment count
    const commentsResult = await db
      .select({ count: count() })
      .from(postCommentsTable)
      .where(eq(postCommentsTable.postId, postId))

    const comments = commentsResult[0]?.count || 0

    const postWithCounts = {
      ...post,
      likes,
      isLiked,
      comments,
    }

    console.log("✅ Post fetched successfully")
    console.log("=== GET POST API DEBUG END ===")

    return NextResponse.json(postWithCounts)
  } catch (error) {
    console.error("❌ Get post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
