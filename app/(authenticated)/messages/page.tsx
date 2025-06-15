"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Volume2,
  Archive,
  Trash2,
  Pin,
  Users,
  Settings,
  MessageSquarePlus,
  ArrowLeft,
  PhoneOff,
  VideoOff,
  Mic,
  MicOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Chat,
  Channel,
  MessageList,
  Thread,
  Window,
  ChannelList,
  useChannelStateContext,
  useChatContext,
  type ChannelPreviewUIComponentProps,
} from "stream-chat-react"
import { useStreamContext } from "@/components/providers/StreamProvider"
import type { Channel as StreamChannel, ChannelMemberResponse } from "stream-chat"
import "stream-chat-react/dist/css/v2/index.css"
import { cn } from "@/lib/utils"

// Add the CallModal component (same as in direct-message-page.tsx)
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
  }

  const handleDecline = () => {
    onClose()
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    onClose()
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

// Custom Channel Preview Component
const CustomChannelPreview = ({ channel, setActiveChannel, watchers }: ChannelPreviewUIComponentProps) => {
  const { client } = useChatContext()
  const currentUser = client.user

  // Get the other participant
  const otherMember = Object.values(channel.state.members || {}).find((member) => member.user?.id !== currentUser?.id)

  // Check if user is online
  const isOnline = otherMember?.user?.online || false

  const lastMessage = channel.state.messages[channel.state.messages.length - 1]
  const unreadCount = channel.countUnread()

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  const handleClick = () => {
    setActiveChannel?.(channel, watchers)
  }

  return (
    <div
      onClick={handleClick}
      className="group flex items-center p-4 hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-white cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-sm rounded-2xl mx-2 my-1"
    >
      <div className="relative mr-4">
        <Avatar className="h-14 w-14 ring-2 ring-sky-100/50 ring-offset-2 transition-all duration-300 group-hover:ring-sky-200">
          <AvatarImage src={otherMember?.user?.image || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold text-lg">
            {otherMember?.user?.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        {isOnline ? (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-400 border-3 border-white rounded-full shadow-sm animate-pulse"></div>
        ) : (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gray-300 border-3 border-white rounded-full shadow-sm"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sky-900 truncate text-base">
            {otherMember?.user?.name || otherMember?.user?.id || "Unknown"}
          </h3>
          <div className="flex items-center gap-2">
            {lastMessage && (
              <span className="text-xs text-sky-500 font-medium">{formatTime(new Date(lastMessage.created_at!))}</span>
            )}
            {unreadCount > 0 && (
              <Badge className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-xs px-2 py-1 min-w-[1.5rem] h-6 shadow-lg shadow-sky-200/50 animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastMessage?.user?.id === currentUser?.id && (
            <div className="text-sky-500 flex-shrink-0">
              {lastMessage.status === "received" ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </div>
          )}
          <p className="text-sm text-sky-600 truncate leading-relaxed">
            {lastMessage?.text || lastMessage?.type || "No messages yet"}
          </p>
        </div>
      </div>
    </div>
  )
}

// Custom Channel Header
const CustomChannelHeader = ({ onBack }: { onBack?: () => void }) => {
  const { channel } = useChannelStateContext()
  const { client } = useChatContext()
  const currentUser = client.user

  const otherMember = Object.values(channel.state.members || {}).find((member) => member.user?.id !== currentUser?.id)

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
        target_user: otherMember?.user?.id,
      } as any)

      // Open call modal
      setCallModal({
        isOpen: true,
        callType,
        isIncoming: false,
      })
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
      if (event.call_initiated && event.user?.id !== client?.user?.id) {
        setCallModal({
          isOpen: true,
          callType: event.call_type || "audio",
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
          {/* Mobile back button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-sky-100 ring-offset-2">
            <AvatarImage src={otherMember?.user?.image || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white font-semibold">
              {otherMember?.user?.name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sky-900 text-base md:text-lg">{otherMember?.user?.name || "Unknown"}</h2>
            <div className="flex items-center gap-2">
              {otherMember?.user?.online ? (
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
        otherUser={otherMember?.user}
        isIncoming={callModal.isIncoming}
      />
    </>
  )
}

// Custom Message Input Component
const CustomMessageInput = () => {
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
    <div className="p-4 md:p-6 bg-white/95 backdrop-blur-xl border-t border-sky-100/50 pb-[env(safe-area-inset-bottom)] fixed md:relative bottom-0 left-0 right-0 z-[60] md:z-10">
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
            className="w-full resize-none border-0 rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 text-sm bg-sky-50/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 max-h-[120px] placeholder:text-sky-400 transition-all duration-300"
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
          className="bg-sky-500 hover:bg-sky-600 text-white p-3 md:p-4 rounded-full mb-1 disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex-shrink-0"
        >
          <Send className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </form>
    </div>
  )
}

// Empty State Component
const EmptyState = () => (
  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30 relative overflow-hidden">
    {/* Simple doodle elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Simple line doodles */}
      <svg className="absolute top-1/4 left-1/4 w-16 h-16 text-sky-200/40" viewBox="0 0 64 64" fill="none">
        <path
          d="M8 32C8 32 16 24 32 32C48 40 56 32 56 32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
        <circle cx="44" cy="44" r="1.5" fill="currentColor" />
      </svg>

      <svg className="absolute bottom-1/3 right-1/4 w-12 h-12 text-sky-200/40" viewBox="0 0 48 48" fill="none">
        <path
          d="M12 24L24 12L36 24L24 36Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="1" fill="currentColor" />
      </svg>

      <svg className="absolute top-1/2 right-1/3 w-10 h-10 text-sky-200/40" viewBox="0 0 40 40" fill="none">
        <path
          d="M8 20C8 20 12 16 20 20C28 24 32 20 32 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect x="16" y="28" width="8" height="4" rx="2" fill="currentColor" />
      </svg>

      <svg className="absolute top-1/3 left-1/2 w-8 h-8 text-sky-200/40" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="24" cy="8" r="1" fill="currentColor" />
      </svg>

      <svg className="absolute bottom-1/4 left-1/3 w-14 h-14 text-sky-200/40" viewBox="0 0 56 56" fill="none">
        <path
          d="M14 28L28 14L42 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M20 42C20 42 24 38 28 42C32 46 36 42 36 42"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>

    {/* Minimal content area - completely empty */}
    <div className="text-center max-w-md relative z-10">{/* Just empty space for clean, minimal look */}</div>

    {/* Subtle grid pattern overlay */}
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(14 165 233) 1px, transparent 0)`,
        backgroundSize: "32px 32px",
      }}
    ></div>
  </div>
)

// Main Messages Page Component
export default function MessagesPage() {
  const { client, isReady, error: streamError } = useStreamContext()
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showNewGroupModal, setShowNewGroupModal] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showArchivedChats, setShowArchivedChats] = useState(false)
  const [archivedChannels, setArchivedChannels] = useState<StreamChannel[]>([])
  const [isLoadingArchived, setIsLoadingArchived] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const router = useRouter()

  // Custom setActiveChannel handler that matches the expected signature
  const handleSetActiveChannel = (
    newChannel?: StreamChannel,
    watchers?: { limit?: number; offset?: number },
    event?: any,
  ) => {
    setActiveChannel(newChannel || null)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !client) return

    setIsSearching(true)
    try {
      // Search for channels/conversations
      const channelResponse = await client.queryChannels(
        {
          type: "messaging",
          members: { $in: [client.userID || ""] },
          // Fix: Use the correct property path for member names
          $or: [
            { name: { $autocomplete: searchQuery } },
            { "member.user.name": { $autocomplete: searchQuery } }
          ],
        },
        { last_message_at: -1 },
        { limit: 10 },
      )

      // Search for users matching the query
      const userResponse = await client.queryUsers(
        {
          $and: [
            // Fix: Remove $ne operator and use a different approach
            {
              $or: [
                { name: { $autocomplete: searchQuery } },
                { username: { $autocomplete: searchQuery } }
              ],
            },
          ],
        },
        { id: 1 },
        { limit: 10 },
      )

      // Alternative approach: Filter out current user from results
      const filteredUsers = userResponse.users.filter(user => user.id !== client.userID)

      // Search for messages containing the query
      let messageResults: any[] = []
      try {
        const messageResponse = await client.search(
          { members: { $in: [client.userID || ""] } },
          { text: { $autocomplete: searchQuery } },
          { limit: 10 },
        )
        messageResults = messageResponse.results
      } catch (error) {
        console.log("Message search not available:", error)
      }

      // Combine results with proper structure
      const results = [
        ...channelResponse.map((channel) => ({
          type: "channel",
          data: channel,
        })),
        ...userResponse.users.map((u) => ({ type: "user", data: u })),
        ...messageResults.map((r) => ({
          type: "message",
          data: {
            ...r.message,
            cid: r.message.cid || `${r.message.channel?.type}:${r.message.channel?.id}`,
          },
        })),
      ]

      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const loadUsers = async () => {
    if (!client) return

    setIsLoadingUsers(true)
    try {
      const response = await client.queryUsers({}, { last_active: -1 }, { limit: 30 })
      // Filter out current user
      const filteredUsers = response.users.filter((u) => u.id !== client.userID)
      setAvailableUsers(filteredUsers)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const createGroup = async () => {
    if (!client || !groupName.trim() || selectedUsers.length === 0) return

    try {
      // Create a new channel with the selected members
      const channel = client.channel("messaging", crypto.randomUUID(), {
        members: [...selectedUsers, client.userID || ""],
        created_by: { id: client.userID || "" },
      })

      await channel.watch()
      setShowNewGroupModal(false)
      setGroupName("")
      setSelectedUsers([])
      handleSetActiveChannel(channel)
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group. Please try again.")
    }
  }

  const loadArchivedChats = async () => {
    if (!client) return

    setIsLoadingArchived(true)
    try {
      // Query all channels first
      const filter = {
        type: "messaging",
        members: { $in: [client.userID || ""] },
      }

      const sort = { last_message_at: -1 as const }

      const response = await client.queryChannels(filter, sort, {
        limit: 30,
        state: true,
      })

      // Filter for channels with archived custom data using optional chaining
      const archived = response.filter((channel) => {
        // Use optional chaining to safely access custom data
        const customData = channel.data as any
        return customData?.archived === true
      })
      setArchivedChannels(archived)
    } catch (error) {
      console.error("Error loading archived chats:", error)
    } finally {
      setIsLoadingArchived(false)
    }
  }

  if (streamError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-sky-100/50 border border-sky-100/50">
          <h2 className="text-xl font-semibold text-red-500 mb-3">Chat Unavailable</h2>
          <p className="text-sky-600 mb-6">{streamError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!client || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-200/20 to-sky-400/20 animate-pulse"></div>
          </div>
          <p className="text-sky-600 font-medium">Loading chat...</p>
        </div>
      </div>
    )
  }

  const currentUser = client.user
  if (!currentUser?.id) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-50">
        <p className="text-sky-600">Unable to load user information</p>
      </div>
    )
  }

  // Channel filters and options
  const channelListFilters = {
    type: "messaging",
    members: { $in: [currentUser.id] },
  }

  const channelListSort = { last_message_at: -1 as const }
  const channelListOptions = {
    limit: 20,
    state: true,
    watch: true,
    presence: true,
  }

  return (
    <div className="flex h-[100dvh] bg-gradient-to-br from-sky-50/30 via-white to-sky-50/30">
      <Chat client={client}>
        {/* Sidebar - hidden on mobile when channel is active */}
        <div
          className={cn(
            "w-full md:w-96 border-r border-sky-100/50 flex flex-col bg-white/95 backdrop-blur-xl shadow-lg",
            activeChannel && "hidden md:flex",
          )}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-sky-100/50 bg-white/95 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-200/50">
                  <MessageSquarePlus className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-sky-900">Messages</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/discover")}
                  className="p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-3 hover:bg-sky-50 text-sky-600 rounded-full transition-all duration-200"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-sky-100/50 shadow-xl">
                    <DropdownMenuItem
                      className="text-sky-700 hover:bg-sky-50"
                      onClick={() => {
                        setShowNewGroupModal(true)
                        loadUsers()
                      }}
                    >
                      <Users className="h-4 w-4 mr-3" />
                      New Group
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sky-700 hover:bg-sky-50"
                      onClick={() => {
                        setShowArchivedChats(true)
                        loadArchivedChats()
                      }}
                    >
                      <Archive className="h-4 w-4 mr-3" />
                      Archived Chats
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-sky-700 hover:bg-sky-50" onClick={() => setShowSettings(true)}>
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearch()
              }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    // Trigger search after a short delay
                    if (e.target.value.trim()) {
                      handleSearch()
                    } else {
                      setSearchResults([])
                    }
                  }}
                  className="pl-12 bg-sky-50/50 border-0 rounded-2xl h-12 placeholder:text-sky-400 focus:ring-2 focus:ring-sky-300/50 focus:bg-white/80 transition-all duration-300 text-sky-900"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-hidden">
            <ChannelList
              filters={channelListFilters}
              sort={channelListSort}
              options={channelListOptions}
              Preview={(props) => <CustomChannelPreview {...props} setActiveChannel={handleSetActiveChannel} />}
              setActiveChannelOnMount={false}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={cn("flex-1 flex flex-col h-full", !activeChannel && "hidden md:flex")}>
          {activeChannel ? (
            <Channel channel={activeChannel}>
              <Window>
                <CustomChannelHeader onBack={() => setActiveChannel(null)} />
                <div className="flex-1 overflow-hidden">
                  <MessageList />
                </div>
                <div className="flex-shrink-0 w-full">
                  <CustomMessageInput />
                </div>
              </Window>
              <Thread />
            </Channel>
          ) : (
            <EmptyState />
          )}
        </div>
        {searchQuery && searchResults.length > 0 && (
          <div className="absolute z-20 left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-sky-100/50 max-h-[60vh] overflow-y-auto">
            <div className="p-3 border-b border-sky-100/50">
              <h3 className="text-sm font-medium text-sky-900">Search Results</h3>
            </div>
            <div className="p-2">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-sky-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    if (result.type === "message" && result.data.cid) {
                      // Get the channel from the message's cid
                      const channelType = result.data.cid.split(":")[0]
                      const channelId = result.data.cid.split(":")[1]
                      const messageChannel = client.channel(channelType, channelId)
                      handleSetActiveChannel(messageChannel)
                      setSearchQuery("")
                      setSearchResults([])
                    } else if (result.type === "user") {
                      // Create or navigate to DM with this user
                      router.push(`/messages/${result.data.id}`)
                      setSearchQuery("")
                      setSearchResults([])
                    } else if (result.type === "channel") {
                      handleSetActiveChannel(result.data)
                      setSearchQuery("")
                      setSearchResults([])
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={
                          result.type === "message" 
                            ? result.data.user?.image 
                            : result.type === "channel" 
                            ? (Object.values(result.data.state.members || {}) as ChannelMemberResponse[]).find(
                                member => member.user?.id !== client.userID
                              )?.user?.image
                            : result.data.image
                        } 
                      />
                      <AvatarFallback className="bg-sky-100 text-sky-500">
                        {result.type === "message"
                          ? result.data.user?.name?.[0]?.toUpperCase() || "?"
                          : result.type === "channel"
                          ? (Object.values(result.data.state.members || {}) as ChannelMemberResponse[]).find(
                              member => member.user?.id !== client.userID
                            )?.user?.name?.[0]?.toUpperCase() || "?"
                          : result.data.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sky-900 truncate">
                        {result.type === "message"
                          ? result.data.user?.name || "Unknown"
                          : result.type === "channel"
                          ? (Object.values(result.data.state.members || {}) as ChannelMemberResponse[]).find(
                              member => member.user?.id !== client.userID
                            )?.user?.name || "Unknown"
                          : result.data.name || "Unknown"}
                      </p>
                      <p className="text-xs text-sky-600 truncate">
                        {result.type === "message" 
                          ? result.data.text 
                          : result.type === "channel"
                          ? result.data.state.messages[result.data.state.messages.length - 1]?.text || "No messages"
                          : "@" + (result.data.username || result.data.id)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showNewGroupModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowNewGroupModal(false)}
          >
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-sky-900 mb-4">Create New Group</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="group-name" className="block text-sm font-medium text-sky-700 mb-1">
                    Group Name
                  </label>
                  <Input
                    id="group-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sky-700 mb-1">Add Members</label>

                  {isLoadingUsers ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-sky-100 rounded-lg">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center p-2 hover:bg-sky-50">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {
                              if (selectedUsers.includes(user.id)) {
                                setSelectedUsers((prev) => prev.filter((id) => id !== user.id))
                              } else {
                                setSelectedUsers((prev) => [...prev, user.id])
                              }
                            }}
                            className="mr-3"
                          />
                          <label htmlFor={`user-${user.id}`} className="flex items-center gap-3 flex-1 cursor-pointer">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image || "/placeholder.svg"} />
                              <AvatarFallback className="bg-sky-100 text-sky-500">
                                {user.name?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name || user.id}</span>
                          </label>
                        </div>
                      ))}

                      {availableUsers.length === 0 && (
                        <p className="text-center p-4 text-sm text-gray-500">No users found</p>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-sm text-sky-600">
                    {selectedUsers.length} {selectedUsers.length === 1 ? "member" : "members"} selected
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNewGroupModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                    disabled={!groupName.trim() || selectedUsers.length === 0}
                    onClick={createGroup}
                  >
                    Create Group
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showArchivedChats && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowArchivedChats(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-sky-900 mb-4">Archived Chats</h3>

              {isLoadingArchived ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {archivedChannels.length > 0 ? (
                    <div className="space-y-2">
                      {archivedChannels.map((channel) => {
                        // Get the other member for DMs
                        const otherMember = Object.values(channel.state.members || {}).find(
                          (member) => member.user?.id !== client?.userID,
                        )

                        // Safely access custom data
                        const customData = channel.data as any
                        const channelName =
                          customData?.name || otherMember?.user?.name || `Channel ${channel.id?.slice(-8)}` || "Unknown"

                        return (
                          <div
                            key={channel.id}
                            className="p-3 hover:bg-sky-50 rounded-lg cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              // Update channel to remove archived status
                              channel
                                .update({
                                  archived: false,
                                } as any)
                                .then(() => {
                                  handleSetActiveChannel(channel)
                                  setShowArchivedChats(false)
                                })
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={otherMember?.user?.image || "/placeholder.svg"} />
                                <AvatarFallback className="bg-sky-100 text-sky-500">
                                  {channelName[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sky-900">{channelName}</p>
                                <p className="text-xs text-sky-600">
                                  Archived on {new Date(Date.now()).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-sky-500">
                              Restore
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Archive className="h-12 w-12 text-sky-200 mx-auto mb-4" />
                      <p className="text-sky-600">No archived chats found</p>
                    </div>
                  )}
                </div>
              )}

              <Button
                className="mt-4 w-full bg-sky-500 hover:bg-sky-600 text-white"
                onClick={() => setShowArchivedChats(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
        {showSettings && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-sky-900 mb-4">Chat Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 hover:bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-full">
                      <Volume2 className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sky-900">Notification Sounds</p>
                      <p className="text-xs text-sky-600">Play sounds for new messages</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" id="notification-sounds" className="sr-only peer" defaultChecked />
                    <label
                      htmlFor="notification-sounds"
                      className="block w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-sky-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all cursor-pointer"
                    ></label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-full">
                      <MessageSquarePlus className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sky-900">Read Receipts</p>
                      <p className="text-xs text-sky-600">Show when messages are read</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" id="read-receipts" className="sr-only peer" defaultChecked />
                    <label
                      htmlFor="read-receipts"
                      className="block w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-sky-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all cursor-pointer"
                    ></label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-full">
                      <Users className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sky-900">Online Status</p>
                      <p className="text-xs text-sky-600">Show when you're online</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" id="online-status" className="sr-only peer" defaultChecked />
                    <label
                      htmlFor="online-status"
                      className="block w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-sky-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all cursor-pointer"
                    ></label>
                  </div>
                </div>
              </div>

              <Button
                className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white"
                onClick={() => setShowSettings(false)}
              >
                Save Settings
              </Button>
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
                box-shadow: 0 8px 30px rgba(14, 165, 233, 0.12), 0 2px 8px rgba(14, 165, 233, 0.08);
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

              .str-chat__channel-list {
                background: transparent;
              }

              .str-chat__channel-list-messenger__main {
                background: transparent;
              }

              .str-chat__channel-preview-messenger {
                background: transparent;
                border: none;
                padding: 0;
                margin: 0;
              }

              .str-chat__channel-preview-messenger:hover {
                background: transparent;
              }

              .str-chat__channel-preview-messenger--active {
                background: rgba(14, 165, 233, 0.05);
                border-radius: 1rem;
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

              @keyframes slideInLeft {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }

              .str-chat__channel-list {
                animation: slideInLeft 0.5s ease-out;
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
                  padding-bottom: 0 !important;
                }
                
                .str-chat__message-list-scroll {
                  padding-bottom: 120px !important;
                }
              }
            `,
          }}
        />
      </Chat>
    </div>
  )
}
