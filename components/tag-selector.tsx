"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type TagCategory = "interest" | "context" | "intention"

export interface Tag {
  id: string
  name: string
  category: TagCategory
  color: string
}

interface TagSelectorProps {
  tags: Tag[]
  selectedTags: string[]
  onChange: (selectedTags: string[]) => void
  maxSelections?: number
  category?: TagCategory
}

export function TagSelector({ tags, selectedTags, onChange, maxSelections = 5, category }: TagSelectorProps) {
  const [error, setError] = useState<string | null>(null)

  const filteredTags = category ? tags.filter((tag) => tag.category === category) : tags

  const handleTagClick = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      // Remove tag if already selected
      onChange(selectedTags.filter((id) => id !== tagId))
      setError(null)
    } else {
      // Add tag if not at max selections
      if (selectedTags.length >= maxSelections) {
        setError(`You can only select up to ${maxSelections} tags`)
        return
      }
      onChange([...selectedTags, tagId])
      setError(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
        {filteredTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagClick(tag.id)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-all tag-hover",
                isSelected ? tag.color : "bg-gray-100 hover:bg-gray-200 text-gray-800",
                tag.category === "intention" && isSelected ? "tag-gradient" : "",
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {tag.name}
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Selected {selectedTags.length}/{maxSelections}
      </p>
    </div>
  )
}
