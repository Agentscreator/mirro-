"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Share2, Send, Play, Pause, Volume2, VolumeX, MoreHorizontal } from "lucide-react"
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

  // Enhanced touch handling for TikTok-like smooth transitions
  const [touchStart, setTouchStart] = useState<{ y: number; time: number } | null>(null)
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const minSwipeDistance = 30
  const swipeThreshold = 0.15 // 15% of screen height for easier swiping
  const dampingFactor = 0.7 // Damping for over-scroll effect

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
    const data = await fetchPosts(nextCursor || undefined, seenPostIds)

    if (data.posts.length > 0) {
      setPosts((prev) => [...prev, ...data.posts])
      setSeenPostIds((prev) => [...prev, ...data.posts.map((p: FeedPost) => p.id)])
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    }
    setLoadingMore(false)
  }, [fetchPosts, nextCursor, hasMore, loadingMore, seenPostIds])

  // Preload videos for smooth playback
  const preloadVideo = useCallback((post: FeedPost) => {
    if (post.video && !videoRefs.current[post.id]) {
      const video = document.createElement("video")
      video.src = post.video
      video.muted = true
      video.playsInline = true
      video.preload = "metadata"
      video.addEventListener("loadeddata", () => {
        videoRefs.current[post.id] = video
      })
    }
  }, [])

  useEffect(() => {
    if (session) {
      loadInitialPosts()
    }
  }, [session, loadInitialPosts])

  // Preload adjacent videos
  useEffect(() => {
    if (posts.length > 0) {
      // Preload current, next, and previous videos
      const indicesToPreload = [currentIndex - 1, currentIndex, currentIndex + 1].filter(
        (i) => i >= 0 && i < posts.length,
      )

      indicesToPreload.forEach((index) => {
        if (posts[index]) {
          preloadVideo(posts[index])
        }
      })
    }
  }, [posts, currentIndex, preloadVideo])

  // Enhanced video playback with smooth transitions
  useEffect(() => {
    const currentPost = posts[currentIndex]
    if (!currentPost) return

    // Pause all videos except current
    Object.entries(videoRefs.current).forEach(([postId, video]) => {
      if (video && Number.parseInt(postId) !== currentPost.id) {
        video.pause()
        video.currentTime = 0
      }
    })

    // Play current video
    if (currentPost.video && videoRefs.current[currentPost.id]) {
      const video = videoRefs.current[currentPost.id]

      if (isPlaying) {
        video.play().catch(console.error)
      }
      video.muted = isMuted
    }
  }, [currentIndex, posts, isPlaying, isMuted])

  // Enhanced touch handlers with TikTok-like feel
  const onTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return
    setTouchStart({
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    })
    setTouchCurrent(e.targetTouches[0].clientY)
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isTransitioning) return

    const currentY = e.targetTouches[0].clientY
    setTouchCurrent(currentY)

    const deltaY = currentY - touchStart.y
    const screenHeight = window.innerHeight

    // Apply damping for over-scroll effect
    let offset = deltaY

    // Add resistance when trying to scroll beyond bounds
    if ((currentIndex === 0 && deltaY > 0) || (currentIndex === posts.length - 1 && deltaY < 0)) {
      offset = deltaY * dampingFactor * 0.3 // Strong resistance at boundaries
    } else {
      offset = deltaY * dampingFactor
    }

    setSwipeOffset(offset)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchCurrent || isTransitioning) return

    const deltaY = touchCurrent - touchStart.y
    const screenHeight = window.innerHeight
    const swipeDistance = Math.abs(deltaY)
    const swipeVelocity = swipeDistance / (Date.now() - touchStart.time)

    // More sensitive swipe detection like TikTok
    const shouldNavigate =
      swipeDistance > minSwipeDistance && (Math.abs(deltaY) > screenHeight * swipeThreshold || swipeVelocity > 0.3)

    if (shouldNavigate) {
      setIsTransitioning(true)

      if (deltaY < 0 && currentIndex < posts.length - 1) {
        // Swipe up - next post
        setCurrentIndex((prev) => prev + 1)
        // Load more posts when near the end
        if (currentIndex >= posts.length - 3) {
          loadMorePosts()
        }
      } else if (deltaY > 0 && currentIndex > 0) {
        // Swipe down - previous post
        setCurrentIndex((prev) => prev - 1)
      }

      // Smooth transition to final position
      setTimeout(() => {
        setSwipeOffset(0)
        setIsTransitioning(false)
        setIsDragging(false)
      }, 400)
    } else {
      // Smooth snap back to original position
      setSwipeOffset(0)
      setTimeout(() => {
        setIsDragging(false)
      }, 300)
    }

    setTouchStart(null)
    setTouchCurrent(null)
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

  const renderPost = (post: FeedPost, index: number) => {
    const isActive = index === currentIndex
    const offset = (index - currentIndex) * window.innerHeight + swipeOffset

    // Calculate opacity and scale for smooth transitions
    const distance = Math.abs(index - currentIndex)
    const opacity = distance === 0 ? 1 : Math.max(0.3, 1 - distance * 0.3)
    const scale = distance === 0 ? 1 : Math.max(0.95, 1 - distance * 0.05)

    return (
      <div
        key={post.id}
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translateY(${offset}px) scale(${scale})`,
          transition: isTransitioning
            ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : isDragging
              ? "none"
              : "transform 0.3s ease-out",
          zIndex: isActive ? 10 : Math.max(1, 10 - distance),
          opacity,
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* Media */}
          {post.video ? (
            <video
              data-video-id={post.id}
              ref={(el) => {
                if (el) videoRefs.current[post.id] = el
              }}
              src={post.video}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={isMuted}
              onClick={() => setIsPlaying(!isPlaying)}
            />
          ) : post.image ? (
            <Image
              src={post.image || "/placeholder.svg"}
              alt="Post content"
              fill
              className="object-cover"
              priority={Math.abs(index - currentIndex) <= 1}
            />
          ) : null}

          {/* Video Controls - Only show on active post */}
          {post.video && isActive && (
            <div className="absolute bottom-32 left-4 flex gap-2">
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

          {/* User Info & Actions - Only show on active post */}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-end justify-between">
                {/* Left side - User info and content */}
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={
                          post.user.profileImage ||
                          post.user.image ||
                          "/placeholder.svg?height=40&width=40" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={post.user.username}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{post.user.nickname || post.user.username}</p>
                      <p className="text-gray-300 text-xs">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                  {post.content && <p className="text-white text-sm leading-relaxed mb-3 max-w-xs">{post.content}</p>}
                </div>

                {/* Right side - Action buttons */}
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleLike(post.id)}
                    className="text-white hover:bg-white/20 rounded-full flex flex-col h-auto py-2"
                  >
                    <Heart className={cn("h-6 w-6 mb-1", post.isLiked ? "fill-red-500 text-red-500" : "text-white")} />
                    <span className="text-xs">{post.likes}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleComment(post.id)}
                    className="text-white hover:bg-white/20 rounded-full flex flex-col h-auto py-2"
                  >
                    <MessageCircle className="h-6 w-6 mb-1" />
                    <span className="text-xs">{post.comments}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShare(post.id)}
                    className="text-white hover:bg-white/20 rounded-full flex flex-col h-auto py-2"
                  >
                    <Share2 className="h-6 w-6 mb-1" />
                    <span className="text-xs">Share</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/profile/${post.user.id}`)}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <MoreHorizontal className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
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
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Main Content Container */}
      <div
        ref={containerRef}
        className="h-full w-full relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Render visible posts (current, previous, next) */}
        {posts.slice(Math.max(0, currentIndex - 1), currentIndex + 2).map((post, relativeIndex) => {
          const actualIndex = Math.max(0, currentIndex - 1) + relativeIndex
          return renderPost(post, actualIndex)
        })}
      </div>

      {/* Loading indicator */}
      {loadingMore && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
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
                      <span className="font-medium text-sm text-gray-800">
                        {comment.user?.nickname || comment.user?.username}
                      </span>
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
                  className="min-h-[60px] rounded-lg border-blue-200 resize-none text-sm text-gray-800"
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
