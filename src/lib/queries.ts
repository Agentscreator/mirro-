// src/lib/queries.ts 

import { db } from "@/src/db" 
import { usersTable } from "@/src/db/schema" 
import { eq, or } from "drizzle-orm"

// Type definition for user data based on actual database schema
export interface User {
  id: string
  username: string
  nickname?: string
  email: string
  password: string
  dob: string
  gender: string
  genderPreference: string
  preferredAgeMin: number
  preferredAgeMax: number
  proximity: string
  timezone: string
  metro_area: string
  latitude: number
  longitude: number
  profileImage?: string
  about?: string
  image?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Fetch a user by their ID using Drizzle ORM
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log('Fetching user with ID:', userId)
    
    const result = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        email: usersTable.email,
        password: usersTable.password,
        dob: usersTable.dob,
        gender: usersTable.gender,
        genderPreference: usersTable.genderPreference,
        preferredAgeMin: usersTable.preferredAgeMin,
        preferredAgeMax: usersTable.preferredAgeMax,
        proximity: usersTable.proximity,
        timezone: usersTable.timezone,
        metro_area: usersTable.metro_area,
        latitude: usersTable.latitude,
        longitude: usersTable.longitude,
        profileImage: usersTable.profileImage,
        about: usersTable.about,
        image: usersTable.image,
        createdAt: usersTable.created_at,
        updatedAt: usersTable.updated_at
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    if (result.length === 0) {
      console.log('No user found with ID:', userId)
      return null
    }

    console.log('User found:', result[0])
    return result[0] as User

  } catch (error) {
    console.error("Error fetching user by ID:", error)
    throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update a user by their ID using Drizzle ORM
 */
export async function updateUserById(userId: string, updateData: Partial<User>): Promise<User> {
  try {
    // Add timestamp for updated record
    const dataWithTimestamp = {
      ...updateData,
      updated_at: new Date() // Note: using updated_at to match schema
    }

    const result = await db
      .update(usersTable)
      .set(dataWithTimestamp)
      .where(eq(usersTable.id, userId))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        email: usersTable.email,
        password: usersTable.password,
        dob: usersTable.dob,
        gender: usersTable.gender,
        genderPreference: usersTable.genderPreference,
        preferredAgeMin: usersTable.preferredAgeMin,
        preferredAgeMax: usersTable.preferredAgeMax,
        proximity: usersTable.proximity,
        timezone: usersTable.timezone,
        metro_area: usersTable.metro_area,
        latitude: usersTable.latitude,
        longitude: usersTable.longitude,
        profileImage: usersTable.profileImage,
        about: usersTable.about,
        image: usersTable.image,
        createdAt: usersTable.created_at,
        updatedAt: usersTable.updated_at
      })

    if (result.length === 0) {
      throw new Error("User not found or update failed")
    }

    return result[0] as User

  } catch (error) {
    console.error("Error updating user:", error)
    throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search for a user by either their ID or username
 */
export async function getUserByUsernameOrId(identifier: string): Promise<User | null> {
  try {
    console.log('Searching for user with identifier:', identifier)
    
    const result = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        email: usersTable.email,
        password: usersTable.password,
        dob: usersTable.dob,
        gender: usersTable.gender,
        genderPreference: usersTable.genderPreference,
        preferredAgeMin: usersTable.preferredAgeMin,
        preferredAgeMax: usersTable.preferredAgeMax,
        proximity: usersTable.proximity,
        timezone: usersTable.timezone,
        metro_area: usersTable.metro_area,
        latitude: usersTable.latitude,
        longitude: usersTable.longitude,
        profileImage: usersTable.profileImage,
        about: usersTable.about,
        image: usersTable.image,
        createdAt: usersTable.created_at,
        updatedAt: usersTable.updated_at
      })
      .from(usersTable)
      .where(
        or(
          eq(usersTable.id, identifier),
          eq(usersTable.username, identifier)
        )
      )
      .limit(1)

    if (result.length === 0) {
      console.log('No user found with identifier:', identifier)
      return null
    }

    console.log('User found:', result[0])
    return result[0] as User

  } catch (error) {
    console.error("Error fetching user by username or ID:", error)
    throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search for a user specifically by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    console.log('Fetching user with username:', username)
    
    const result = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        nickname: usersTable.nickname,
        email: usersTable.email,
        password: usersTable.password,
        dob: usersTable.dob,
        gender: usersTable.gender,
        genderPreference: usersTable.genderPreference,
        preferredAgeMin: usersTable.preferredAgeMin,
        preferredAgeMax: usersTable.preferredAgeMax,
        proximity: usersTable.proximity,
        timezone: usersTable.timezone,
        metro_area: usersTable.metro_area,
        latitude: usersTable.latitude,
        longitude: usersTable.longitude,
        profileImage: usersTable.profileImage,
        about: usersTable.about,
        image: usersTable.image,
        createdAt: usersTable.created_at,
        updatedAt: usersTable.updated_at
      })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1)

    if (result.length === 0) {
      console.log('No user found with username:', username)
      return null
    }

    console.log('User found:', result[0])
    return result[0] as User

  } catch (error) {
    console.error("Error fetching user by username:", error)
    throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}