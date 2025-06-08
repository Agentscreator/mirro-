"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Send, Edit, Trash2 } from "lucide-react"
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
  userId: string
  user: {
    username: string
    nickname?: string
    profileImage?: string
  }
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
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isPostDetailOpen, setIsPostDetailOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set())
  const [mutedVideos, setMutedVideos] = useState<Set<number>>(new Set())
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [editCommentContent, setEditCommentContent] = useState("")
  const [isEditCommentDialogOpen, setIsEditCommentDialogOpen] = useState(false)

  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  const fetchFeedPosts = useCallback(async () => {
    try {
      setLoading(true)
      console.log("=== FETCHING FEED POSTS ===")

      const response = await fetch("/api/posts?feed=true")
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        console.log("✅ Feed posts loaded:", data.posts?.length || 0)
      } else {
        throw new Error("Failed to fetch feed posts")
      }
    } catch (error) {
      console.error("❌ Error fetching feed:", error)
      toast({
        title: "Error",
        description: "Failed to load feed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchComments = async (postId: number) => {
    try {
      setCommentsLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      } else {
        setComments([])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const handlePostClick = async (post: Post) => {
    setSelectedPost(post)
    setIsPostDetailOpen(true)
    await fetchComments(post.id)
  }

  const handleLikePost = async (postId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes: updatedPost.likes, isLiked: updatedPost.isLiked } : post,
          ),
        )

        // Update selected post if it's the same
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) => (prev ? { ...prev, likes: updatedPost.likes, isLiked: updatedPost.isLiked } : null))
        }
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

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedPost) return

    try {
      const response = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments([newCommentData, ...comments])
        setNewComment("")

        // Update comment count
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === selectedPost.id ? { ...post, comments: post.comments + 1 } : post)),
        )

        if (selectedPost) {
          setSelectedPost({ ...selectedPost, comments: selectedPost.comments + 1 })
        }

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

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment)
    setEditCommentContent(comment.content)
    setIsEditCommentDialogOpen(true)
  }

  const handleSaveCommentEdit = async () => {
    if (!editingComment || !editCommentContent.trim()) return

    try {
      const response = await fetch(`/api/posts/${selectedPost?.id}/comments?commentId=${editingComment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editCommentContent.trim() }),
      })

      if (response.ok) {
        const updatedComment = await response.json()
        setComments((prevComments) =>
          prevComments.map((comment) => (comment.id === editingComment.id ? updatedComment : comment)),
        )

        setIsEditCommentDialogOpen(false)
        setEditingComment(null)
        setEditCommentContent("")

        toast({
          title: "Success",
          description: "Comment updated successfully!",
        })
      }
    } catch (error) {
      console.error("Error updating comment:", error)
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/posts/${selectedPost?.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId))

        // Update comment count
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === selectedPost?.id ? { ...post, comments: Math.max(0, post.comments - 1) } : post,
          ),
        )

        if (selectedPost) {
          setSelectedPost({ ...selectedPost, comments: Math.max(0, selectedPost.comments - 1) })
        }

        toast({
          title: "Success",
          description: "Comment deleted successfully!",
        })
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSharePost = async (postId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }

    try {
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
      })

      if (response.ok) {
        const shareData = await response.json()

        if (navigator.share) {
          try {
            await navigator.share({
              title: shareData.title,
              text: shareData.text,
              url: shareData.url,
            })
            return
          } catch (shareError) {
            // Fallback to clipboard
          }
        }

        await navigator.clipboard.writeText(shareData.url)
        toast({
          title: "Link Copied!",
          description: "Post link has been copied to your clipboard.",
        })
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

  const toggleVideoPlay = (postId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }

    const video = videoRefs.current[postId]
    if (video) {
      if (video.paused) {
        video.play()
        setPlayingVideos((prev) => new Set([...prev, postId]))
      } else {
        video.pause()
        setPlayingVideos((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      }
    }
  }

  const toggleVideoMute = (postId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }

    const video = videoRefs.current[postId]
    if (video) {
      video.muted = !video.muted
      if (video.muted) {
        setMutedVideos((prev) => new Set([...prev, postId]))
      } else {
        setMutedVideos((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  // Auto-play videos when they come into view
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = Number(entry.target.getAttribute("data-post-id"))
          const video = videoRefs.current[postId]

          if (video) {
            if (entry.isIntersecting) {
              video.play()
              setPlayingVideos((prev) => new Set([...prev, postId]))
            } else {
              video.pause()
              setPlayingVideos((prev) => {
                const newSet = new Set(prev)
                newSet.delete(postId)
                return newSet
              })
            }
          }
        })
      },
      { threshold: 0.5 },
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchFeedPosts()
    }
  }, [session, fetchFeedPosts])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-black">
      {/* Feed Posts */}
      <div className="space-y-0">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="relative h-screen w-full bg-black cursor-pointer"
            onClick={() => handlePostClick(post)}
          >
            {/* Media Content */}
            <div className="absolute inset-0">
              {post.video ? (
                <div className="relative h-full w-full" data-post-id={post.id}>
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current[post.id] = el
                        if (observerRef.current) {
                          observerRef.current.observe(el)
                        }
                      }
                    }}
                    src={post.video}
                    className="h-full w-full object-cover"
                    loop
                    muted={mutedVideos.has(post.id)}
                    playsInline
                  />
                  {/* Video Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => toggleVideoPlay(post.id, e)}
                      className="bg-black/50 text-white hover:bg-black/70 rounded-full h-10 w-10"
                    >
                      {playingVideos.has(post.id) ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => toggleVideoMute(post.id, e)}
                      className="bg-black/50 text-white hover:bg-black/70 rounded-full h-10 w-10"
                    >
                      {mutedVideos.has(post.id) ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              ) : post.image ? (
                <Image src={post.image || "/placeholder.svg"} alt="Post content" fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <p className="text-white text-xl font-medium text-center px-8">{post.content}</p>
                </div>
              )}
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              {/* User Info */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={post.user.profileImage || "/placeholder.svg?height=40&width=40"}
                    alt={post.user.username}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <p className="text-white font-semibold">{post.user.nickname || post.user.username}</p>
                  <p className="text-white/70 text-sm">{formatDate(post.createdAt)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute bottom-20 right-4 flex flex-col gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleLikePost(post.id, e)}
                  className="bg-black/50 text-white hover:bg-black/70 rounded-full h-12 w-12"
                >
                  <Heart className={cn("h-6 w-6", post.isLiked && "fill-red-500 text-red-500")} />
                </Button>
                <span className="text-white text-sm text-center">{post.likes}</span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePostClick(post)
                  }}
                  className="bg-black/50 text-white hover:bg-black/70 rounded-full h-12 w-12"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <span className="text-white text-sm text-center">{post.comments}</span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleSharePost(post.id, e)}
                  className="bg-black/50 text-white hover:bg-black/70 rounded-full h-12 w-12"
                >
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>

              {/* Content */}
              {(post.image || post.video) && post.content && (
                <div className="absolute bottom-4 left-4 right-20">
                  <p className="text-white text-sm leading-relaxed">{post.content}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={isPostDetailOpen} onOpenChange={setIsPostDetailOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-black border-gray-800">
          <DialogHeader className="sr-only">
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="flex h-full">
              {/* Media Side */}
              <div className="flex-1 relative bg-black">
                {selectedPost.video ? (
                  <video src={selectedPost.video} className="h-full w-full object-contain" controls autoPlay loop />
                ) : selectedPost.image ? (
                  <Image
                    src={selectedPost.image || "/placeholder.svg"}
                    alt="Post content"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <p className="text-white text-2xl font-medium text-center px-8">{selectedPost.content}</p>
                  </div>
                )}
              </div>

              {/* Comments Side */}
              <div className="w-96 bg-white flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={selectedPost.user.profileImage || "/placeholder.svg?height=40&width=40"}
                      alt={selectedPost.user.username}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedPost.user.nickname || selectedPost.user.username}</p>
                    <p className="text-sm text-gray-500">{formatDate(selectedPost.createdAt)}</p>
                  </div>
                </div>

                {/* Content */}
                {(selectedPost.image || selectedPost.video) && selectedPost.content && (
                  <div className="p-4 border-b">
                    <p className="text-gray-800">{selectedPost.content}</p>
                  </div>
                )}

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {commentsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={comment.user?.profileImage || "/placeholder.svg?height=32&width=32"}
                            alt={comment.user?.username || "User"}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {comment.user?.nickname || comment.user?.username}
                              </span>
                              <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                            </div>
                            {comment.userId === session?.user?.id && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditComment(comment)}
                                  className="h-6 w-6 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                  title="Edit comment"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No comments yet</p>
                      <p className="text-xs text-gray-400">Be the first to comment!</p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="p-4 border-t">
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
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim()}
                          size="sm"
                          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Comment Dialog */}
      <Dialog open={isEditCommentDialogOpen} onOpenChange={setIsEditCommentDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Edit Comment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editCommentContent}
              onChange={(e) => setEditCommentContent(e.target.value)}
              className="min-h-[100px] rounded-xl border-blue-200 resize-none"
              placeholder="Edit your comment..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCommentDialogOpen(false)
                setEditingComment(null)
                setEditCommentContent("")
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCommentEdit}
              disabled={!editCommentContent.trim()}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {posts.length === 0 && (
        <div className="flex items-center justify-center h-screen text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-gray-400">Check back later for new content!</p>
          </div>
        </div>
      )}
    </div>
  )
}
