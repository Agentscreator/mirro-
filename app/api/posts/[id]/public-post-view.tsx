"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Post {
  id: number
  content: string
  createdAt: string
  image: string | null
  video: string | null
  likes: number
  comments: number
  user: {
    id: string
    username: string
    nickname?: string
    profileImage?: string
  }
}

interface PublicPostViewProps {
  postId: string
}

export default function PublicPostView({ postId }: PublicPostViewProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/public`)

        if (response.ok) {
          const postData = await response.json()
          setPost(postData)
        } else if (response.status === 404) {
          setError("Post not found")
        } else {
          setError("Failed to load post")
        }
      } catch (err) {
        console.error("Error fetching post:", err)
        setError("Failed to load post")
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  const handleShare = async () => {
    const shareUrl = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post?.user?.nickname || post?.user?.username || "User"}'s Post`,
          text: post?.content || "Check out this post!",
          url: shareUrl,
        })
        return
      } catch (shareError) {
        console.log("Native share failed, falling back to clipboard")
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied!",
        description: "Post link has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Share",
        description: `Copy this link: ${shareUrl}`,
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || "Post not found"}</h2>
            <p className="text-gray-600 mb-4">This post may have been deleted or is no longer available.</p>
            <Button onClick={() => (window.location.href = "/")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image
                src={post.user.profileImage || "/placeholder.svg?height=32&width=32"}
                alt={post.user.username}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{post.user.nickname || post.user.username}</p>
              <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <Button onClick={handleShare} variant="outline" size="sm" className="rounded-full">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Media */}
            {post.video ? (
              <div className="relative bg-black">
                <video
                  src={post.video}
                  className="w-full max-h-[70vh] object-contain"
                  controls
                  playsInline
                  poster={post.image || undefined}
                />
              </div>
            ) : post.image ? (
              <div className="relative">
                <Image
                  src={post.image || "/placeholder.svg"}
                  alt="Post content"
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain max-h-[70vh]"
                />
              </div>
            ) : null}

            {/* Content and Actions */}
            <div className="p-6">
              {post.content && <p className="text-gray-900 text-lg leading-relaxed mb-4">{post.content}</p>}

              {/* Stats */}
              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  <span className="font-medium">{post.likes}</span>
                  <span>likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">{post.comments}</span>
                  <span>comments</span>
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-gray-700 mb-3">Want to like, comment, or see more posts like this?</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => (window.location.href = "/auth/signin")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/auth/signup")}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
