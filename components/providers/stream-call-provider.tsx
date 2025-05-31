"use client"

import type React from "react"

import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

// Token provider that calls your existing API
const tokenProvider = async (): Promise<string> => {
  try {
    const response = await fetch("/api/stream/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data.token
    }

    throw new Error("Failed to get token")
  } catch (error) {
    console.error("Error getting Stream token:", error)
    throw error
  }
}

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!

const StreamVideoProvider = ({ children }: { children: React.ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    if (!API_KEY) {
      console.error("Stream API key is missing")
      return
    }

    try {
      const client = new StreamVideoClient({
        apiKey: API_KEY,
        user: {
          id: user.id,
          name: user.username || user.firstName || user.id,
          image: user.imageUrl,
        },
        tokenProvider: tokenProvider,
      })

      setVideoClient(client)
    } catch (error) {
      console.error("Error creating StreamVideoClient:", error)
    }
  }, [user, isLoaded])

  if (!videoClient) return <>{children}</>

  return <StreamVideo client={videoClient}>{children}</StreamVideo>
}

export default StreamVideoProvider
