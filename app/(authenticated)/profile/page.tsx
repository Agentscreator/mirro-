"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Edit,
  Send,
  Heart,
  MessageCircle,
  Share2,
  Users,
  UserPlus,
  Camera,
  Check,
  Eye,
  Plus,
  Trash2,
  X,
  Play,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { HamburgerMenu } from "@/components/hamburger-menu"

const MAX_TOTAL_CHARS = 8000
const MAX_THOUGHT_CHARS = 1000

interface Post {
  id: number
  content: string
  createdAt: string
  image: string | null
  video: string | null
  likes: number
  comments: number
  isLiked?: boolean
}

interface ProfileUser {
  id: string
  username: string
  nickname?: string
  metro_area?: string
  followers?: number
  following?: number
  visitors?: number
  profileImage?: string
  about?: string
  image?: string
}

interface FollowUser {
  id: string
  username: string
  nickname?: string
  profileImage?: string
  image?: string
}

interface Thought {
  id: number
  title: string
  content: string
  createdAt: string
  userId: string
  user?: {
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
  parentCommentId?: number | null
  user: {
    username: string
    nickname?: string
    profileImage?: string
  }
  replies?: Comment[]
}

export default function ProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const userId = params?.userId as string
  const isOwnProfile = !userId || userId === session?.user?.id

