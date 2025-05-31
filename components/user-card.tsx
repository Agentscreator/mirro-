"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedText } from "@/components/animated-text"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface UserCardProps {
  user: {
    id: string | number
    username: string
    image: string
    profileImage?: string
    reason?: string
    tags: string[]
  }
  onMessage?: (userId: string | number) => void
  onViewProfile?: () => void
  isMessaging?: boolean
}

export function UserCard({ user, onMessage, onViewProfile, isMessaging = false }: UserCardProps) {
  const [imageError, setImageError] = useState(false)
  const [gifError, setGifError] = useState(false)
  const router = useRouter()
  const usernameInitial = user.username.charAt(0).toUpperCase()

  // Direct MP4 URL from Gifer - using MP4 instead of GIF for better performance
  const DEFAULT_ANIMATED_BG = "https://i.gifer.com/RtKg.mp4"

  // Debug logging
  console.log("UserCard received user:", user.username, "image:", user.image, "profileImage:", user.profileImage)

  // Function to get the best available image URL
  const getBestImageUrl = (user: { image?: string | null; profileImage?: string | null }): string | null => {
    // Priority: profileImage > image > null
    if (user.profileImage && user.profileImage.trim() && !user.profileImage.includes('placeholder')) {
      return user.profileImage
    }
    if (user.image && user.image.trim() && !user.image.includes('placeholder')) {
      return user.image
    }
    return null
  }

  const handleMessage = () => {
    console.log("Message button clicked for user:", user.id, user.username)
    
    if (onMessage) {
      // Call the provided onMessage callback with the user ID
      onMessage(user.id)
    } else {
      // Default behavior: navigate to the message page
      // Ensure we're using the correct user ID
      const targetUserId = user.id
      console.log("Navigating to message page with userId:", targetUserId)
      router.push(`/messages/${targetUserId}`)
    }
  }

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile()
    }
  }

  const handleImageError = () => {
    console.log("Image failed to load for user:", user.username, "URL:", imageUrl)
    setImageError(true)
  }

  const handleGifError = () => {
    console.log("GIF failed to load for user:", user.username)
    setGifError(true)
  }

  // Get the actual image URL to use
  const imageUrl = getBestImageUrl(user)

  // Improved fallback logic:
  // 1. Show profile/image if available and no error
  // 2. Show animated GIF with initial overlay if primary image fails but GIF loads
  // 3. Show static colored background with initial if both fail
  const shouldShowPrimaryImage = imageUrl && !imageError
  const shouldShowGifFallback = !shouldShowPrimaryImage && !gifError
  const shouldShowStaticFallback = !shouldShowPrimaryImage && gifError

  console.log("Image display logic for", user.username, ":", {
    imageUrl,
    imageError,
    gifError,
    shouldShowPrimaryImage,
    shouldShowGifFallback,
    shouldShowStaticFallback
  })

  return (
    <Card className="border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
          <div className="relative mx-auto mb-4 h-20 w-20 flex-shrink-0 overflow-hidden rounded-full shadow-md border-2 border-blue-200 sm:mx-0 sm:mb-0 sm:h-16 sm:w-16">
            {shouldShowPrimaryImage ? (
              <Image
                src={imageUrl!}
                alt={user.username}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 64px"
                onError={handleImageError}
                priority={false}
                unoptimized={imageUrl?.startsWith('http') && !imageUrl.includes('localhost')} // Handle external URLs
              />
            ) : shouldShowGifFallback ? (
              <div className="relative w-full h-full">
                <video
                  src={DEFAULT_ANIMATED_BG}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={handleGifError}
                />
                {/* Initial overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xl font-bold drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    {usernameInitial}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xl font-semibold">
                {usernameInitial}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-center text-xl font-semibold text-blue-600 sm:mb-0 sm:text-left">
              @{user.username}
            </h3>
            {user.reason && (
              <div className="mt-2">
                <h4 className="font-medium text-blue-600 text-center sm:text-left">The Thread Between You:</h4>
                <div className="mt-1">
                  <AnimatedText text={user.reason} delay={500} speed={20} />
                </div>
              </div>
            )}
            {user.tags.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-blue-600 text-center sm:text-left">Tags:</h4>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {user.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      className="rounded-full font-medium text-xs px-2 py-0.5 tag-hover bg-blue-50 text-blue-600 border-blue-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-center sm:justify-end items-center gap-2">
              <Button 
                onClick={handleMessage}
                disabled={isMessaging}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 disabled:opacity-50"
              >
                {isMessaging ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                <span>Message</span>
              </Button>
              <Button
                onClick={handleViewProfile}
                variant="outline"
                className="rounded-full border-blue-200 hover:bg-blue-50 flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}