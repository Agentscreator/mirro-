"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageAttachmentsList } from "./message-attachments-list"
import { useMessageContext } from "stream-chat-react"

export function CustomMessage() {
  const {
    message,
    isMyMessage,
    handleOpenThread,
    handleReaction,
    handleAction,
    handleRetry,
    handleDelete,
    handleFlag,
    handleMute,
    handleEdit,
    getMessageActions,
  } = useMessageContext()

  const [showActions, setShowActions] = useState(false)

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Check if message has attachments
  const hasAttachments = message.attachments && message.attachments.length > 0

  return (
    <div
      className={`flex ${isMyMessage() ? "justify-end" : "justify-start"} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isMyMessage() && (
        <Avatar className="h-8 w-8 mr-2 mt-1">
          <AvatarImage src={message.user?.image || "/placeholder.svg"} />
          <AvatarFallback className="bg-sky-100 text-sky-500">
            {message.user?.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[70%] ${isMyMessage() ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isMyMessage()
              ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white"
              : "bg-white border border-sky-100 shadow-sm"
          }`}
        >
          {message.text && <p className="text-sm">{message.text}</p>}

          {/* Render attachments if present */}
          {hasAttachments && <MessageAttachmentsList attachments={message.attachments || []} />}
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <span>{formatTime(new Date(message.created_at || Date.now()))}</span>

          {/* Show read status for my messages */}
          {isMyMessage() && <span className="text-sky-500">{message.status === "read" ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  )
}