  const [user, setUser] = useState<ProfileUser | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [thoughtsLoading, setThoughtsLoading] = useState(false)
  const [profileImageUploading, setProfileImageUploading] = useState(false)
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [editedAbout, setEditedAbout] = useState("")
  const [isFollowersDialogOpen, setIsFollowersDialogOpen] = useState(false)
  const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  // Post creation states
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)
  const [postContent, setPostContent] = useState("")
  const [isMediaTypeDialogOpen, setIsMediaTypeDialogOpen] = useState(false)

  // Post viewing states
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isPostViewOpen, setIsPostViewOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Reply states
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())

  // Post editing states
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editingPostContent, setEditingPostContent] = useState("")
  const [editingPostMedia, setEditingPostMedia] = useState<string | null>(null)
  const [editingPostMediaType, setEditingPostMediaType] = useState<"image" | "video" | null>(null)
  const [newEditMedia, setNewEditMedia] = useState<File | null>(null)
  const [removeEditMedia, setRemoveEditMedia] = useState(false)
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false)

  // Thoughts/Notes states
  const [newThought, setNewThought] = useState({
    title: "",
    content: "",
  })
  const [editingThought, setEditingThought] = useState<null | Thought>(null)
  const [isAddThoughtDialogOpen, setIsAddThoughtDialogOpen] = useState(false)
  const [isEditThoughtDialogOpen, setIsEditThoughtDialogOpen] = useState(false)

  const cacheKey = `posts-${userId || session?.user?.id}`

  const fetchPosts = useCallback(
    async (targetUserId: string, forceRefresh = false) => {
      try {
        setPostsLoading(true)
        console.log("=== FRONTEND FETCH POSTS DEBUG START ===")
        console.log("Target user ID:", targetUserId)
        console.log("Force refresh:", forceRefresh)

        // Always fetch fresh data for own profile
        const apiUrl = `/api/posts?userId=${targetUserId}&t=${Date.now()}`
        const postsResponse = await fetch(apiUrl)

        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          const newPosts = postsData.posts || []
          setPosts(newPosts)
          console.log("✅ Successfully fetched posts:", newPosts.length)
        } else {
          throw new Error("Failed to fetch posts")
        }
      } catch (error: any) {
        console.error("❌ Error fetching posts:", error)
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again.",
          variant: "destructive",
        })
      } finally {
        setPostsLoading(false)
      }
    },
    [],
  )

  const fetchThoughts = useCallback(async (targetUserId: string) => {
    try {
      setThoughtsLoading(true)
      console.log("=== FETCHING THOUGHTS DEBUG ===")
      console.log("Target user ID:", targetUserId)

      const response = await fetch(`/api/thoughts?userId=${targetUserId}`)
      console.log("Thoughts response status:", response.status)

      if (response.ok) {
        const thoughtsData = await response.json()
        console.log("Thoughts fetched:", thoughtsData.length)
        setThoughts(thoughtsData)
      } else {
        console.error("Failed to fetch thoughts")
        setThoughts([])
      }
    } catch (error) {
      console.error("Error fetching thoughts:", error)
      setThoughts([])
    } finally {
      setThoughtsLoading(false)
    }
  }, [])

  const fetchFollowers = async (targetUserId: string) => {
    try {
      const response = await fetch(`/api/users/${targetUserId}/followers`)
      if (response.ok) {
        const data = await response.json()
        setFollowers(data.followers || [])
      }
    } catch (error) {
      console.error("❌ Error fetching followers:", error)
    }
  }

  const fetchFollowing = async (targetUserId: string) => {
    try {
      const response = await fetch(`/api/users/${targetUserId}/following`)
      if (response.ok) {
        const data = await response.json()
        setFollowing(data.following || [])
      }
    } catch (error) {
      console.error("❌ Error fetching following:", error)
    }
  }

  // Helper function to organize comments into nested structure
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>()
    const topLevelComments: Comment[] = []

    // First pass: create map of all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into hierarchy
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!

      if (comment.parentCommentId) {
        // This is a reply
        const parentComment = commentMap.get(comment.parentCommentId)
        if (parentComment) {
          parentComment.replies!.push(commentWithReplies)
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentWithReplies)
      }
    })

    return topLevelComments
  }

  const fetchComments = async (postId: number) => {
    try {
      setCommentsLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        const organizedComments = organizeComments(data.comments || [])
        setComments(organizedComments)
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const targetUserId = userId || session?.user?.id

        if (!targetUserId) return

        // Fetch profile
        const response = await fetch(`/api/users/profile/${targetUserId}`)
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setEditedAbout(data.user.about || "")
        }

        // Fetch posts and thoughts
        await Promise.all([fetchPosts(targetUserId), fetchThoughts(targetUserId)])

        // Fetch follow status if not own profile
        if (!isOwnProfile) {
          const followResponse = await fetch(`/api/users/${targetUserId}/follow-status`)
          if (followResponse.ok) {
            const followData = await followResponse.json()
            setIsFollowing(followData.isFollowing)
          }

          // Record visit
          await fetch(`/api/users/${targetUserId}/visit`, { method: "POST" })
        }
      } catch (error: any) {
        console.error("❌ Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchProfile()
    }
  }, [userId, session, isOwnProfile, fetchPosts, fetchThoughts])

  // Media handling for post creation
  const handleMediaTypeSelect = (type: "image" | "video") => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = type === "image" ? "image/*" : "video/*"
    input.onchange = (event) => {
      const syntheticEvent = {
        target: event.target,
        currentTarget: event.target,
      } as React.ChangeEvent<HTMLInputElement>
      handleMediaSelect(syntheticEvent)
    }
    input.click()
    setIsMediaTypeDialogOpen(false)
  }

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({
        title: "Error",
        description: "Please select an image or video file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size
    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `File too large. Max size: ${file.type.startsWith("video/") ? "50MB for videos" : "10MB for images"}`,
        variant: "destructive",
      })
      return
    }

    setSelectedMedia(file)
    setMediaType(file.type.startsWith("video/") ? "video" : "image")

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setIsCreatePostDialogOpen(true)
  }

  const handleCreatePost = async () => {
    if (!selectedMedia && !postContent.trim()) return

    try {
      const formData = new FormData()
      formData.append("content", postContent.trim())
      if (selectedMedia) {
        formData.append("media", selectedMedia)
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newPostData = await response.json()
        sessionStorage.removeItem(cacheKey)

        const updatedPosts = [newPostData, ...posts]
        setPosts(updatedPosts)

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedPosts,
            timestamp: Date.now(),
          }),
        )

        // Reset form
        setSelectedMedia(null)
        setMediaPreview(null)
        setMediaType(null)
        setPostContent("")
        setIsCreatePostDialogOpen(false)

        toast({
          title: "Success",
          description: "Post created successfully!",
        })
      } else {
        throw new Error("Failed to create post")
      }
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePostClick = async (post: Post) => {
    setSelectedPost(post)
    setIsPostViewOpen(true)
    await fetchComments(post.id)
  }

  const handleLikePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const updatedPost = await response.json()
        const updatedPosts = posts.map((post) =>
          post.id === postId ? { ...post, likes: updatedPost.likes, isLiked: updatedPost.isLiked } : post,
        )
        setPosts(updatedPosts)

        // Update selected post if it's the same
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) => (prev ? { ...prev, likes: updatedPost.likes, isLiked: updatedPost.isLiked } : null))
        }

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedPosts,
            timestamp: Date.now(),
          }),
        )
      } else {
        throw new Error("Failed to like post")
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

  const handleSubmitComment = async (parentCommentId?: number) => {
    const content = parentCommentId ? replyContent : newComment
    if (!content.trim() || !selectedPost) return

    try {
      const response = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          parentCommentId: parentCommentId || null,
        }),
      })

      if (response.ok) {
        const newCommentData = await response.json()

        // Refresh comments to get updated nested structure
        await fetchComments(selectedPost.id)

        // Reset form
        if (parentCommentId) {
          setReplyContent("")
          setReplyingTo(null)
        } else {
          setNewComment("")
        }

        // Update comment count
        const updatedPosts = posts.map((post) =>
          post.id === selectedPost.id ? { ...post, comments: post.comments + 1 } : post,
        )
        setPosts(updatedPosts)

        if (selectedPost) {
          setSelectedPost({ ...selectedPost, comments: selectedPost.comments + 1 })
        }

        toast({
          title: "Success",
          description: parentCommentId ? "Reply added successfully!" : "Comment added successfully!",
        })
      } else {
        throw new Error("Failed to add comment")
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

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/posts/${selectedPost?.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh comments to get updated nested structure
        await fetchComments(selectedPost!.id)

        const updatedPosts = posts.map((post) =>
          post.id === selectedPost?.id ? { ...post, comments: Math.max(0, post.comments - 1) } : post,
        )
        setPosts(updatedPosts)

        if (selectedPost) {
          setSelectedPost({ ...selectedPost, comments: Math.max(0, selectedPost.comments - 1) })
        }

        toast({
          title: "Success",
          description: "Comment deleted successfully!",
        })
      } else {
        throw new Error("Failed to delete comment")
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

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return
    }

    try {
      console.log("=== FRONTEND DELETE POST DEBUG ===")
      console.log("Deleting post ID:", postId)

      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })

      console.log("Delete response status:", response.status)

      if (response.ok) {
        const updatedPosts = posts.filter((post) => post.id !== postId)
        setPosts(updatedPosts)

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedPosts,
            timestamp: Date.now(),
          }),
        )

        // Close post view if it's the deleted post
        if (selectedPost?.id === postId) {
          setIsPostViewOpen(false)
          setSelectedPost(null)
        }

        toast({
          title: "Success",
          description: "Post deleted successfully!",
        })
      } else {
        const errorData = await response.json()
        console.error("Delete error response:", errorData)
        throw new Error(errorData.error || "Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSharePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
      })

      if (response.ok) {
        const shareData = await response.json()

        // Try native sharing first on mobile
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

        // Fallback to clipboard
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
      } else {
        throw new Error("Failed to share post")
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

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select a valid image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setProfileImageUploading(true)
      const formData = new FormData()
      formData.append("profileImage", file)

      const response = await fetch("/api/users/profile-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUser((prev) =>
          prev
            ? {
                ...prev,
                profileImage: data.imageUrl,
                image: data.imageUrl,
              }
            : null,
        )

        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        })
      } else {
        throw new Error("Failed to upload image")
      }
    } catch (error: any) {
      console.error("Error uploading profile image:", error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
      })
    } finally {
      setProfileImageUploading(false)
      event.target.value = ""
    }
  }

  const handleSaveAbout = async () => {
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about: editedAbout,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser((prev) => (prev ? { ...prev, about: data.user?.about || editedAbout } : null))
        setIsEditingAbout(false)

        toast({
          title: "Success",
          description: "About section updated successfully!",
        })
      } else {
        throw new Error("Failed to update about section")
      }
    } catch (error) {
      console.error("Error updating about:", error)
      toast({
        title: "Error",
        description: "Failed to update about section. Please try again.",
      })
    }
  }

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile) return

    try {
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        setUser((prev) =>
          prev
            ? {
                ...prev,
                followers: (prev.followers || 0) + (isFollowing ? -1 : 1),
              }
            : null,
        )

        toast({
          title: "Success",
          description: isFollowing ? "Unfollowed successfully!" : "Following successfully!",
        })
      } else {
        throw new Error("Failed to toggle follow status")
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
      })
    }
  }

  const handleMessage = async () => {
    if (!user || isOwnProfile) return

    try {
      const response = await fetch("/api/stream/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: user.id }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/messages/${user.id}`)
      } else {
        router.push(`/messages/${user.id}`)
      }
    } catch (error) {
      console.error("Error creating channel:", error)
      router.push(`/messages/${user.id}`)
    }
  }

  const handleViewFollowers = async () => {
    const targetUserId = userId || session?.user?.id
    if (targetUserId) {
      await fetchFollowers(targetUserId)
      setIsFollowersDialogOpen(true)
    }
  }

  const handleViewFollowing = async () => {
    const targetUserId = userId || session?.user?.id
    if (targetUserId) {
      await fetchFollowing(targetUserId)
      setIsFollowingDialogOpen(true)
    }
  }

  // Thoughts functions
  const thoughtsCharCount = thoughts.reduce((acc, t) => acc + t.content.length, 0)
  const remainingChars = MAX_TOTAL_CHARS - thoughtsCharCount
  const usagePercentage = (thoughtsCharCount / MAX_TOTAL_CHARS) * 100

  const handleAddThought = async () => {
    if (!newThought.title || !newThought.content) return

    if (newThought.content.length > remainingChars) {
      toast({
        title: "Error",
        description: `You only have ${remainingChars} characters remaining. This note is too long.`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newThought.title,
          content: newThought.content,
        }),
      })

      if (response.ok) {
        const savedThought = await response.json()
        setThoughts([savedThought, ...thoughts])
        setNewThought({ title: "", content: "" })
        setIsAddThoughtDialogOpen(false)

        toast({
          title: "Success",
          description: "Thought saved successfully!",
        })
      } else {
        throw new Error("Failed to save thought")
      }
    } catch (error) {
      console.error("Error saving thought:", error)
      toast({
        title: "Error",
        description: "Failed to save thought. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditThought = async () => {
    if (!editingThought || !editingThought.title || !editingThought.content) return

    const originalThought = thoughts.find((t) => t.id === editingThought.id)
    const charDifference = editingThought.content.length - (originalThought?.content.length || 0)

    if (charDifference > 0 && charDifference > remainingChars) {
      toast({
        title: "Error",
        description: `You only have ${remainingChars} characters remaining. This edit adds too many characters.`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/thoughts/${editingThought.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingThought.title,
          content: editingThought.content,
        }),
      })

      if (response.ok) {
        const updatedThought = await response.json()
        setThoughts(thoughts.map((t) => (t.id === editingThought.id ? updatedThought : t)))
        setEditingThought(null)
        setIsEditThoughtDialogOpen(false)

        toast({
          title: "Success",
          description: "Thought updated successfully!",
        })
      } else {
        throw new Error("Failed to update thought")
      }
    } catch (error) {
      console.error("Error updating thought:", error)
      toast({
        title: "Error",
        description: "Failed to update thought. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteThought = async (id: number) => {
    if (!confirm("Are you sure you want to delete this thought?")) return

    try {
      const response = await fetch(`/api/thoughts/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setThoughts(thoughts.filter((t) => t.id !== id))
        toast({
          title: "Success",
          description: "Thought deleted successfully!",
        })
      } else {
        throw new Error("Failed to delete thought")
      }
    } catch (error) {
      console.error("Error deleting thought:", error)
      toast({
        title: "Error",
        description: "Failed to delete thought. Please try again.",
        variant: "destructive",
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

  const toggleCommentExpansion = (commentId: number) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedComments(newExpanded)
  }

  const renderComment = (comment: Comment, depth = 0) => {
    const isExpanded = expandedComments.has(comment.id)
    const hasReplies = comment.replies && comment.replies.length > 0
    const maxDepth = 3 // Limit nesting depth

    return (
      <div
        key={comment.id}
        className={cn("space-y-2 sm:space-y-3", depth > 0 && "ml-4 sm:ml-8 border-l-2 border-gray-100 pl-2 sm:pl-4")}
      >
        <div className="flex gap-2 sm:gap-3 group">
          <div className="relative h-6 w-6 sm:h-8 sm:w-8 overflow-hidden rounded-full flex-shrink-0">
            <Image
              src={comment.user?.profileImage || "/placeholder.svg?height=32&width=32"}
              alt={comment.user?.username || "User"}
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
          <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                    {comment.user?.nickname || comment.user?.username}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed break-words">{comment.content}</p>

                {/* Reply button */}
                <div className="flex items-center gap-2 mt-1">
                  {depth < maxDepth && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="h-5 w-auto sm:h-6 px-1 sm:px-2 text-xs text-gray-600 hover:text-blue-600"
                    >
                      <Reply className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      Reply
                    </Button>
                  )}

                  {hasReplies && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCommentExpansion(comment.id)}
                      className="h-5 w-auto sm:h-6 px-1 sm:px-2 text-xs text-gray-600 hover:text-blue-600"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          Hide {comment.replies!.length}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {comment.userId === session?.user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Delete comment"
                >
                  <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
              )}
            </div>

            {/* Reply input */}
            {replyingTo === comment.id && (
              <div className="mt-2 sm:mt-3 space-y-2">
                <Textarea
                  placeholder={`Reply to ${comment.user?.nickname || comment.user?.username}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[50px] sm:min-h-[60px] rounded-lg border-blue-200 resize-none text-xs sm:text-sm text-gray-900 placeholder:text-gray-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent("")
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSubmitComment(comment.id)}
                    disabled={!replyContent.trim()}
                    size="sm"
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 text-xs"
                  >
                    <Send className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nested replies */}
        {hasReplies && isExpanded && (
          <div className="space-y-2 sm:space-y-3">
            {comment.replies!.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-600">User not found</h2>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl sm:rounded-3xl"></div>
        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-end mb-4">
            <HamburgerMenu />
          </div>
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            <div className="flex flex-col items-center mb-4 sm:mb-0 sm:flex-shrink-0">
              <div className="relative group">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-1 shadow-xl">
                  <div className="h-full w-full overflow-hidden rounded-full bg-white">
                    <Image
                      src={user.profileImage || user.image || "/placeholder.svg?height=150&width=150"}
                      alt={user.username}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                    />
                  </div>
                </div>
                {isOwnProfile && (
                  <label
                    className={cn(
                      "absolute bottom-0 right-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg cursor-pointer flex items-center justify-center transition-all",
                      profileImageUploading && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {profileImageUploading ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      disabled={profileImageUploading}
                    />
                  </label>
                )}
              </div>
              {user.nickname && (
                <div className="mt-2 sm:mt-3">
                  <span className="text-lg sm:text-xl font-medium text-gray-900">{user.nickname}</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col items-center sm:items-start">
                <div className="mb-3 sm:mb-4">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{user.username}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <button
                      onClick={handleViewFollowers}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{user.followers || 0}</span>
                      <span>followers</span>
                    </button>
                    <button
                      onClick={handleViewFollowing}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{user.following || 0}</span>
                      <span>following</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{user.visitors || 0}</span>
                      <span>views</span>
                    </div>
                  </div>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleFollowToggle}
                      className={cn(
                        "flex-1 sm:flex-none rounded-full px-4 sm:px-6 text-sm font-medium",
                        isFollowing
                          ? "bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
                          : "bg-blue-600 hover:bg-blue-700 text-white",
                      )}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="h-4 w-4 mr-1 sm:mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none rounded-full border-blue-200 hover:bg-blue-50 text-blue-600 px-4 sm:px-6 text-sm"
                      onClick={handleMessage}
                    >
                      <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Message</span>
                      <span className="sm:hidden">Chat</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-4 sm:mt-6">
            {isEditingAbout ? (
              <div className="space-y-3">
                <Textarea
                  value={editedAbout}
                  onChange={(e) => setEditedAbout(e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] rounded-xl sm:rounded-2xl border-blue-200 bg-white/80 backdrop-blur-sm resize-none text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:text-gray-900"
                  placeholder="Tell us about yourself..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingAbout(false)}
                    className="rounded-full px-4 text-sm text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAbout}
                    className="rounded-full px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div className="rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border border-blue-100 p-4 sm:p-6 shadow-sm">
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    {user.about || "No bio available"}
                  </p>
                </div>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-blue-100 h-8 w-8 sm:h-10 sm:w-10"
                    onClick={() => setIsEditingAbout(true)}
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={isFollowersDialogOpen} onOpenChange={setIsFollowersDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[400px] max-h-[80vh] overflow-hidden rounded-2xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-600 text-center">Followers</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] px-1">
            <div className="space-y-2 py-2">
              {followers.length > 0 ? (
                followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      setIsFollowersDialogOpen(false)
                      router.push(`/profile/${follower.id}`)
                    }}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full flex-shrink-0">
                      <Image
                        src={follower.profileImage || follower.image || "/placeholder.svg?height=48&width=48"}
                        alt={follower.username}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {follower.nickname || follower.username}
                      </div>
                      {follower.nickname && (
                        <div className="text-xs sm:text-sm text-gray-500 truncate">@{follower.username}</div>
                      )}
                    </div>
                    <div className="text-gray-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-sm sm:text-base">No followers yet</div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={isFollowingDialogOpen} onOpenChange={setIsFollowingDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[400px] max-h-[80vh] overflow-hidden rounded-2xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-600 text-center">Following</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] px-1">
            <div className="space-y-2 py-2">
              {following.length > 0 ? (
                following.map((followedUser) => (
                  <div
                    key={followedUser.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      setIsFollowingDialogOpen(false)
                      router.push(`/profile/${followedUser.id}`)
                    }}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full flex-shrink-0">
                      <Image
                        src={followedUser.profileImage || followedUser.image || "/placeholder.svg?height=48&width=48"}
                        alt={followedUser.username}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {followedUser.nickname || followedUser.username}
                      </div>
                      {followedUser.nickname && (
                        <div className="text-xs sm:text-sm text-gray-500 truncate">@{followedUser.username}</div>
                      )}
                    </div>
                    <div className="text-gray-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-sm sm:text-base">Not following anyone yet</div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Tabs with Posts and Notes */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-xl sm:rounded-2xl bg-blue-50 p-1 mb-6">
          <TabsTrigger
            value="posts"
            className="rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium text-sm sm:text-base py-2"
          >
            Posts
            {postsLoading && <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>}
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium text-sm sm:text-base py-2"
          >
            Thoughts
            {thoughtsLoading && (
              <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-blue-600">
              {isOwnProfile ? "Your Posts" : `${user.username}'s Posts`}
            </h2>
            {isOwnProfile && (
              <Button
                onClick={() => setIsMediaTypeDialogOpen(true)}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Post</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-blue-50 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                  onClick={() => handlePostClick(post)}
                >
                  {post.video ? (
                    <div className="relative w-full h-full">
                      <video src={post.video} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : post.image ? (
                    <Image src={post.image || "/placeholder.svg"} alt="Post" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-2">
                      <p className="text-xs text-blue-800 text-center line-clamp-4">{post.content}</p>
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePost(post.id)
                        }}
                        className="h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-600 text-white"
                        title="Delete post"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                <div className="text-sm sm:text-base">
                  {isOwnProfile ? "You haven't posted anything yet." : "No posts to show."}
                </div>
                {isOwnProfile && (
                  <p className="text-xs sm:text-sm mt-2 text-gray-400">Share your first post to get started!</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-600">
              {isOwnProfile ? "Your Thoughts" : `${user.username}'s Thoughts`}
            </h2>
            {isOwnProfile && (
              <Button
                onClick={() => setIsAddThoughtDialogOpen(true)}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Thought</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>

          {/* Character Usage - More subtle */}
          {isOwnProfile && (
            <div className="text-xs text-gray-500 text-right">
              {thoughtsCharCount} / {MAX_TOTAL_CHARS} characters used
            </div>
          )}

          {/* Notes Display */}
          {thoughts.length === 0 ? (
            <Card className="rounded-xl bg-card shadow-sm border border-blue-100">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  {isOwnProfile ? "No thoughts yet" : "No thoughts shared"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {isOwnProfile
                    ? "Begin building connections with your first thought. Each reflection you add helps Mirro find patterns and insights that matter to you."
                    : `${user.username} hasn't shared any thoughts yet.`}
                </p>
                {isOwnProfile && (
                  <Button
                    onClick={() => setIsAddThoughtDialogOpen(true)}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Thought
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {thoughts.map((thought) => (
                <Card key={thought.id} className="rounded-xl bg-card shadow-sm border border-blue-100">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-blue-600 font-semibold text-lg mb-1">{thought.title}</h3>
                        <p className="text-sm text-gray-500">{formatDate(thought.createdAt)}</p>
                      </div>
                      {isOwnProfile && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingThought(thought)
                              setIsEditThoughtDialogOpen(true)
                            }}
                            className="rounded-full bg-background/50 border-blue-200"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteThought(thought.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-gray-800 leading-relaxed">{thought.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Single Media Button Dialog */}
      <Dialog open={isMediaTypeDialogOpen} onOpenChange={setIsMediaTypeDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-[400px] w-[calc(100%-2rem)] rounded-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-blue-600">Create New Post</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              Select an image or video to share
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-8 sm:py-12">
            <Button
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = "image/*,video/*"
                input.onchange = (event) => {
                  const syntheticEvent = {
                    target: event.target,
                    currentTarget: event.target,
                  } as React.ChangeEvent<HTMLInputElement>
                  handleMediaSelect(syntheticEvent)
                }
                input.click()
                setIsMediaTypeDialogOpen(false)
              }}
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all group active:scale-95 p-0 overflow-hidden shadow-xl hover:shadow-2xl"
            >
              <div className="relative h-full w-full flex items-center justify-center">
                <Image
                  src="/images/media-button.png"
                  alt="Select media"
                  width={80}
                  height={80}
                  className="opacity-90 group-hover:opacity-100 transition-opacity sm:w-20 sm:h-20"
                />
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsMediaTypeDialogOpen(false)}
              className="w-full rounded-full text-sm sm:text-base py-2 sm:py-3"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={isCreatePostDialogOpen} onOpenChange={setIsCreatePostDialogOpen}>
        <DialogContent className="mx-2 sm:mx-auto sm:max-w-[500px] w-[calc(100%-1rem)] sm:w-[95vw] rounded-2xl max-h-[95vh] overflow-hidden p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedMedia(null)
                setMediaPreview(null)
                setMediaType(null)
                setPostContent("")
                setIsCreatePostDialogOpen(false)
              }}
              className="text-gray-600 hover:bg-gray-100 rounded-full px-3 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <h2 className="text-base sm:text-lg font-semibold">New Post</h2>
            <Button
              onClick={handleCreatePost}
              disabled={!selectedMedia}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 disabled:opacity-50 text-sm sm:text-base"
            >
              Share
            </Button>
          </div>

          <div className="max-h-[calc(95vh-60px)] overflow-y-auto">
            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative bg-black">
                <div className="aspect-square sm:aspect-video flex items-center justify-center">
                  {mediaType === "video" ? (
                    <video
                      src={mediaPreview}
                      className="max-h-full max-w-full object-contain"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={mediaPreview || "/placeholder.svg"}
                      alt="Media preview"
                      width={500}
                      height={500}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                {/* Media controls overlay */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = mediaType === "video" ? "video/*" : "image/*"
                      input.onchange = (event) => {
                        const syntheticEvent = {
                          target: event.target,
                          currentTarget: event.target,
                        } as React.ChangeEvent<HTMLInputElement>
                        handleMediaSelect(syntheticEvent)
                      }
                      input.click()
                    }}
                    className="rounded-full bg-black/60 hover:bg-black/80 text-white border-none backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Caption Section */}
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full flex-shrink-0">
                  <Image
                    src={session?.user?.image || "/placeholder.svg?height=40&width=40"}
                    alt="Your avatar"
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{session?.user?.name || "You"}</p>
                    <Textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value.slice(0, 2200))}
                      className="mt-2 min-h-[80px] sm:min-h-[100px] rounded-lg border-gray-200 resize-none text-sm sm:text-base placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400 text-gray-900"
                      placeholder="Write a caption..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post View Dialog */}
      <Dialog open={isPostViewOpen} onOpenChange={setIsPostViewOpen}>
        <DialogContent className="max-w-4xl w-[100vw] sm:w-[95vw] h-[100vh] sm:h-[90vh] p-0 bg-black border-none sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="flex flex-col sm:flex-row h-full relative">
              {/* Close button - top right */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPostViewOpen(false)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 h-10 w-10 rounded-full bg-black/70 hover:bg-black/90 text-white border-none backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Media Section - Fixed height on mobile */}
              <div className="flex-1 relative overflow-hidden h-[50vh] sm:h-full max-h-[50vh] sm:max-h-none">
                {/* Blurred background */}
                {(selectedPost.image || selectedPost.video) && (
                  <div className="absolute inset-0">
                    {selectedPost.video ? (
                      <video
                        src={selectedPost.video}
                        className="w-full h-full object-cover blur-xl scale-110 opacity-30"
                        muted
                      />
                    ) : (
                      <Image
                        src={selectedPost.image || "/placeholder.svg"}
                        alt="Blurred background"
                        fill
                        className="object-cover blur-xl scale-110 opacity-30"
                      />
                    )}
                  </div>
                )}

                {/* Main content */}
                <div className="relative z-10 flex items-center justify-center h-full p-2 sm:p-4">
                  {selectedPost.video ? (
                    <video
                      src={selectedPost.video}
                      className="max-h-full max-w-full object-contain rounded-lg"
                      controls
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : selectedPost.image ? (
                    <Image
                      src={selectedPost.image || "/placeholder.svg"}
                      alt="Post content"
                      width={800}
                      height={600}
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 sm:p-8 max-w-md mx-4">
                      <p className="text-white text-lg sm:text-xl font-medium text-center leading-relaxed">
                        {selectedPost.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section - Optimized for mobile */}
              <div className="w-full sm:w-96 bg-white flex flex-col h-[60vh] sm:h-full">
                {/* Header - Compact on mobile */}
                <div className="p-3 sm:p-4 border-b flex items-center gap-3 flex-shrink-0">
                  <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full">
                    <Image
                      src={user.profileImage || user.image || "/placeholder.svg?height=40&width=40"}
                      alt={user.username}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{user.nickname || user.username}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{formatDate(selectedPost.createdAt)}</p>
                  </div>
                </div>

                {/* Content - Compact on mobile */}
                {(selectedPost.image || selectedPost.video) && selectedPost.content && (
                  <div className="p-3 sm:p-4 border-b flex-shrink-0 max-h-20 sm:max-h-none overflow-y-auto">
                    <p className="text-gray-800 text-sm sm:text-base leading-relaxed">{selectedPost.content}</p>
                  </div>
                )}

                {/* Actions - More compact on mobile */}
                <div className="p-3 sm:p-4 border-b flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikePost(selectedPost.id)}
                      className={cn(
                        "flex items-center gap-1 sm:gap-2 rounded-full transition-colors px-2 sm:px-3 py-1 sm:py-2 min-w-0",
                        selectedPost.isLiked
                          ? "text-red-600 hover:bg-red-50"
                          : "text-gray-700 hover:bg-red-50 hover:text-red-600",
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-current",
                          selectedPost.isLiked && "fill-current",
                        )}
                      />
                      <span className="font-medium text-xs sm:text-sm text-current">{selectedPost.likes}</span>
                    </Button>
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">{selectedPost.comments}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSharePost(selectedPost.id)}
                      className="rounded-full text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors p-1.5 sm:p-2"
                      title="Share post"
                    >
                      <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-current" />
                    </Button>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="rounded-full text-gray-700 hover:bg-red-50 hover:text-red-600 p-1.5 sm:p-2"
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-current" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Comments - Scrollable area with proper mobile height */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
                  {commentsLoading ? (
                    <div className="flex justify-center py-6 sm:py-8">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => renderComment(comment))
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-gray-500">
                      <MessageCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                      <p className="text-sm sm:text-base">No comments yet</p>
                      <p className="text-xs sm:text-sm text-gray-400">Be the first to comment!</p>
                    </div>
                  )}
                </div>

                {/* Comment Input - Fixed at bottom with better mobile UX */}
                <div className="p-3 sm:p-4 border-t flex-shrink-0 bg-white safe-area-inset-bottom">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full flex-shrink-0">
                      <Image
                        src={session?.user?.image || "/placeholder.svg?height=32&width=32"}
                        alt="Your avatar"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[50px] sm:min-h-[60px] rounded-lg border-blue-200 resize-none text-sm sm:text-base text-gray-900 placeholder:text-gray-500"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSubmitComment()}
                          disabled={!newComment.trim()}
                          size="sm"
                          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 text-xs sm:text-sm"
                        >
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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

      {/* Add Thought Dialog */}
      <Dialog open={isAddThoughtDialogOpen} onOpenChange={setIsAddThoughtDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-xl bg-background/90 backdrop-blur-md border border-blue-200 w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Create New Thought</DialogTitle>
            <DialogDescription>
              Add a new thought to your collection. These thoughts help build meaningful connections.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newThought.title}
                onChange={(e) => setNewThought({ ...newThought, title: e.target.value })}
                placeholder="Give your note a title"
                className="rounded-full bg-background/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newThought.content}
                onChange={(e) => {
                  const content = e.target.value.slice(0, MAX_THOUGHT_CHARS)
                  setNewThought({ ...newThought, content })
                }}
                placeholder="Write your note here..."
                className="min-h-[150px] rounded-xl bg-background/50"
              />
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-muted-foreground">
                <span className={newThought.content.length >= MAX_THOUGHT_CHARS ? "text-red-500" : ""}>
                  {newThought.content.length}/{MAX_THOUGHT_CHARS} characters
                </span>
                <span className="mt-1 sm:mt-0">{remainingChars} characters remaining in total</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddThoughtDialogOpen(false)}
              className="rounded-full bg-background/50 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddThought}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              disabled={!newThought.title || !newThought.content || newThought.content.length > MAX_THOUGHT_CHARS}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Thought Dialog */}
      <Dialog
        open={isEditThoughtDialogOpen && editingThought !== null}
        onOpenChange={(open) => {
          setIsEditThoughtDialogOpen(open)
          if (!open) setEditingThought(null)
        }}
      >
        <DialogContent className="sm:max-w-[550px] rounded-xl bg-background/90 backdrop-blur-md border border-blue-200 w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Edit Note</DialogTitle>
          </DialogHeader>
          {editingThought && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingThought.title}
                  onChange={(e) => setEditingThought({ ...editingThought, title: e.target.value })}
                  className="rounded-full bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingThought.content}
                  onChange={(e) => {
                    const content = e.target.value.slice(0, MAX_THOUGHT_CHARS)
                    setEditingThought({ ...editingThought, content })
                  }}
                  className="min-h-[150px] rounded-xl bg-background/50"
                />
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-muted-foreground">
                  <span className={editingThought.content.length >= MAX_THOUGHT_CHARS ? "text-red-500" : ""}>
                    {editingThought.content.length}/{MAX_THOUGHT_CHARS} characters
                  </span>
                  <span className="mt-1 sm:mt-0">
                    {remainingChars +
                      (thoughts.find((t) => t.id === editingThought.id)?.content.length || 0) -
                      editingThought.content.length}{" "}
                    characters remaining in total
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingThought(null)
                setIsEditThoughtDialogOpen(false)
              }}
              className="rounded-full bg-background/50 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditThought}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              disabled={
                !editingThought?.title || !editingThought?.content || editingThought?.content.length > MAX_THOUGHT_CHARS
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
