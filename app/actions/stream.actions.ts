"use server"

import { currentUser } from "@clerk/nextjs/server"
import { StreamChat } from "stream-chat"

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!
const apiSecret = process.env.STREAM_SECRET_KEY!

export const tokenProvider = async () => {
  const user = await currentUser()

  if (!user) throw new Error("User is not logged in")
  if (!apiKey) throw new Error("No API key")
  if (!apiSecret) throw new Error("No API secret")

  const client = StreamChat.getInstance(apiKey, apiSecret)

  // Create token for the user (works for both chat and video)
  const token = client.createToken(user.id)

  return token
}

// Separate function for video tokens if needed
export const getVideoToken = async () => {
  return await tokenProvider()
}
