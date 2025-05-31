import { MessageAttachment } from "./message-attachment"

interface MessageAttachmentsListProps {
  attachments: any[]
}

export function MessageAttachmentsList({ attachments }: MessageAttachmentsListProps) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="space-y-2 mt-1">
      {attachments.map((attachment, index) => (
        <MessageAttachment key={index} attachment={attachment} />
      ))}
    </div>
  )
}
