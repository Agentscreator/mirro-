"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
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
import { Chat, Channel, MessageList, Thread, Window, useChannelStateContext, useChatContext } from "stream-chat-react"
import { useStreamContext } from "@/components/providers/StreamProvider"
import { useStreamVideo } from "@/components/providers/StreamVideoProvider"
import { CallInterface } from "@/components/video/CallInterface"
import type { Event as StreamEvent, Channel as StreamChannel } from 'stream-chat'
import type { StreamVideoClient, Call as VideoCall } from '@stream-io/video-react-sdk'
import "stream-chat-react/dist/css/v2/index.css"
import crypto from 'crypto'
import type { MessageUIComponentProps } from "stream-chat-react"

// Extend EventTypes to include our custom event
declare module 'stream-chat' {
  interface EventTypes {
    'custom.call_status': string
  }
}

// Simple hash function to create deterministic short IDs
const createChannelId = (userId1: string, userId2: string): string => {
  // Sort IDs to ensure consistency regardless of order
  const sortedIds = [userId1, userId2].sort()
  const combined = sortedIds.join('_')
  
  // If the combined string is short enough, use it directly
  if (combined.length <= 60) { // Leave room for 'dm_' prefix
    return `dm_${combined}`
  }
  
  // Otherwise, create a hash to ensure it's under 64 characters
  const hash = crypto.createHash('md5').update(combined).digest('hex')
  return `dm_${hash}` // This will be exactly 35 characters (dm_ + 32 char hash)
}

// Define custom message data type
interface CustomMessageData {
  is_call: boolean
  call_type?: string
  target_user?: string
  call_id?: string
  status?: 'ringing' | 'connected' | 'ended'
  caller_id?: string
  participant_id?: string
}

// Extend Stream's message type
declare module 'stream-chat' {
  interface MessageData {
    custom?: CustomMessageData
  }
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
  const { videoClient, isReady } = useStreamVideo()
  const [call, setCall] = useState<VideoCall | null>(null)
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing')
  const { channel } = useChannelStateContext()
  const { client } = useChatContext()

  useEffect(() => {
    if (!isOpen || !videoClient || !isReady || !otherUser?.id || !channel) return

    const initializeCall = async () => {
      try {
        const callId = `${callType}_${Date.now()}`
        const call = videoClient.call(callType, callId)

        const callData: any = {
          data: {
            custom: {
              target_user: otherUser.id,
              caller_id: client.userID,
              call_status: 'ringing',
            },
          },
          ring: true,
        }

        await call.getOrCreate(callData)

        if (!isIncoming) {
          await call.join()
          // Send a call initiation message
          await channel.sendMessage({
            text: `Initiated ${callType} call`,
            custom: {
              is_call: true,
              call_id: callId,
              status: 'ringing',
              caller_id: client.userID,
              target_user: otherUser.id,
              call_type: callType,
            } as CustomMessageData,
          })
        }

        // Set up call event listeners
        call.on('call.state.updated' as any, (event: any) => {
          const state = event.call?.state
          if (state?.status === 'connected') {
            setCallStatus('connected')
            // Notify through a message
            channel.sendMessage({
              text: `Call connected`,
              custom: {
                is_call: true,
                call_id: callId,
                status: 'connected',
                participant_id: client.userID,
              } as any,
            })
          } else if (state?.status === 'disconnected') {
            setCallStatus('ended')
            onClose()
          }
        })

        setCall(call)
      } catch (error) {
        console.error("Error initializing call:", error)
        onClose()
      }
    }

    initializeCall()

    // Listen for call status updates through messages
    const handleCallStatus = (event: any) => {
      if (event.type === 'message.new' && event.message?.custom) {
        const customData = event.message.custom as any
        if (customData.is_call) {
          const { status, participant_id } = customData
          if (status === 'connected' && participant_id !== client.userID) {
            setCallStatus('connected')
          } else if (status === 'ended') {
            setCallStatus('ended')
            onClose()
          }
        }
      }
    }

    channel.on('message.new', handleCallStatus)

    return () => {
      if (call) {
        // Send call ended message
        channel.sendMessage({
          text: `Call ended`,
          custom: {
            is_call: true,
            call_id: call.id,
            status: 'ended',
            participant_id: client.userID,
          } as any,
        }).catch(console.error)
        
        call.leave().catch(console.error)
      }
      channel.off('message.new', handleCallStatus)
    }
  }, [isOpen, videoClient, isReady, otherUser?.id, channel, client.userID, callType, onClose])

  const handleAnswer = async () => {
    if (!call) return
    try {
      await call.join()
      setCallStatus('connected')
      // Send answer through message
      await channel.sendMessage({
        text: `Call answered`,
        custom: {
          is_call: true,
          call_id: call.id,
          status: 'connected',
          participant_id: client.userID,
        } as CustomMessageData,
      })
    } catch (error) {
      console.error("Error answering call:", error)
      onClose()
    }
  }

