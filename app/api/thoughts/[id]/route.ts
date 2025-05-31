// app/api/thoughts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { thoughtsTable } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'
import { getEmbedding } from '@/src/lib/generateEmbeddings'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/src/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thoughtId = parseInt(params.id)
    if (isNaN(thoughtId)) {
      return NextResponse.json({ error: 'Invalid thought ID' }, { status: 400 })
    }

    const { title, content } = await request.json()

    if (!content || !title) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Generate new embedding for the updated content
    const embedding = await getEmbedding(content)
    const embeddingStr = JSON.stringify(embedding)

    // Update the thought (only if it belongs to the current user)
    const [updatedThought] = await db
      .update(thoughtsTable)
      .set({
        content,
        embedding: embeddingStr,
      })
      .where(and(
        eq(thoughtsTable.id, thoughtId),
        eq(thoughtsTable.userId, session.user.id)
      ))
      .returning({
        id: thoughtsTable.id,
        content: thoughtsTable.content,
        createdAt: thoughtsTable.createdAt,
      })

    if (!updatedThought) {
      return NextResponse.json({ error: 'Thought not found or unauthorized' }, { status: 404 })
    }

    // Format the response to match the expected format
    const formattedThought = {
      id: updatedThought.id,
      title,
      content: updatedThought.content,
      createdAt: updatedThought.createdAt?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(formattedThought)
  } catch (error) {
    console.error('Error updating thought:', error)
    return NextResponse.json({ error: 'Failed to update thought' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thoughtId = parseInt(params.id)
    if (isNaN(thoughtId)) {
      return NextResponse.json({ error: 'Invalid thought ID' }, { status: 400 })
    }

    // Delete the thought (only if it belongs to the current user)
    const [deletedThought] = await db
      .delete(thoughtsTable)
      .where(and(
        eq(thoughtsTable.id, thoughtId),
        eq(thoughtsTable.userId, session.user.id)
      ))
      .returning({ id: thoughtsTable.id })

    if (!deletedThought) {
      return NextResponse.json({ error: 'Thought not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting thought:', error)
    return NextResponse.json({ error: 'Failed to delete thought' }, { status: 500 })
  }
}