// app/api/users/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { db } from '@/src/db'
import { usersTable } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

// GET user preferences
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db
      .select({
        genderPreference: usersTable.genderPreference,
        preferredAgeMin: usersTable.preferredAgeMin,
        preferredAgeMax: usersTable.preferredAgeMax,
        proximity: usersTable.proximity,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1)

    if (!user[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user[0])
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT (update) user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { genderPreference, preferredAgeMin, preferredAgeMax, proximity } = body

    // Validate the input
    if (!genderPreference || !proximity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof preferredAgeMin !== 'number' || typeof preferredAgeMax !== 'number') {
      return NextResponse.json({ error: 'Age values must be numbers' }, { status: 400 })
    }

    if (preferredAgeMin < 18 || preferredAgeMax > 100 || preferredAgeMin >= preferredAgeMax) {
      return NextResponse.json({ error: 'Invalid age range' }, { status: 400 })
    }

    // Validate gender preference values - matches GENDER_PREFERENCES from constants
    const validGenderPrefs = ['male', 'female', 'no-preference']
    if (!validGenderPrefs.includes(genderPreference)) {
      return NextResponse.json({ error: 'Invalid gender preference' }, { status: 400 })
    }

    // Validate proximity values - matches PROXIMITY_OPTIONS from constants
    const validProximity = ['local', 'metro', 'countrywide', 'global']
    if (!validProximity.includes(proximity)) {
      return NextResponse.json({ error: 'Invalid proximity setting' }, { status: 400 })
    }

    // Update user preferences
    const updatedUser = await db
      .update(usersTable)
      .set({
        genderPreference,
        preferredAgeMin,
        preferredAgeMax,
        proximity,
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, session.user.id))
      .returning({
        genderPreference: usersTable.genderPreference,
        preferredAgeMin: usersTable.preferredAgeMin,
        preferredAgeMax: usersTable.preferredAgeMax,
        proximity: usersTable.proximity,
      })

    if (!updatedUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(updatedUser[0])
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}