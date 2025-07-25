import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"
import { db } from "@/src/db"
import { postsTable, usersTable, postLikesTable, postCommentsTable } from "@/src/db/schema"
import { desc, eq, count, and } from "drizzle-orm"
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

  console.log("=== BLOB UPLOAD DEBUG ===")
  console.log("Uploading to path:", pathname)
  console.log("File size:", buffer.length)
  console.log("MIME type:", mimetype)

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: mimetype,
  })

  console.log("Blob upload successful:", blob.url)
  console.log("=== BLOB UPLOAD COMPLETE ===")

  return blob.url
}

// GET - Fetch posts
export async function GET(request: NextRequest) {
  try {
    console.log("=== POSTS GET API DEBUG START ===")
    console.log("Request URL:", request.url)
    console.log("Request method:", request.method)
    console.log("Timestamp:", new Date().toISOString())

    const session = await getServerSession(authOptions)
    console.log("Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })

    if (!session?.user?.id) {
      console.error("❌ UNAUTHORIZED: No session or user ID")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get("userId")
    const feedMode = searchParams.get("feed") === "true"
    
    console.log("URL search params:", Object.fromEntries(searchParams.entries()))
    console.log("User ID param extracted:", userIdParam)
    console.log("Feed mode:", feedMode)

    let posts
    if (feedMode) {
      // Feed mode - get posts from all users for recommendations
      console.log("=== FETCHING FEED POSTS ===")

      // Check total posts in database
      const totalPostsCount = await db.select({ count: count() }).from(postsTable)
      console.log("Total posts in database:", totalPostsCount[0]?.count || 0)

      const postsWithLikes = await db
        .select({
          id: postsTable.id,
          userId: postsTable.userId,
          content: postsTable.content,
          image: postsTable.image,
          video: postsTable.video,
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          user: {
            username: usersTable.username,
            nickname: usersTable.nickname,
            profileImage: usersTable.profileImage,
          },
        })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .orderBy(desc(postsTable.createdAt))
        .limit(50) // Limit for feed

      console.log("Raw posts fetched for feed:", postsWithLikes.length)

      posts = await Promise.all(
        postsWithLikes.map(async (post) => {
          const [likeCountResult, commentCountResult, userLikeResult] = await Promise.all([
            db.select({ count: count() }).from(postLikesTable).where(eq(postLikesTable.postId, post.id)),
            db.select({ count: count() }).from(postCommentsTable).where(eq(postCommentsTable.postId, post.id)),
            db
              .select()
              .from(postLikesTable)
              .where(and(eq(postLikesTable.postId, post.id), eq(postLikesTable.userId, session.user.id)))
              .limit(1),
          ])

          return {
            ...post,
            likes: likeCountResult[0]?.count || 0,
            comments: commentCountResult[0]?.count || 0,
            isLiked: userLikeResult.length > 0,
          }
        }),
      )

      console.log(`✅ SUCCESSFULLY FETCHED ${posts.length} feed posts`)
    } else if (userIdParam) {
      // User-specific posts
      const cleanUserId = userIdParam.split("?")[0]
      console.log("Cleaned user ID:", cleanUserId)

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(cleanUserId)) {
        console.error("❌ INVALID UUID FORMAT:", cleanUserId)
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
      }

      console.log("=== FETCHING POSTS FOR SPECIFIC USER ===")
      console.log("Target user ID:", cleanUserId)

      // First, let's check if the user exists
      const userExists = await db.select().from(usersTable).where(eq(usersTable.id, cleanUserId)).limit(1)
      console.log("User exists check:", userExists.length > 0 ? "✅ YES" : "❌ NO")
      if (userExists.length > 0) {
        console.log("User details:", {
          id: userExists[0].id,
          username: userExists[0].username,
          email: userExists[0].email,
        })
      }

      // Check total posts in database for this user
      const totalPostsCount = await db
        .select({ count: count() })
        .from(postsTable)
        .where(eq(postsTable.userId, cleanUserId))
      console.log("Total posts count for user:", totalPostsCount[0]?.count || 0)

      // Fetch posts for a specific user with user info and like status
      console.log("Executing main posts query...")
      const postsWithLikes = await db
        .select({
          id: postsTable.id,
          userId: postsTable.userId,
          content: postsTable.content,
          image: postsTable.image,
          video: postsTable.video,
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          user: {
            username: usersTable.username,
            nickname: usersTable.nickname,
            profileImage: usersTable.profileImage,
          },
        })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .where(eq(postsTable.userId, cleanUserId))
        .orderBy(desc(postsTable.createdAt))

      console.log("Raw posts fetched:", postsWithLikes.length)
      console.log(
        "Posts data:",
        postsWithLikes.map((p) => ({
          id: p.id,
          userId: p.userId,
          content: p.content?.substring(0, 50) + "...",
          hasImage: !!p.image,
          hasVideo: !!p.video,
          createdAt: p.createdAt,
        })),
      )

      // Get like counts, comment counts, and user's like status for each post
      console.log("Processing posts with likes and comments...")
      posts = await Promise.all(
        postsWithLikes.map(async (post, index) => {
          console.log(`Processing post ${index + 1}/${postsWithLikes.length} (ID: ${post.id})`)

          const [likeCountResult, commentCountResult, userLikeResult] = await Promise.all([
            db.select({ count: count() }).from(postLikesTable).where(eq(postLikesTable.postId, post.id)),
            db.select({ count: count() }).from(postCommentsTable).where(eq(postCommentsTable.postId, post.id)),
            db
              .select()
              .from(postLikesTable)
              .where(and(eq(postLikesTable.postId, post.id), eq(postLikesTable.userId, session.user.id)))
              .limit(1),
          ])

          const processedPost = {
            ...post,
            likes: likeCountResult[0]?.count || 0,
            comments: commentCountResult[0]?.count || 0,
            isLiked: userLikeResult.length > 0,
          }

          console.log(`Post ${post.id} processed:`, {
            likes: processedPost.likes,
            comments: processedPost.comments,
            isLiked: processedPost.isLiked,
          })

          return processedPost
        }),
      )

      console.log(`✅ SUCCESSFULLY FETCHED ${posts.length} posts for user ${cleanUserId}`)
    } else {
      // All posts (legacy)
      console.log("=== FETCHING ALL POSTS (LEGACY) ===")

      // Check total posts in database
      const totalPostsCount = await db.select({ count: count() }).from(postsTable)
      console.log("Total posts in database:", totalPostsCount[0]?.count || 0)

      const postsWithLikes = await db
        .select({
          id: postsTable.id,
          userId: postsTable.userId,
          content: postsTable.content,
          image: postsTable.image,
          video: postsTable.video,
          createdAt: postsTable.createdAt,
          updatedAt: postsTable.updatedAt,
          user: {
            username: usersTable.username,
            nickname: usersTable.nickname,
            profileImage: usersTable.profileImage,
          },
        })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .orderBy(desc(postsTable.createdAt))

      console.log("Raw posts fetched for legacy:", postsWithLikes.length)

      posts = await Promise.all(
        postsWithLikes.map(async (post) => {
          const [likeCountResult, commentCountResult, userLikeResult] = await Promise.all([
            db.select({ count: count() }).from(postLikesTable).where(eq(postLikesTable.postId, post.id)),
            db.select({ count: count() }).from(postCommentsTable).where(eq(postCommentsTable.postId, post.id)),
            db
              .select()
              .from(postLikesTable)
              .where(and(eq(postLikesTable.postId, post.id), eq(postLikesTable.userId, session.user.id)))
              .limit(1),
          ])

          return {
            ...post,
            likes: likeCountResult[0]?.count || 0,
            comments: commentCountResult[0]?.count || 0,
            isLiked: userLikeResult.length > 0,
          }
        }),
      )

      console.log(`✅ SUCCESSFULLY FETCHED ${posts.length} posts for legacy`)
    }

    const response = { posts }
    console.log("Final response structure:", {
      postsCount: response.posts.length,
      firstPost: response.posts[0]
        ? {
            id: response.posts[0].id,
            userId: response.posts[0].userId,
            hasContent: !!response.posts[0].content,
            hasImage: !!response.posts[0].image,
            hasVideo: !!response.posts[0].video,
            createdAt: response.posts[0].createdAt,
          }
        : null,
    })

    console.log("=== POSTS GET API DEBUG END ===")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ POSTS GET API ERROR:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    console.log("=== POSTS CREATE API DEBUG START ===")
    console.log("Request URL:", request.url)
    console.log("Request method:", request.method)
    console.log("Timestamp:", new Date().toISOString())

    const session = await getServerSession(authOptions)
    console.log("Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })

    if (!session?.user?.id) {
      console.error("❌ UNAUTHORIZED: No session or user ID")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("=== PARSING FORM DATA ===")
    const formData = await request.formData()
    const content = formData.get("content") as string
    const media = formData.get("media") as File | null

    console.log("Form data parsed:", {
      content: content ? `"${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"` : "null",
      hasMedia: !!media,
      mediaDetails: media
        ? {
            name: media.name,
            size: media.size,
            type: media.type,
          }
        : null,
    })

    if (!content?.trim() && !media) {
      console.error("❌ VALIDATION ERROR: No content or media provided")
      return NextResponse.json({ error: "Content or media is required" }, { status: 400 })
    }

    let mediaUrl = null
    let mediaType = null
    if (media) {
      console.log("=== PROCESSING MEDIA UPLOAD ===")

      // Validate file type (images and videos)
      if (!media.type.startsWith("image/") && !media.type.startsWith("video/")) {
        console.error("❌ INVALID FILE TYPE:", media.type)
        return NextResponse.json({ error: "File must be an image or video" }, { status: 400 })
      }

      // Validate file size (max 50MB for videos, 10MB for images)
      const maxSize = media.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (media.size > maxSize) {
        console.error("❌ FILE TOO LARGE:", media.size)
        return NextResponse.json(
          {
            error: `File too large (max ${media.type.startsWith("video/") ? "50MB for videos" : "10MB for images"})`,
          },
          { status: 400 },
        )
      }

      try {
        console.log("Converting media to buffer...")
        const bytes = await media.arrayBuffer()
        const buffer = Buffer.from(bytes)
        console.log("Buffer created, size:", buffer.length)

        console.log("Uploading to Vercel Blob...")
        mediaUrl = await uploadToStorage({
          buffer,
          filename: media.name,
          mimetype: media.type,
          folder: "post-media",
        })

        mediaType = media.type.startsWith("video/") ? "video" : "image"
        console.log("✅ MEDIA UPLOADED SUCCESSFULLY:", mediaUrl, "Type:", mediaType)
      } catch (uploadError) {
        console.error("❌ MEDIA UPLOAD FAILED:", uploadError)
        console.error("Upload error stack:", uploadError instanceof Error ? uploadError.stack : "No stack trace")
        return NextResponse.json({ error: "Failed to upload media" }, { status: 500 })
      }
    }

    console.log("=== INSERTING POST INTO DATABASE ===")
    const postData: any = {
      userId: session.user.id,
      content: content || "",
    }

    if (mediaType === "image") {
      postData.image = mediaUrl
    } else if (mediaType === "video") {
      postData.video = mediaUrl
    }

    console.log("Post data to insert:", {
      userId: postData.userId,
      content: postData.content,
      image: postData.image,
      video: postData.video,
    })

    const post = await db.insert(postsTable).values(postData).returning()

    console.log("✅ POST INSERTED SUCCESSFULLY:", {
      id: post[0].id,
      userId: post[0].userId,
      content: post[0].content?.substring(0, 50) + "...",
      hasImage: !!post[0].image,
      hasVideo: !!post[0].video,
      createdAt: post[0].createdAt,
    })

    // Verify the post was actually saved by fetching it back
    console.log("=== VERIFYING POST PERSISTENCE ===")
    const verifyPost = await db.select().from(postsTable).where(eq(postsTable.id, post[0].id)).limit(1)

    if (verifyPost.length === 0) {
      console.error("❌ POST VERIFICATION FAILED: Post not found after insert")
      return NextResponse.json({ error: "Post creation failed - not persisted" }, { status: 500 })
    }

    console.log("✅ POST VERIFICATION SUCCESSFUL:", {
      id: verifyPost[0].id,
      userId: verifyPost[0].userId,
      persisted: true,
    })

    // Check total posts count for this user after insert
    const userPostsCount = await db
      .select({ count: count() })
      .from(postsTable)
      .where(eq(postsTable.userId, session.user.id))

    console.log("User's total posts after insert:", userPostsCount[0]?.count || 0)

    // Return the post with additional fields for consistency
    const newPost = {
      ...post[0],
      likes: 0,
      comments: 0,
      isLiked: false,
    }

    console.log("Final response:", {
      id: newPost.id,
      userId: newPost.userId,
      hasContent: !!newPost.content,
      hasImage: !!newPost.image,
      hasVideo: !!newPost.video,
      likes: newPost.likes,
      comments: newPost.comments,
    })

    console.log("=== POSTS CREATE API DEBUG END ===")
    return NextResponse.json(newPost)
  } catch (error) {
    console.error("❌ POSTS CREATE API ERROR:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}