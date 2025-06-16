"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Post {
  id: number
  content: string
  createdAt: string
  image: string | null
  video: string | null
  likes: number
  comments: number
  isLiked?: boolean
  user: {
    id: string
    username: string
    nickname?: string
    profileImage?: string
    image?: string
  }
}

export default function SharedPostPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postId = params?.id
        if (!postId) {
          router.push("/feed")
          return
        }

        const response = await fetch(`/api/posts/${postId}`)
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Post not found",
              description: "This post may have been deleted or is not available.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: "Failed to load post. Please try again.",
              variant: "destructive",
            })
          }
          router.push("/feed")
          return
        }

        const data = await response.json()
        setPost(data)
      } catch (error) {
        console.error("Error fetching post:", error)
        toast({
          title: "Error",
          description: "Failed to load post. Please try again.",
          variant: "destructive",
        })
        router.push("/feed")
      } finally {
        setLoading(false)
      }
    }

    if (status !== "loading") {
      fetchPost()
    }
  }, [params?.id, router, status])

  const handleLike = async () => {
    if (!post) return

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setPost((prev) => (prev ? { ...prev, likes: data.likes, isLiked: data.isLiked } : null))
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (!post) return

    try {
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: "POST",
      })

      if (response.ok) {
        const shareData = await response.json()

        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          try {
            await navigator.share({
              title: shareData.title,
              text: shareData.text,
              url: shareData.url,
            })
            return
          } catch (shareError) {
            console.log("Native share failed, falling back to clipboard")
          }
        }

        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareData.url)
          toast({
            title: "Link Copied!",
            description: "Post link has been copied to your clipboard.",
          })
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea")
          textArea.value = shareData.url
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          try {
            document.execCommand("copy")
            toast({
              title: "Link Copied!",
              description: "Post link has been copied to your clipboard.",
            })
          } catch (err) {
            toast({
              title: "Share",
              description: `Copy this link: ${shareData.url}`,
            })
          }
          document.body.removeChild(textArea)
        }
      }
    } catch (error) {
      console.error("Error sharing post:", error)
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto h-screen flex flex-col sm:flex-row">
        {/* Media Section */}
        <div className="relative flex-1 flex items-center justify-center">
          {post.video ? (
            <div className="relative w-full h-full">
              <video
                src={post.video}
                className="w-full h-full object-contain"
                controls
                autoPlay
                loop
                playsInline
              />
            </div>
          ) : post.image ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image
                src={post.image}
                alt="Post content"
                width={800}
                height={600}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 max-w-md">
                <p className="text-white text-xl font-medium text-center leading-relaxed">{post.content}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="w-full sm:w-96 bg-black border-l border-gray-800 flex flex-col">
          {/* User Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image
                  src={post.user.profileImage || post.user.image || "/placeholder.svg"}
                  alt={post.user.username}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{post.user.nickname || post.user.username}</p>
                <p className="text-gray-400 text-xs">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            {post.content && <p className="text-white text-sm mt-3 leading-relaxed">{post.content}</p>}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-800 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className="text-white hover:bg-white/10 rounded-full flex items-center gap-2"
                >
                  <Heart className={cn("h-5 w-5", post.isLiked ? "fill-red-500 text-red-500" : "text-white")} />
                  <span className="text-sm">{post.likes}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/profile/${post.user.id}`)}
                  className="text-white hover:bg-white/10 rounded-full flex items-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm">{post.comments}</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 