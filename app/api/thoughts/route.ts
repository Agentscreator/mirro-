import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/src/db"
import { thoughtsTable } from "@/src/db/schema"
import { desc, eq } from "drizzle-orm"
import { getEmbedding } from "@/src/lib/generateEmbeddings"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/src/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get userId from query params, fallback to current user
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get("userId") || session.user.id

    // Fetch thoughts for the target user, ordered by creation date (newest first)
    const thoughts = await db
      .select({
        id: thoughtsTable.id,
        title: thoughtsTable.title, // Now get the actual title from database
        content: thoughtsTable.content,
        createdAt: thoughtsTable.createdAt,
      })
      .from(thoughtsTable)
      .where(eq(thoughtsTable.userId, targetUserId))
      .orderBy(desc(thoughtsTable.createdAt))

    // Transform the data to match the expected format
    const formattedThoughts = thoughts.map((thought) => ({
      id: thought.id,
      title: thought.title, // Use the actual saved title
      content: thought.content,
      createdAt: thought.createdAt?.toISOString() || new Date().toISOString(),
    }))

    return NextResponse.json(formattedThoughts)
  } catch (error) {
    console.error("Error fetching thoughts:", error)
    return NextResponse.json({ error: "Failed to fetch thoughts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content } = await request.json()

    if (!content || !title) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Generate embedding for the content
    const embedding = await getEmbedding(content)
    const embeddingStr = JSON.stringify(embedding)

    // Insert the new thought with title
    const [newThought] = await db
      .insert(thoughtsTable)
      .values({
        userId: session.user.id,
        title, // Save the title to database
        content,
        embedding: embeddingStr,
      })
      .returning({
        id: thoughtsTable.id,
        title: thoughtsTable.title, // Return the saved title
        content: thoughtsTable.content,
        createdAt: thoughtsTable.createdAt,
      })

    // Format the response to match the expected format
    const formattedThought = {
      id: newThought.id,
      title: newThought.title, // Use the saved title
      content: newThought.content,
      createdAt: newThought.createdAt?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(formattedThought, { status: 201 })
  } catch (error) {
    console.error("Error creating thought:", error)
    return NextResponse.json({ error: "Failed to create thought" }, { status: 500 })
  }
}