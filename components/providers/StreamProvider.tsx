"use client"

import { StreamChat } from "stream-chat"
import { Chat, useChatContext } from "stream-chat-react"
import { useSession } from "next-auth/react"
import { useEffect, useState, createContext, useContext, type ReactNode } from "react"

// Create a context for additional Stream functionality
const StreamContext = createContext<{
  client: StreamChat | null
  isLoading: boolean
  error: string | null
  isReady: boolean
}>({
  client: null,
  isLoading: true,
  error: null,
  isReady: false,
})

// Export the hook for components to use
export const useStreamContext = () => {
  const context = useContext(StreamContext)
  if (!context) {
    throw new Error("useStreamContext must be used within a StreamProvider")
  }
  return context
}

// Also export the chat context hook for convenience
export { useChatContext }

let chatClient: StreamChat | null = null

interface StreamProviderProps {
  children: ReactNode
  // Optional props for manual configuration (fallback if no session)
  apiKey?: string
  userId?: string
  // Optional prop to disable NextAuth integration
  useNextAuth?: boolean
}

export function StreamProvider({ children, apiKey, userId, useNextAuth = true }: StreamProviderProps) {
  const { data: session, status } = useSession()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Determine which user ID and API key to use
  const effectiveUserId = useNextAuth ? session?.user?.id : userId
  const effectiveApiKey = apiKey || process.env.NEXT_PUBLIC_STREAM_API_KEY

  useEffect(() => {
    // If using NextAuth, wait for session to load
    if (useNextAuth && status === "loading") return

    // Check if we have required data
    if (!effectiveUserId || !effectiveApiKey) {
      if (useNextAuth && !session?.user?.id) {
        setIsLoading(false)
        setIsReady(false)
        return
      } else if (!useNextAuth && (!userId || !apiKey)) {
        setError("Missing API key or user ID")
        setIsLoading(false)
        return
      }
    }

    const initializeClient = async () => {
      try {
        setError(null)

        if (!effectiveApiKey) {
          throw new Error("Stream API key is not configured")
        }

        // Create client if it doesn't exist
        if (!chatClient) {
          chatClient = StreamChat.getInstance(effectiveApiKey)
        }

        // Check if user is already connected
        if (chatClient.userID === effectiveUserId) {
          setClient(chatClient)
          setIsReady(true)
          setIsLoading(false)
          return
        }

        // Disconnect any existing user first
        if (chatClient.userID) {
          await chatClient.disconnectUser()
        }

        // Get token from your API
        const tokenResponse = await fetch("/api/stream/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: effectiveUserId,
          }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to get Stream token: ${tokenResponse.status}`)
        }

        const { token } = await tokenResponse.json()

        if (!token) {
          throw new Error("No token received from API")
        }

        // Ensure we have a valid user ID before connecting
        if (!effectiveUserId) {
          throw new Error("User ID is required")
        }

        // Connect user with appropriate user data
        const userData =
          useNextAuth && session?.user
            ? {
                id: effectiveUserId, // This is now guaranteed to be a string
                name: session.user.name || "Unknown User",
                image: session.user.image || undefined,
              }
            : {
                id: effectiveUserId, // This is now guaranteed to be a string
              }

        await chatClient.connectUser(userData, token)

        setClient(chatClient)
        setIsReady(true)
        console.log("Stream client connected successfully")
      } catch (err) {
        console.error("Stream client initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize chat")
        setIsReady(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeClient()

    // Cleanup function
    return () => {
      if (chatClient?.userID) {
        chatClient
          .disconnectUser()
          .then(() => console.log("Disconnected from Stream"))
          .catch((err) => console.error("Error disconnecting user:", err))
      }
    }
  }, [effectiveUserId, effectiveApiKey, status, useNextAuth])

  // Loading state
  if ((useNextAuth && status === "loading") || isLoading) {
    return (
      <StreamContext.Provider value={{ client: null, isLoading: true, error: null, isReady: false }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </StreamContext.Provider>
    )
  }

  // Error state
  if (error) {
    return (
      <StreamContext.Provider value={{ client: null, isLoading: false, error, isReady: false }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-600">
            <p>Chat initialization failed: {error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
              Retry
            </button>
          </div>
        </div>
      </StreamContext.Provider>
    )
  }

  // Not ready state (no session/user but no error)
  if (!effectiveUserId || !client || !isReady) {
    return (
      <StreamContext.Provider value={{ client, isLoading: false, error: null, isReady }}>
        {children}
      </StreamContext.Provider>
    )
  }

  // Ready state - wrap with Chat component
  return (
    <StreamContext.Provider value={{ client, isLoading: false, error: null, isReady: true }}>
      <Chat client={client} theme="messaging light">
        {children}
      </Chat>
    </StreamContext.Provider>
  )
}