  const handleDecline = async () => {
    if (call) {
      try {
        // Send decline through message
        await channel.sendMessage({
          text: `Call declined`,
          custom: {
            is_call: true,
            call_id: call.id,
            status: 'ended',
            participant_id: client.userID,
          } as CustomMessageData,
        })
        await call.leave()
      } catch (error) {
        console.error("Error declining call:", error)
      }
    }
    onClose()
  }

  const handleEndCall = async () => {
    if (call) {
      try {
        // Send end call through message
        await channel.sendMessage({
          text: `Call ended`,
          custom: {
            is_call: true,
            call_id: call.id,
            status: 'ended',
            participant_id: client.userID,
          } as CustomMessageData,
        })
        await call.leave()
      } catch (error) {
        console.error("Error ending call:", error)
      }
    }
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
          {isIncoming && callStatus === 'ringing' && `Incoming ${callType} call...`}
          {!isIncoming && callStatus === 'ringing' && `Calling...`}
          {callStatus === 'connected' && `Connected`}
          {callStatus === 'ended' && `Call ended`}
        </p>

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {isIncoming && callStatus === 'ringing' && (
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

          {callStatus === 'connected' && (
            <Button
              onClick={handleEndCall}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 h-16 w-16"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          )}

          {!isIncoming && callStatus === 'ringing' && (
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
  router,
}: {
  otherUser: any
  onBack: () => void
  channel: StreamChannel | null
  client: any
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
        type: "custom.call",
        custom: {
          call_type: callType,
          target_user: otherUser?.id,
        },
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
      if (event.type === "custom.call" && event.user?.id !== client?.user?.id) {
        setCallModal({
          isOpen: true,
          callType: event.custom?.call_type || "audio",
          isIncoming: true,
        })
      }
    }

    channel.on("custom.call" as any, handleCallEvent)

    return () => {
      channel.off("custom.call" as any, handleCallEvent)
    }
  }, [channel, client?.user?.id])

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
  const { client } = useChatContext()

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
            const isVideo = file.type.startsWith("video/")
            const isAudio = file.type.startsWith("audio/")

            try {
              // Use the appropriate upload method based on file type
              let response
              if (isImage) {
                response = await channel.sendImage(file, 'upload-' + file.name)
              } else {
                response = await channel.sendFile(file, 'upload-' + file.name)
              }

              // Return the correct attachment structure based on file type
              return {
                type: isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "file",
                asset_url: response.file,
                thumb_url: isImage ? response.file : undefined,
                title: file.name,
                file_size: file.size,
                mime_type: file.type,
                // For videos, add duration if available
                duration: isVideo && file instanceof File ? await getVideoDuration(file) : undefined,
              }
            } catch (uploadError) {
              console.error("Error uploading file:", uploadError)
              throw uploadError
            }
          })
        )

        messageData.attachments = streamAttachments
      }

      await channel.sendMessage(messageData)

