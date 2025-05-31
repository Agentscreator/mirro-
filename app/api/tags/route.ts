import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { db } from '@/src/db';
import { tagsTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch all tags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      category: tagsTable.category,
    }).from(tagsTable);

    // Return tags wrapped in an object to match frontend expectations
    return NextResponse.json({ 
      tags,
      count: tags.length 
    });
  } catch (error) {
    console.error('Fetch tags error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      tags: [] // Provide fallback empty array
    }, { status: 500 });
  }
}

// POST - Create a new tag (if needed)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    // Check if tag already exists
    const existingTag = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.name, name))
      .limit(1);

    if (existingTag.length > 0) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
    }

    const tag = await db.insert(tagsTable).values({
      name,
      category,
    }).returning();

    return NextResponse.json({ 
      tag: tag[0],
      success: true 
    });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}