"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  StreamVideo,
  StreamVideoClient,
  User,
  StreamVideoProvider as BaseStreamVideoProvider,
} from "@stream-io/video-react-sdk"
import "@stream-io/video-react-sdk/dist/css/styles.css"
import { useStreamContext } from "./StreamProvider"

type StreamVideoContextValue = {
  videoClient: StreamVideoClient | null
  isReady: boolean
  error: string | null
}

const StreamVideoContext = createContext<StreamVideoContextValue>({
  videoClient: null,
  isReady: false,
  error: null,
})

export const useStreamVideo = () => {
  const context = useContext(StreamVideoContext)
  if (!context) {
    throw new Error("useStreamVideo must be used within a StreamVideoProvider")
  }
  return context
}

export function StreamVideoProvider({ children }: { children: React.ReactNode }) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { client: chatClient } = useStreamContext()

  useEffect(() => {
    if (!chatClient?.user?.id || !process.env.NEXT_PUBLIC_STREAM_KEY) {
      return
    }

    try {
      const user: User = {
        id: chatClient.user.id,
        name: chatClient.user.name || chatClient.user.id,
        image: chatClient.user.image,
      }

      const client = new StreamVideoClient({
        apiKey: process.env.NEXT_PUBLIC_STREAM_KEY,
        user,
        token: chatClient.user.token,
      })

      setVideoClient(client)
      setIsReady(true)
      setError(null)
    } catch (err) {
      console.error("Error initializing video client:", err)
      setError(err instanceof Error ? err.message : "Failed to initialize video client")
    }
  }, [chatClient?.user])

  if (!videoClient) {
    return children
  }

  return (
    <StreamVideoContext.Provider value={{ videoClient, isReady, error }}>
      <BaseStreamVideoProvider client={videoClient}>{children}</BaseStreamVideoProvider>
    </StreamVideoContext.Provider>
  )
} 