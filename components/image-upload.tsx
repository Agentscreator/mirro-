"use client"

import type React from "react"

import { useRef } from "react"
import { ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ImageUploadProps {
  onImageChange: (file: File | null) => void
  imagePreview: string | null
}

export function ImageUpload({ onImageChange, imagePreview }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onImageChange(file)
  }

  const handleRemoveImage = () => {
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {!imagePreview ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      ) : (
        <div className="image-upload-preview rounded-xl overflow-hidden">
          <Image
            src={imagePreview || "/placeholder.svg"}
            alt="Preview"
            width={400}
            height={300}
            className="rounded-xl"
          />
          <div className="remove-button rounded-full" onClick={handleRemoveImage}>
            <X className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
