import { cn } from "@/lib/utils"

export interface Tag {
  id: string
  name: string
  category: "interest" | "context" | "intention"
  color: string
}

interface TagDisplayProps {
  tags: Tag[]
  className?: string
  size?: "sm" | "md" | "lg"
}

export function TagDisplay({ tags, className, size = "md" }: TagDisplayProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <span key={tag.id} className={cn("rounded-full font-medium", tag.color, sizeClasses[size])}>
          {tag.name}
        </span>
      ))}
    </div>
  )
}
