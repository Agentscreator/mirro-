//components/stream-chat-provider.tsx
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { StreamChat } from "stream-chat"
import { useSession } from "next-auth/react"

interface StreamContextType {
  client: StreamChat | null
  isReady: boolean
  error: string | null
}

const StreamContext = createContext<StreamContextType>({
  client: null,
  isReady: false,
  error: null,
})

export const useStreamContext = () => {
  const context = useContext(StreamContext)
  if (!context) {
    throw new Error("useStreamContext must be used within a StreamProvider")
  }
  return context
}

interface StreamProviderProps {
  children: React.ReactNode
}

export function StreamProvider({ children }: StreamProviderProps) {
  const { data: session, status } = useSession()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeStream = async () => {
      if (status === "loading") return

      if (!session?.user?.id) {
        setError("User not authenticated")
        return
      }

      try {
        setError(null)

        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
        if (!apiKey) {
          throw new Error("Stream API key not configured")
        }

        // Create Stream client
        const streamClient = StreamChat.getInstance(apiKey)

        // Get token from our API
        const tokenResponse = await fetch("/api/stream/token", {
          method: "POST",
          credentials: "include",
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to get Stream token")
        }

        const { token } = await tokenResponse.json()

        // Connect user to Stream
        await streamClient.connectUser(
          {
            id: session.user.id,
            name: session.user.name || session.user.email || "User",
            image: session.user.image || undefined,
          },
          token,
        )

        setClient(streamClient)
        setIsReady(true)
      } catch (err) {
        console.error("Stream initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize chat")
      }
    }

    initializeStream()

    // Cleanup function
    return () => {
      if (client) {
        client.disconnectUser()
        setClient(null)
        setIsReady(false)
      }
    }
  }, [session, status])

  return <StreamContext.Provider value={{ client, isReady, error }}>{children}</StreamContext.Provider>
}
