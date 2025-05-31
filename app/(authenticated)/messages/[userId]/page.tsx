"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Info,
  Volume2,
  Pin,
  Archive,
  Trash2,
  Paperclip,
  Send,
  PhoneOff,
  VideoOff,
  Mic,
  MicOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Chat, Channel, MessageList, Thread, Window, useChannelStateContext } from "stream-chat-react"
import { useStreamContext } from "@/components/providers/StreamProvider"
import type { Channel as StreamChannel } from "stream-chat"
import { isCallInitiatedEvent, hasUserData } from "@/types/streamm"
import "stream-chat-react/dist/css/v2/index.css"

// Simple hash function to create deterministic short IDs
const createChannelId = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort()
  const combined = sortedIds.join("")

  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const hashStr = Math.abs(hash).toString(36)
  return `dm_${hashStr}`
}

// Call Modal Component
const CallModal = ({
  isOpen,
  onClose,
  callType,
  otherUser,
  isIncoming = false,
}: {
  isOpen: boolean
  onClose: () => void
  callType: "audio" | "video"
  otherUser: any
  isIncoming?: boolean
}) => {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video")
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswer = () => {
    setIsCallActive(true)
    // Here you would integrate with Stream Call SDK
    // call.join() or similar
  }

  const handleDecline = () => {
    onClose()
    // Here you would reject the call
    // call.reject() or similar
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    onClose()
    // Here you would end the call
    // call.leave() or similar
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
        {/* User Avatar */}
        <Avatar className="h-32 w-32 mx-auto mb-6 ring-4 ring-white shadow-xl">
          <AvatarImage src={otherUser?.image || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white text-4xl font-semibold">
            {otherUser?.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        {/* User Name */}
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{otherUser?.name || "Unknown User"}</h3>

        {/* Call Status */}
        <p className="text-gray-600 mb-8">
          {isIncoming && !isCallActive && `Incoming ${callType} call...`}
          {!isIncoming && !isCallActive && `Calling...`}
          {isCallActive && formatDuration(callDuration)}
        </p>

        {/* Video Area (for video calls) */}
        {callType === "video" && isCallActive && (
          <div className="bg-gray-900 rounded-2xl h-48 mb-6 flex items-center justify-center">
            <p className="text-white">Video call area</p>
            {/* Here you would render the Stream Video components */}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {isIncoming && !isCallActive && (
            <>
              <Button
                onClick={handleDecline}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 h-16 w-16"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                onClick={handleAnswer}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 h-16 w-16"
              >
                <Phone className="h-6 w-6" />
              </Button>
            </>
          )}

          {isCallActive && (
            <>
              <Button
                onClick={() => setIsMuted(!isMuted)}
                className={`${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-500 hover:bg-gray-600"} text-white rounded-full p-3 h-12 w-12`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              {callType === "video" && (
                <Button
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`${!isVideoEnabled ? "bg-red-500 hover:bg-red-600" : "bg-gray-500 hover:bg-gray-600"} text-white rounded-full p-3 h-12 w-12`}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              )}

              <Button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 h-12 w-12"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </>
          )}

          {!isIncoming && !isCallActive && (
            <Button
              onClick={handleEndCall}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 h-16 w-16"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Custom Channel Header for DM
const DMChannelHeader = ({
  otherUser,
  onBack,
  channel,
  client,
  showContactInfo,
  setShowContactInfo,
  router,
}: {
  otherUser: any
  onBack: () => void
  channel: StreamChannel | null
  client: any
  showContactInfo: boolean
  setShowContactInfo: (value: boolean | ((prev: boolean) => boolean)) => void
  router: any
}) => {
  const [callModal, setCallModal] = useState<{
    isOpen: boolean
    callType: "audio" | "video"
    isIncoming: boolean
  }>({
    isOpen: false,
    callType: "audio",
    isIncoming: false,
  })

  const initiateCall = async (callType: "audio" | "video") => {
    if (!channel || !client) return

    try {
      // Send call initiation event through Stream Chat
      await channel.sendEvent({
        type: "message.new", // Use a supported event type
        call_initiated: true,
        call_type: callType,
        target_user: otherUser?.id,
      } as any)

      // Open call modal
      setCallModal({
        isOpen: true,
        callType,
        isIncoming: false,
      })

      // Here you would integrate with Stream Call SDK
      // const call = client.call('default', `call_${channel.id}`)
      // await call.getOrCreate({
      //   data: {
      //     created_by_id: client.userID,
      //     members: [{ user_id: client.userID }, { user_id: otherUser.id }],
      //   },
      // })
      // await call.join({ create: true })
    } catch (error) {
      console.error("Error initiating call:", error)
      alert("Failed to start call. Please try again.")
    }
  }

  // Listen for incoming calls
  useEffect(() => {
    if (!channel) return

    const handleCallEvent = (event: any) => {
      // Use type guards to check if this is a call initiation event
      if (isCallInitiatedEvent(event) && hasUserData(event) && event.user.id !== client?.user?.id) {
        setCallModal({
          isOpen: true,
          callType: (event as any).call_type || "audio",
          isIncoming: true,
        })
      }
    }

    // Listen for message events that might contain call data
    channel.on("message.new" as any, handleCallEvent)

    return () => {
      channel.off("message.new" as any, handleCallEvent)
    }
  }, [channel, client])

  return (
    <>
      <div className="flex items-center justify-between p-4 md:p-6 bg-white/95 backdrop-blur-xl border-b border-sky-100/50 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-sky-100 ring-offset-2">
            <AvatarImage src={otherUser?.image || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold">
              {otherUser?.name?.[0]?.toUpperCase() || otherUser?.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sky-900 text-base md:text-lg">
              {otherUser?.name || otherUser?.username || "Unknown User"}
            </h2>
            <div className="flex items-center gap-2">
              {otherUser?.online ? (
                <>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <p className="text-xs md:text-sm text-emerald-500 font-medium">Online</p>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Offline</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 md:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
            onClick={() => initiateCall("audio")}
          >
            <Phone className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 md:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
            onClick={() => initiateCall("video")}
          >
            <Video className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 md:p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
              >
                <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-sky-100/50 shadow-xl">
              <DropdownMenuItem
                className="text-sky-700 hover:bg-sky-50"
                onClick={() => setShowContactInfo((prev: boolean) => !prev)}
              >
                <Info className="h-4 w-4 mr-3" />
                {showContactInfo ? "Hide Contact Info" : "Show Contact Info"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sky-700 hover:bg-sky-50"
                onClick={() => {
                  if (channel) {
                    const isMuted = channel.muteStatus().muted
                    if (isMuted) {
                      channel.unmute()
                      alert("Notifications unmuted")
                    } else {
                      channel.mute()
                      alert("Notifications muted")
                    }
                  }
                }}
              >
                <Volume2 className="h-4 w-4 mr-3" />
                Mute Notifications
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sky-700 hover:bg-sky-50"
                onClick={async () => {
                  if (channel) {
                    // Store pinned status in custom data
                    await channel.update({
                      pinned: true,
                      pinned_at: new Date().toISOString(),
                      pinned_by: client.user?.id,
                    } as any)
                    alert("Chat pinned")
                  }
                }}
              >
                <Pin className="h-4 w-4 mr-3" />
                Pin Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sky-700 hover:bg-sky-50"
                onClick={async () => {
                  if (channel) {
                    // Store archived status in custom data
                    await channel.update({
                      archived: true,
                      archived_at: new Date().toISOString(),
                    } as any)
                    alert("Chat archived")
                    router.push("/messages")
                  }
                }}
              >
                <Archive className="h-4 w-4 mr-3" />
                Archive Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 hover:bg-red-50"
                onClick={() => {
                  if (channel && confirm("Are you sure you want to delete this chat?")) {
                    channel.delete().then(() => {
                      alert("Chat deleted")
                      router.push("/messages")
                    })
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Call Modal */}
      <CallModal
        isOpen={callModal.isOpen}
        onClose={() => setCallModal((prev) => ({ ...prev, isOpen: false }))}
        callType={callModal.callType}
        otherUser={otherUser}
        isIncoming={callModal.isIncoming}
      />
    </>
  )
}

// Custom Message Input for DM
const DMMessageInput = () => {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { channel } = useChannelStateContext()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && attachments.length === 0) || !channel) return

    try {
      const messageData: any = {
        text: text.trim(),
      }

      if (attachments.length > 0) {
        const streamAttachments = await Promise.all(
          attachments.map(async (file) => {
            const isImage = file.type.startsWith("image/")

            return {
              type: file.type,
              title: file.name,
              file_size: file.size,
              mime_type: file.type,
              asset_url: URL.createObjectURL(file),
              image_url: isImage ? URL.createObjectURL(file) : undefined,
            }
          }),
        )

        messageData.attachments = streamAttachments
      }

      await channel.sendMessage(messageData)

      setText("")
      setAttachments([])
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [text])

  return (
    <div className="p-3 md:p-6 bg-white/95 backdrop-blur-xl border-t border-sky-100/50 pb-[env(safe-area-inset-bottom)] fixed md:relative bottom-0 left-0 right-0 z-[60] md:z-10">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-4 min-h-[60px]">
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 md:p-3 mb-1 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full resize-none border-0 rounded-2xl md:rounded-3xl px-3 md:px-6 py-2 md:py-4 text-sm bg-sky-50/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 max-h-[120px] placeholder:text-sky-400 transition-all duration-300"
            rows={1}
          />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((file, index) => (
                <div key={index} className="relative bg-white rounded-lg p-1 border border-sky-100 shadow-sm">
                  <div className="flex items-center gap-2 max-w-[150px]">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={file.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-sky-100 rounded flex items-center justify-center">
                        <Paperclip className="h-4 w-4 text-sky-500" />
                      </div>
                    )}
                    <span className="text-xs truncate">{file.name}</span>
                  </div>
                  <button
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                    onClick={() => removeAttachment(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!text.trim() && attachments.length === 0}
          className="bg-sky-500 hover:bg-sky-600 text-white p-2 md:p-4 rounded-full mb-1 disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex-shrink-0"
        >
          <Send className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </form>
    </div>
  )
}

// Loading Component
const LoadingState = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-400 mx-auto"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200/20 to-sky-400/20 animate-pulse"></div>
      </div>
      <p className="text-sky-600 font-medium">Loading conversation...</p>
    </div>
  </div>
)

// Error Component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
    <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-sky-100/50 border border-sky-100/50">
      <h2 className="text-xl font-semibold text-red-500 mb-3">Unable to Load Conversation</h2>
      <p className="text-sky-600 mb-6">{error}</p>
      <Button
        onClick={onRetry}
        className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
      >
        Try Again
      </Button>
    </div>
  </div>
)

// Main DM Page Component
export default function DirectMessagePage() {
  const { client, isReady, error: streamError } = useStreamContext()
  const [channel, setChannel] = useState<StreamChannel | null>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  // Initialize channel logic remains the same...
  useEffect(() => {
    const initializeChannel = async () => {
      if (!client || !isReady || !userId) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const currentUser = client.user
        if (!currentUser?.id) {
          throw new Error("Current user not found")
        }

        if (currentUser.id === userId) {
          throw new Error("Cannot message yourself")
        }

        const channelId = createChannelId(currentUser.id, userId)
        const dmChannel = client.channel("messaging", channelId, {
          members: [currentUser.id, userId],
        })

        await dmChannel.watch()

        const members = Object.values(dmChannel.state.members || {})
        const otherMember = members.find((member) => member.user?.id !== currentUser.id)

        if (otherMember?.user) {
          let displayName = otherMember.user.name || otherMember.user.username || otherMember.user.id
          let username = otherMember.user.username || otherMember.user.name || otherMember.user.id

          if (displayName.startsWith("User ") && displayName.length > 40) {
            username = `User_${userId.slice(-8)}`
            displayName = username
          }

          setOtherUser({
            ...otherMember.user,
            name: displayName,
            username: username,
            displayName: username,
          })
        } else {
          try {
            const userResponse = await client.queryUsers({ id: userId })
            if (userResponse.users && userResponse.users.length > 0) {
              const user = userResponse.users[0]
              let displayName = user.name || user.username || user.id
              let username = user.username || user.name || user.id

              if (displayName.startsWith("User ") && displayName.length > 40) {
                username = `User_${userId.slice(-8)}`
                displayName = username
              }

              setOtherUser({
                ...user,
                name: displayName,
                username: username,
                displayName: username,
              })
            } else {
              const shortId = userId.slice(-8)
              setOtherUser({
                id: userId,
                name: `User_${shortId}`,
                username: `User_${shortId}`,
                displayName: `User_${shortId}`,
              })
            }
          } catch (queryError) {
            const shortId = userId.slice(-8)
            setOtherUser({
              id: userId,
              name: `User_${shortId}`,
              username: `User_${shortId}`,
              displayName: `User_${shortId}`,
            })
          }
        }

        setChannel(dmChannel)
      } catch (err) {
        console.error("Error initializing channel:", err)
        setError(err instanceof Error ? err.message : "Failed to load conversation")
      } finally {
        setLoading(false)
      }
    }

    initializeChannel()
  }, [client, isReady, userId])

  const handleBack = () => {
    router.push("/messages")
  }

  const handleRetry = () => {
    window.location.reload()
  }

  if (streamError) {
    return <ErrorState error={streamError} onRetry={handleRetry} />
  }

  if (!client || !isReady || loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />
  }

  if (!channel || !otherUser) {
    return <ErrorState error="Unable to load conversation" onRetry={handleRetry} />
  }

  return (
    <div className="flex h-[100dvh] bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30 overflow-hidden">
      <Chat client={client}>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Channel channel={channel}>
            <Window>
              <DMChannelHeader
                otherUser={otherUser}
                onBack={handleBack}
                channel={channel}
                client={client}
                showContactInfo={showContactInfo}
                setShowContactInfo={setShowContactInfo}
                router={router}
              />
              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageList />
              </div>
              <div className="flex-shrink-0 w-full">
                <DMMessageInput />
              </div>
            </Window>
            <Thread />
          </Channel>
        </div>
      </Chat>

      {showContactInfo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowContactInfo(false)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-sky-900 mb-4">Contact Information</h3>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 ring-2 ring-sky-100 ring-offset-2">
                <AvatarImage src={otherUser?.image || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold text-lg">
                  {otherUser?.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sky-900">{otherUser?.name || "Unknown User"}</h4>
                <p className="text-sm text-sky-600">@{otherUser?.username || otherUser?.id?.slice(-8)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">For privacy reasons, detailed contact information is hidden.</p>
              <Button
                className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                onClick={() => setShowContactInfo(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .str-chat__main-panel {
              height: 100%;
              background: linear-gradient(135deg, rgba(240, 249, 255, 0.3) 0%, rgba(255, 255, 255, 1) 50%, rgba(240, 249, 255, 0.3) 100%);
            }
            
            .str-chat__message-list {
              padding: 2rem;
              background: transparent;
            }
            
            .str-chat__message-list-scroll {
              height: 100%;
            }
            
            .str-chat__message-simple {
              margin-bottom: 1.5rem;
            }
            
            .str-chat__message-simple__content {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(14, 165, 233, 0.1);
              border-radius: 1.5rem;
              padding: 1rem 1.25rem;
              box-shadow: 0 4px 20px rgba(14, 165, 233, 0.08), 0 1px 4px rgba(14, 165, 233, 0.05);
              max-width: 70%;
              transition: all 0.3s ease;
            }

            .str-chat__message-simple__content:hover {
              transform: translateY(-1px);

            }

            .str-chat__message-simple--me .str-chat__message-simple__content {
              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 4px 20px rgba(14, 165, 233, 0.25), 0 1px 4px rgba(14, 165, 233, 0.15);
            }

            .str-chat__message-simple--me .str-chat__message-simple__content:hover {
              box-shadow: 0 8px 30px rgba(14, 165, 233, 0.35), 0 2px 8px rgba(14, 165, 233, 0.25);
            }
            
            .str-chat__message-simple__text {
              font-size: 0.9rem;
              line-height: 1.4;
              margin: 0;
              font-weight: 400;
            }
            
            .str-chat__avatar {
              width: 2.5rem;
              height: 2.5rem;
              margin-right: 0.75rem;
              border: 2px solid rgba(14, 165, 233, 0.1);
            }
            
            .str-chat__message-simple__actions {
              display: none;
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border-radius: 0.75rem;
              padding: 0.25rem;
              box-shadow: 0 4px 20px rgba(14, 165, 233, 0.1);
            }
            
            .str-chat__message-simple:hover .str-chat__message-simple__actions {
              display: flex;
            }
            
            .str-chat__message-timestamp {
              font-size: 0.75rem;
              color: #0ea5e9;
              margin-top: 0.5rem;
              font-weight: 500;
            }
            
            .str-chat__message-simple__status {
              margin-top: 0.5rem;
            }
            
            .str-chat__message-simple__status svg {
              width: 1rem;
              height: 1rem;
              color: #0ea5e9;
            }
            
            .str-chat__thread {
              border-left: 1px solid rgba(14, 165, 233, 0.1);
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
            }
            
            .str-chat__message-list-scroll {
              scroll-behavior: smooth;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar {
              width: 6px;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar-track {
              background: rgba(240, 249, 255, 0.5);
              border-radius: 3px;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #0ea5e9, #0284c7);
              border-radius: 3px;
            }
            
            .str-chat__message-list-scroll::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #0284c7, #0369a1);
            }
            
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            .str-chat__message-simple {
              animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            .str-chat__message-list {
              animation: fadeIn 0.6s ease-out;
            }
            
            @media (max-width: 768px) {
              .str-chat__message-simple__content {
                max-width: 85%;
              }
              
              .str-chat__message-list {
                padding: 1rem;
                padding-bottom: 120px !important; /* Account for fixed message input */
              }
              
              .str-chat__main-panel {
                height: 100dvh !important;
                display: flex !important;
                flex-direction: column !important;
                padding-bottom: 0 !important;
              }
              
              .str-chat__channel {
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
              }
              
              .str-chat__message-list-scroll {
                padding-bottom: 120px !important;
              }
            }

            .str-chat__message-input {
              display: block !important;
              position: relative !important;
              bottom: auto !important;
              left: auto !important;
              right: auto !important;
              width: 100% !important;
              z-index: 10 !important;
            }

            .str-chat__message-input-wrapper {
              display: block !important;
              position: relative !important;
              width: 100% !important;
            }

            @media (max-width: 768px) {
              .str-chat__main-panel {
                height: 100dvh !important;
                display: flex !important;
                flex-direction: column !important;
              }
              
              .str-chat__channel {
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
              }
              
              .str-chat__message-list {
                flex: 1 !important;
                min-height: 0 !important;
                padding: 1rem !important;
              }
            }
          `,
        }}
      />
    </div>
  )
}
