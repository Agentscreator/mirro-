"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FeedPost {
  id: number
  content: string
  image: string | null
  video: string | null
  createdAt: string
  user: {
    id: string
    username: string
    nickname?: string
    profileImage?: string
    image?: string
  }
  likes: number
  isLiked: boolean
  comments: number
}

interface Comment {
  id: number
  content: string
  createdAt: string
  userId: string
  user: {
    username: string
    nickname?: string
    profileImage?: string
  }
}

export default function FeedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [seenPostIds, setSeenPostIds] = useState<number[]>([])

  // Video controls
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({})

  // Comments
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const minSwipeDistance = 50

  const fetchPosts = useCallback(async (cursor?: string, excludeIds: number[] = []) => {
    try {
      const params = new URLSearchParams({
        limit: "10",
        ...(cursor && { cursor }),
        ...(excludeIds.length > 0 && { excludeIds: excludeIds.join(",") }),
      })

      const response = await fetch(`/api/feed?${params}`)
      if (!response.ok) throw new Error("Failed to fetch posts")

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      })
      return { posts: [], nextCursor: null, hasMore: false }
    }
  }, [])

  const loadInitialPosts = useCallback(async () => {
    setLoading(true)
    const data = await fetchPosts()
    setPosts(data.posts)
    setNextCursor(data.nextCursor)
    setHasMore(data.hasMore)
    setSeenPostIds(data.posts.map((p: FeedPost) => p.id))
    setLoading(false)
  }, [fetchPosts])

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)
    // Fix: Convert null to undefined for the cursor parameter
    const data = await fetchPosts(nextCursor ?? undefined, seenPostIds)

    if (data.posts.length > 0) {
      setPosts((prev) => [...prev, ...data.posts])
      setSeenPostIds((prev) => [...prev, ...data.posts.map((p: FeedPost) => p.id)])
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    }
    setLoadingMore(false)
  }, [fetchPosts, nextCursor, hasMore, loadingMore, seenPostIds])

  useEffect(() => {
    if (session) {
      loadInitialPosts()
    }
  }, [session, loadInitialPosts])

  // Handle video playback
  useEffect(() => {
    const currentPost = posts[currentIndex]
    if (!currentPost) return

    // Pause all videos
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.pause()
      }
    })

    // Play current video if it exists
    if (currentPost.video && videoRefs.current[currentPost.id]) {
      const video = videoRefs.current[currentPost.id]
      if (isPlaying) {
        video.play().catch(console.error)
      }
      video.muted = isMuted
    }
  }, [currentIndex, posts, isPlaying, isMuted])

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isUpSwipe = distance > minSwipeDistance
    const isDownSwipe = distance < -minSwipeDistance

    if (isUpSwipe && currentIndex < posts.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      // Load more posts when near the end
      if (currentIndex >= posts.length - 3) {
        loadMorePosts()
      }
    }

    if (isDownSwipe && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likes: updatedPost.likes, isLiked: updatedPost.isLiked } : post,
          ),
        )
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

  const handleShare = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/share`, {
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

  const fetchComments = async (postId: number) => {
    try {
      setCommentsLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleComment = async (postId: number) => {
    setShowComments(true)
    await fetchComments(postId)
  }

  const submitComment = async () => {
    if (!newComment.trim() || !posts[currentIndex]) return

    try {
      const response = await fetch(`/api/posts/${posts[currentIndex].id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        setNewComment("")
        await fetchComments(posts[currentIndex].id)
        toast({
          title: "Success",
          description: "Comment added successfully!",
        })
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
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
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No posts available</h2>
          <p className="text-gray-400 mb-4">Check back later for new content!</p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const currentPost = posts[currentIndex]

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-white font-semibold">Feed</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className="h-full w-full relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentPost && (
          <div className="h-full w-full relative flex items-center justify-center">
            {/* Media */}
            {currentPost.video ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current[currentPost.id] = el
                }}
                src={currentPost.video}
                className="h-full w-full object-cover"
                loop
                playsInline
                muted={isMuted}
                onClick={() => setIsPlaying(!isPlaying)}
              />
            ) : currentPost.image ? (
              <Image
                src={currentPost.image || "/placeholder.svg"}
                alt="Post content"
                fill
                className="object-cover"
                priority
              />
            ) : null}

            {/* Video Controls */}
            {currentPost.video && (
              <div className="absolute bottom-20 left-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            )}

            {/* User Info & Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-end justify-between">
                {/* Left side - User info and content */}
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={
                          currentPost.user.profileImage ||
                          currentPost.user.image ||
                          "/placeholder.svg?height=40&width=40"
                        }
                        alt={currentPost.user.username}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {currentPost.user.nickname || currentPost.user.username}
                      </p>
                      <p className="text-gray-300 text-xs">{formatDate(currentPost.createdAt)}</p>
                    </div>
                  </div>
                  {currentPost.content && (
                    <p className="text-white text-sm leading-relaxed mb-3 max-w-xs">{currentPost.content}</p>
                  )}
                </div>

                {/* Right side - Action buttons */}
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleLike(currentPost.id)}
                    className="text-white hover:bg-white/20 rounded-full flex flex-col h-auto py-2"
                  >
                    <Heart
                      className={cn("h-6 w-6 mb-1", currentPost.isLiked ? "fill-red-500 text-red-500" : "text-white")}
                    />
                    <span className="text-xs">{currentPost.likes}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleComment(currentPost.id)}
                    className="text-white hover:bg-white/20 rounded-full flex flex-col h-auto py-2"
                  >
                    <MessageCircle className="h-6 w-6 mb-1" />
                    <span className="text-xs">{currentPost.comments}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShare(currentPost.id)}
                    className="text-white hover:bg-white/20 rounded-full flex flex-col h-auto py-2"
                  >
                    <Share2 className="h-6 w-6 mb-1" />
                    <span className="text-xs">Share</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/profile/${currentPost.user.id}`)}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <MoreHorizontal className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
              {posts.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, idx) => {
                const actualIndex = Math.max(0, currentIndex - 2) + idx
                return (
                  <div
                    key={actualIndex}
                    className={cn(
                      "w-1 h-8 rounded-full transition-all",
                      actualIndex === currentIndex ? "bg-white" : "bg-white/30",
                    )}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loadingMore && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="w-[95vw] max-w-md h-[70vh] p-0 bg-white rounded-t-2xl fixed bottom-0 left-1/2 transform -translate-x-1/2">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-center">Comments</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                    <Image
                      src={comment.user?.profileImage || "/placeholder.svg?height=32&width=32"}
                      alt={comment.user?.username || "User"}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.user?.nickname || comment.user?.username}</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No comments yet</p>
                <p className="text-sm text-gray-400">Be the first to comment!</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                <Image
                  src={session?.user?.image || "/placeholder.svg?height=32&width=32"}
                  alt="Your avatar"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] rounded-lg border-blue-200 resize-none text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={submitComment}
                    disabled={!newComment.trim()}
                    size="sm"
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}