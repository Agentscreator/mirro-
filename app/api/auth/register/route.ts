import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/src/db"
import { usersTable, tagsTable, userTagsTable } from "@/src/db/schema"
import { eq, or } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Received signup data:', body)
    
    const {
      username,
      email,
      password,
      nickname,
      dob,
      gender,
      genderPreference,
      preferredAgeMin,
      preferredAgeMax,
      proximity,
      timezone,
      metro_area,
      latitude,
      longitude,
      interestTags,
      contextTags,
      intentionTags,
    } = body

    // Validate required fields
    if (!username || !email || !password || !dob || !gender) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserByEmail = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)

    if (existingUserByEmail.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    const existingUserByUsername = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1)

    if (existingUserByUsername.length > 0) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        username,
        email,
        password: hashedPassword,
        nickname: nickname || username,
        dob,
        gender,
        genderPreference,
        preferredAgeMin,
        preferredAgeMax,
        proximity,
        timezone,
        metro_area: metro_area || "Unknown",
        latitude: latitude || 0,
        longitude: longitude || 0,
      })
      .returning()

    console.log('User created:', newUser.id)

    // Handle tags
    const allTags = [
      ...(interestTags || []).map((tag: string) => ({ name: tag, category: 'interest' as const })),
      ...(contextTags || []).map((tag: string) => ({ name: tag, category: 'context' as const })),
      ...(intentionTags || []).map((tag: string) => ({ name: tag, category: 'intention' as const })),
    ]

    if (allTags.length > 0) {
      console.log('Processing tags:', allTags)

      // Create or get existing tags
      const tagIds: number[] = []
      
      for (const tagData of allTags) {
        try {
          // Try to find existing tag
          const existingTag = await db
            .select()
            .from(tagsTable)
            .where(eq(tagsTable.name, tagData.name))
            .limit(1)

          let tagId: number

          if (existingTag.length > 0) {
            tagId = existingTag[0].id
            console.log(`Found existing tag: ${tagData.name} with id: ${tagId}`)
          } else {
            // Create new tag
            const [newTag] = await db
              .insert(tagsTable)
              .values({
                name: tagData.name,
                category: tagData.category,
              })
              .returning()
            
            tagId = newTag.id
            console.log(`Created new tag: ${tagData.name} with id: ${tagId}`)
          }

          tagIds.push(tagId)
        } catch (tagError) {
          console.error(`Error processing tag ${tagData.name}:`, tagError)
          // Continue with other tags even if one fails
        }
      }

      // Create user-tag relationships
      if (tagIds.length > 0) {
        const userTagData = tagIds.map(tagId => ({
          userId: newUser.id,
          tagId: tagId,
        }))

        try {
          await db.insert(userTagsTable).values(userTagData)
          console.log(`Created ${userTagData.length} user-tag relationships`)
        } catch (userTagError) {
          console.error('Error creating user-tag relationships:', userTagError)
          // Don't fail the entire registration for tag relationship errors
        }
      }
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      { 
        user: userWithoutPassword, 
        message: "User created successfully",
        tagsProcessed: allTags.length 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}