      setText("")
      setAttachments([])
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.src = URL.createObjectURL(file)
    })
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
                <div key={index} className="relative bg-white rounded-lg p-2 border border-sky-100 shadow-sm">
                  <div className="flex items-center gap-2 max-w-[200px]">
                    {file.type.startsWith("image/") ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : file.type.startsWith("video/") ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden bg-sky-50 flex items-center justify-center">
                        <video
                          src={URL.createObjectURL(file)}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ) : file.type.startsWith("audio/") ? (
                      <div className="h-16 w-16 bg-sky-50 rounded flex items-center justify-center">
                        <Volume2 className="h-6 w-6 text-sky-500" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 bg-sky-50 rounded flex items-center justify-center">
                        <Paperclip className="h-6 w-6 text-sky-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sky-900 truncate">{file.name}</p>
                      <p className="text-xs text-sky-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
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

// Update the CustomMessageUI component
const CustomMessageUI = (props: MessageUIComponentProps) => {
  const { message } = props

  if (!message) {
    return null
  }

  // If there's text, we should show it
  const shouldRenderText = message.text?.trim()
  const hasAttachments = message.attachments && message.attachments.length > 0

  // If there are no attachments and no text, return null
  if (!hasAttachments && !shouldRenderText) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Render text if present */}
      {shouldRenderText && (
        <div className="text-sm">{message.text}</div>
      )}

      {/* Render attachments if present */}
      {hasAttachments && (
        <div className="flex flex-col gap-2">
          {(message.attachments || []).map((attachment: any, index: number) => {
            // For images
            if (attachment.type === "image" || attachment.image_url || attachment.thumb_url) {
              const imageUrl = attachment.image_url || attachment.asset_url || attachment.thumb_url
              return (
                <div key={index} className="relative group">
                  <img 
                    src={imageUrl} 
                    alt={attachment.title || "Image"} 
                    className="rounded-xl max-h-[300px] w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {attachment.title}
                  </div>
                </div>
              )
            }
            
            // For videos
            if (attachment.type === "video" || attachment.mime_type?.startsWith("video/")) {
              const videoUrl = attachment.asset_url
              return (
                <div key={index} className="relative group">
                  <video 
                    controls 
                    className="rounded-xl max-h-[300px] w-auto"
                    preload="metadata"
                  >
                    <source src={videoUrl} type={attachment.mime_type} />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {attachment.title}
                  </div>
                </div>
              )
            }
            
            // For audio
            if (attachment.type === "audio" || attachment.mime_type?.startsWith("audio/")) {
              return (
                <div key={index} className="bg-white/80 rounded-xl p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 bg-sky-50 rounded-lg flex items-center justify-center">
                      <Volume2 className="h-4 w-4 text-sky-500" />
                    </div>
                    <span className="text-sm font-medium text-sky-900">{attachment.title}</span>
                  </div>
                  <audio 
                    controls 
                    className="w-full"
                    preload="metadata"
                  >
                    <source src={attachment.asset_url} type={attachment.mime_type} />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )
            }
            
            // For other file types
            return (
              <div key={index} className="str-chat__message-attachment--file">
                <a 
                  href={attachment.asset_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/80 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <div className="h-10 w-10 bg-sky-50 rounded-lg flex items-center justify-center">
                    <Paperclip className="h-5 w-5 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sky-900 truncate">
                      {attachment.title}
                    </p>
                    <p className="text-xs text-sky-500">
                      {(attachment.file_size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      )}
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

// Add this helper function at the top of the file after imports
const findExistingChannel = async (client: any, otherUserId: string) => {
  try {
    // Query for DM channels with the other user
    const filter = {
      type: 'messaging',
      member_count: 2,
      members: { $in: [otherUserId] }
    }
    const sort = { last_message_at: -1 }
    const channels = await client.queryChannels(filter, sort, { limit: 1 })
    
    // Return the first channel if found
    return channels.length > 0 ? channels[0] : null
  } catch (error) {
    console.error('Error finding existing channel:', error)
    return null
  }
}

// Main DM Page Component
export default function DirectMessagePage() {
  const { client, isReady, error: streamError } = useStreamContext()
  const [channel, setChannel] = useState<StreamChannel | null>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
          <Channel channel={channel} Message={CustomMessageUI}>
            <Window>
              <DMChannelHeader
                otherUser={otherUser}
                onBack={handleBack}
                channel={channel}
                client={client}
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

      {/* Custom Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .str-chat {
              --str-chat__primary-color: #0ea5e9;
              --str-chat__active-color: #0284c7;
              --str-chat__disabled-color: #94a3b8;
              --str-chat__border-radius-circle: 9999px;
            }

            .str-chat__message-list {
              padding: 2rem;
              background: transparent;
            }
            
            .str-chat__message-list-scroll {
              height: 100%;
              padding-bottom: 0 !important;
            }
            
            .str-chat__message-simple {
              margin-bottom: 1.5rem;
              display: flex;
              flex-direction: column;
            }

            .str-chat__message-simple-wrapper {
              display: flex;
              align-items: flex-end;
              gap: 1rem;
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
            
            .str-chat__message-simple--me {
              align-items: flex-end;
            }

            .str-chat__message-simple--me .str-chat__message-simple-wrapper {
              flex-direction: row-reverse;
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
              color: #0f172a;
            }
            
            .str-chat__message-simple--me .str-chat__message-simple__text {
              color: white;
            }
            
            .str-chat__avatar {
              width: 2.5rem;
              height: 2.5rem;
              margin: 0;
              border: 2px solid rgba(14, 165, 233, 0.1);
              flex-shrink: 0;
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
              color: #64748b;
              margin-top: 0.5rem;
              font-weight: 500;
            }

            .str-chat__message-simple--me .str-chat__message-timestamp {
              color: #0ea5e9;
            }
            
            .str-chat__message-simple__status {
              margin-top: 0.5rem;
            }
            
            .str-chat__message-simple__status svg {
              width: 1rem;
              height: 1rem;
              color: #0ea5e9;
            }

            .str-chat__message-attachment {
              margin-top: 0.5rem;
            }

            .str-chat__message-attachment--image {
              border-radius: 1rem;
              overflow: hidden;
            }

            .str-chat__message-attachment--image img {
              border-radius: 1rem;
              transition: transform 0.2s;
            }

            .str-chat__message-attachment--image img:hover {
              transform: scale(1.02);
            }

            @media (max-width: 768px) {
              .str-chat__message-simple__content {
                max-width: 85%;
              }
              
              .str-chat__message-list {
                padding: 1rem;
              }
            }
          `
        }}
      />
    </div>
  )
}
