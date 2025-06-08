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
import { Progress } from "@/components/ui/progress"
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
  Paperclip,
  Plus,
  Trash2,
  Grid3X3,
  List,
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
  }
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
  const [newPost, setNewPost] = useState("")
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [editedAbout, setEditedAbout] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isFollowersDialogOpen, setIsFollowersDialogOpen] = useState(false)
  const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [postsViewMode, setPostsViewMode] = useState<"grid" | "list">("grid")

  // Post editing states
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editingPostContent, setEditingPostContent] = useState("")
  const [editingPostMedia, setEditingPostMedia] = useState<string | null>(null)
  const [editingPostMediaType, setEditingPostMediaType] = useState<"image" | "video" | null>(null)
  const [newEditMedia, setNewEditMedia] = useState<File | null>(null)
  const [removeEditMedia, setRemoveEditMedia] = useState(false)
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false)

  // Comment states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)

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

        if (!forceRefresh) {
          const cachedPosts = sessionStorage.getItem(cacheKey)
          if (cachedPosts) {
            const parsed = JSON.parse(cachedPosts)
            const cacheAge = Date.now() - parsed.timestamp
            if (cacheAge < 5 * 60 * 1000) {
              setPosts(parsed.data)
              console.log("✅ Posts loaded from cache:", parsed.data.length)
              setPostsLoading(false)
              return
            }
          }
        }

        const apiUrl = `/api/posts?userId=${targetUserId}&t=${Date.now()}`
        const postsResponse = await fetch(apiUrl)

        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          const newPosts = postsData.posts || []
          setPosts(newPosts)

          const cacheData = {
            data: newPosts,
            timestamp: Date.now(),
          }
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
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
    [cacheKey],
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

  // Post editing functions
  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id)
    setEditingPostContent(post.content)
    setEditingPostMedia(post.image || post.video || null)
    setEditingPostMediaType(post.image ? "image" : post.video ? "video" : null)
    setIsEditPostDialogOpen(true)
  }

  const handleSavePostEdit = async () => {
    if (!editingPostId || (!editingPostContent.trim() && !editingPostMedia && !newEditMedia)) return

    try {
      const formData = new FormData()
      formData.append("content", editingPostContent.trim())

      if (removeEditMedia) {
        formData.append("removeMedia", "true")
      } else if (newEditMedia) {
        formData.append("media", newEditMedia)
      }

      const response = await fetch(`/api/posts/${editingPostId}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        const updatedPost = await response.json()
        const updatedPosts = posts.map((post) =>
          post.id === editingPostId
            ? {
                ...post,
                content: updatedPost.content,
                image: updatedPost.image,
                video: updatedPost.video,
              }
            : post,
        )
        setPosts(updatedPosts)

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedPosts,
            timestamp: Date.now(),
          }),
        )

        setIsEditPostDialogOpen(false)
        setEditingPostId(null)
        setEditingPostContent("")
        setEditingPostMedia(null)
        setEditingPostMediaType(null)
        setNewEditMedia(null)
        setRemoveEditMedia(false)

        toast({
          title: "Success",
          description: "Post updated successfully!",
        })
      } else {
        throw new Error("Failed to update post")
      }
    } catch (error) {
      console.error("Error updating post:", error)
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      })
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
          description: "Note saved successfully!",
        })
      } else {
        throw new Error("Failed to save note")
      }
    } catch (error) {
      console.error("Error saving thought:", error)
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
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
          description: "Note updated successfully!",
        })
      } else {
        throw new Error("Failed to update note")
      }
    } catch (error) {
      console.error("Error updating thought:", error)
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteThought = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      const response = await fetch(`/api/thoughts/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setThoughts(thoughts.filter((t) => t.id !== id))
        toast({
          title: "Success",
          description: "Note deleted successfully!",
        })
      } else {
        throw new Error("Failed to delete note")
      }
    } catch (error) {
      console.error("Error deleting thought:", error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Comment functions
  const handleOpenComments = async (postId: number) => {
    setSelectedPostId(postId)
    setCommentDialogOpen(true)
    await fetchComments(postId)
  }

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

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedPostId) return

    try {
      const response = await fetch(`/api/posts/${selectedPostId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments([newCommentData, ...comments])
        setNewComment("")

        const updatedPosts = posts.map((post) =>
          post.id === selectedPostId ? { ...post, comments: post.comments + 1 } : post,
        )
        setPosts(updatedPosts)

        toast({
          title: "Success",
          description: "Comment added successfully!",
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
      const response = await fetch(`/api/posts/${selectedPostId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const updatedComments = comments.filter((comment) => comment.id !== commentId)
        setComments(updatedComments)

        const updatedPosts = posts.map((post) =>
          post.id === selectedPostId ? { ...post, comments: Math.max(0, post.comments - 1) } : post,
        )
        setPosts(updatedPosts)

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

  // Other existing functions (handleDeletePost, handleSharePost, etc.) remain the same...
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
      } else {
        throw new Error("Failed to share post")
      }
    } catch (error) {
      console.error("Error sharing post:", error)
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
      })
    }
  }

  const handlePostSubmit = async () => {
    if (!newPost.trim() && !imagePreview) return

    try {
      const formData = new FormData()
      formData.append("content", newPost)
      if (imageFile) {
        formData.append("media", imageFile)
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

        setNewPost("")
        setImageFile(null)
        setImagePreview(null)

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
      })
    }
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
      })
    }
  }

  const handleMediaChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
      {/* Profile Header - Same as before */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl sm:rounded-3xl"></div>
        <div className="relative p-4 sm:p-6 lg:p-8">
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
                  className="min-h-[80px] sm:min-h-[100px] rounded-xl sm:rounded-2xl border-blue-200 bg-white/80 backdrop-blur-sm resize-none text-sm sm:text-base"
                  placeholder="Tell us about yourself..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingAbout(false)}
                    className="rounded-full px-4 text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAbout}
                    className="rounded-full px-4 bg-blue-600 hover:bg-blue-700 text-sm"
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
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={isFollowersDialogOpen} onOpenChange={setIsFollowersDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-[400px] max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {followers.length > 0 ? (
              followers.map((follower) => (
                <div key={follower.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={follower.profileImage || follower.image || "/placeholder.svg?height=40&width=40"}
                      alt={follower.username}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{follower.nickname || follower.username}</div>
                    {follower.nickname && <div className="text-sm text-gray-500">@{follower.username}</div>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/profile/${follower.id}`)}
                    className="rounded-full"
                  >
                    View
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No followers yet</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={isFollowingDialogOpen} onOpenChange={setIsFollowingDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-[400px] max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {following.length > 0 ? (
              following.map((followedUser) => (
                <div key={followedUser.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={followedUser.profileImage || followedUser.image || "/placeholder.svg?height=40&width=40"}
                      alt={followedUser.username}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{followedUser.nickname || followedUser.username}</div>
                    {followedUser.nickname && <div className="text-sm text-gray-500">@{followedUser.username}</div>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/profile/${followedUser.id}`)}
                    className="rounded-full"
                  >
                    View
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">Not following anyone yet</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Tabs with Posts and Notes - REMOVED COUNTS */}
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
            Notes
            {thoughtsLoading && (
              <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {isOwnProfile ? "Your Posts" : `${user.username}'s Posts`}
            </h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Total: {posts.length}</div>
              <div className="flex rounded-lg border border-blue-200 p-1">
                <Button
                  variant={postsViewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPostsViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={postsViewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPostsViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Post Creation Widget */}
          {isOwnProfile && (
            <Card className="rounded-xl sm:rounded-2xl border-blue-100 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-3 sm:gap-4">
                  <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={user.profileImage || user.image || "/placeholder.svg?height=48&width=48"}
                      alt={user.username}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  </div>
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder={`What's on your mind, ${user.nickname || user.username}?`}
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        className="min-h-[100px] sm:min-h-[120px] rounded-xl sm:rounded-2xl border-blue-200 bg-white/80 backdrop-blur-sm resize-none text-sm sm:text-lg placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                      />
                      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-2">
                        <span className="text-xs text-gray-400">{newPost.length}/500</span>
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Post preview"
                          width={400}
                          height={300}
                          className="w-full object-cover max-h-48 sm:max-h-64"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full text-lg"
                          onClick={() => {
                            setImagePreview(null)
                            setImageFile(null)
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full cursor-pointer transition-colors">
                          <Paperclip className="h-4 w-4" />
                          <span>Attach</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              handleMediaChange(file)
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <Button
                        onClick={handlePostSubmit}
                        disabled={!newPost.trim() && !imagePreview}
                        className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 sm:px-8 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-105"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Display */}
          <div
            className={
              postsViewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4 sm:space-y-6"
            }
          >
            {posts.length > 0 ? (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className={cn(
                    "rounded-xl border-blue-100 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden",
                    postsViewMode === "grid" ? "aspect-square" : "sm:rounded-2xl",
                  )}
                >
                  <CardContent className={cn("p-3", postsViewMode === "grid" ? "h-full flex flex-col" : "sm:p-6")}>
                    {postsViewMode === "grid" ? (
                      // Grid view - Instagram style
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative h-6 w-6 overflow-hidden rounded-full">
                            <Image
                              src={user.profileImage || user.image || "/placeholder.svg?height=24&width=24"}
                              alt={user.username}
                              fill
                              className="object-cover"
                              sizes="24px"
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {user.nickname || user.username}
                          </span>
                          {isOwnProfile && (
                            <div className="ml-auto flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPost(post)}
                                className="h-5 w-5 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                title="Edit post"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePost(post.id)}
                                className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600"
                                title="Delete post"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {post.video ? (
                          <div className="flex-1 rounded-lg overflow-hidden mb-2">
                            <video
                              src={post.video}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                            />
                          </div>
                        ) : post.image ? (
                          <div className="flex-1 rounded-lg overflow-hidden mb-2">
                            <Image
                              src={post.image || "/placeholder.svg"}
                              alt="Post image"
                              width={300}
                              height={300}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 mb-2 flex items-center justify-center">
                            <p className="text-xs text-gray-700 text-center line-clamp-4">{post.content}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikePost(post.id)}
                              className={cn(
                                "flex items-center gap-1 p-1 h-auto",
                                post.isLiked ? "text-red-600" : "text-gray-600",
                              )}
                            >
                              <Heart className={cn("h-3 w-3", post.isLiked && "fill-current")} />
                              <span>{post.likes}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenComments(post.id)}
                              className="flex items-center gap-1 p-1 h-auto text-gray-600"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span>{post.comments}</span>
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSharePost(post.id)}
                            className="p-1 h-auto text-gray-600"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // List view - Facebook style
                      <div className="flex gap-2 sm:gap-4">
                        <div className="relative h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={user.profileImage || user.image || "/placeholder.svg?height=48&width=48"}
                            alt={user.username}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 32px, 48px"
                          />
                        </div>
                        <div className="flex-1 space-y-2 sm:space-y-4 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900 text-xs sm:text-base truncate">
                                  {user.nickname || user.username}
                                </h3>
                                <span className="text-xs text-gray-500 truncate">@{user.username}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{formatDate(post.createdAt)}</p>
                            </div>
                            {isOwnProfile && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPost(post)}
                                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-blue-100 hover:text-blue-600 flex-shrink-0"
                                  title="Edit post"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                                  title="Delete post"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-800 leading-relaxed text-sm sm:text-base break-words">
                            {post.content}
                          </p>

                          {post.video && (
                            <div className="rounded-lg sm:rounded-xl overflow-hidden">
                              <video
                                src={post.video}
                                className="w-full object-cover max-h-48 sm:max-h-80"
                                controls
                                preload="metadata"
                              />
                            </div>
                          )}

                          {post.image && (
                            <div className="rounded-lg sm:rounded-xl overflow-hidden">
                              <Image
                                src={post.image || "/placeholder.svg"}
                                alt="Post image"
                                width={500}
                                height={300}
                                className="w-full object-cover max-h-48 sm:max-h-80"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 sm:gap-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenComments(post.id)}
                                className="flex items-center gap-1 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors px-2 py-1"
                              >
                                <MessageCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                                <span className="font-medium text-xs sm:text-sm">{post.comments}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikePost(post.id)}
                                className={cn(
                                  "flex items-center gap-1 rounded-full transition-colors px-2 py-1 -ml-2",
                                  post.isLiked ? "text-red-600 hover:bg-red-50" : "hover:bg-red-50 hover:text-red-600",
                                )}
                              >
                                <Heart className={cn("h-3 w-3 sm:h-5 sm:w-5", post.isLiked && "fill-current")} />
                                <span className="font-medium text-xs sm:text-sm">{post.likes}</span>
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSharePost(post.id)}
                              className="rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors p-1"
                              title="Share post"
                            >
                              <Share2 className="h-3 w-3 sm:h-5 sm:w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500 col-span-full">
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
              {isOwnProfile ? "Your Notes" : `${user.username}'s Notes`}
            </h2>
            {isOwnProfile && (
              <Button
                onClick={() => setIsAddThoughtDialogOpen(true)}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Note</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>

          {/* Character Usage - Only show for own profile */}
          {isOwnProfile && (
            <Card className="rounded-xl bg-card shadow-sm border border-blue-100">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-background/50 p-3 border border-blue-50">
                    <span>Character Usage</span>
                    <div className="text-right">
                      <span className="font-medium">{thoughtsCharCount}</span>
                      <span className="text-muted-foreground"> / {MAX_TOTAL_CHARS}</span>
                    </div>
                  </div>
                  <Progress value={usagePercentage} className="h-2 w-full bg-blue-100">
                    <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, usagePercentage)}%` }} />
                  </Progress>
                  <div className="text-xs text-muted-foreground text-right">{remainingChars} characters remaining</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Display */}
          {thoughts.length === 0 ? (
            <Card className="rounded-xl bg-card shadow-sm border border-blue-100">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  {isOwnProfile ? "No notes yet" : "No notes shared"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {isOwnProfile
                    ? "Begin building connections with your first note. Each reflection you add helps Mirro find patterns and insights that matter to you."
                    : `${user.username} hasn't shared any notes yet.`}
                </p>
                {isOwnProfile && (
                  <Button
                    onClick={() => setIsAddThoughtDialogOpen(true)}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Note
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

      {/* Edit Post Dialog */}
      <Dialog open={isEditPostDialogOpen} onOpenChange={setIsEditPostDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Edit Post</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              value={editingPostContent}
              onChange={(e) => setEditingPostContent(e.target.value)}
              className="min-h-[120px] rounded-xl border-blue-200 resize-none"
              placeholder="Edit your post..."
            />

            {/* Current Media */}
            {editingPostMedia && !removeEditMedia && !newEditMedia && (
              <div className="relative rounded-xl overflow-hidden">
                {editingPostMediaType === "video" ? (
                  <video src={editingPostMedia} className="w-full max-h-64 object-cover" controls />
                ) : (
                  <Image
                    src={editingPostMedia || "/placeholder.svg"}
                    alt="Current media"
                    width={400}
                    height={300}
                    className="w-full max-h-64 object-cover"
                  />
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRemoveEditMedia(true)}
                  className="absolute top-2 right-2 rounded-full"
                >
                  Remove
                </Button>
              </div>
            )}

            {/* New Media Preview */}
            {newEditMedia && (
              <div className="relative rounded-xl overflow-hidden">
                {newEditMedia.type.startsWith("video/") ? (
                  <video src={URL.createObjectURL(newEditMedia)} className="w-full max-h-64 object-cover" controls />
                ) : (
                  <Image
                    src={URL.createObjectURL(newEditMedia) || "/placeholder.svg"}
                    alt="New media"
                    width={400}
                    height={300}
                    className="w-full max-h-64 object-cover"
                  />
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setNewEditMedia(null)}
                  className="absolute top-2 right-2 rounded-full"
                >
                  Remove
                </Button>
              </div>
            )}

            {/* Media Upload */}
            {!newEditMedia && (removeEditMedia || !editingPostMedia) && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full cursor-pointer transition-colors">
                  <Paperclip className="h-4 w-4" />
                  <span>Add Media</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setNewEditMedia(file)
                      setRemoveEditMedia(false)
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            <div className="text-xs text-gray-400 text-right">{editingPostContent.length}/500</div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditPostDialogOpen(false)
                setEditingPostId(null)
                setEditingPostContent("")
                setEditingPostMedia(null)
                setEditingPostMediaType(null)
                setNewEditMedia(null)
                setRemoveEditMedia(false)
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePostEdit}
              disabled={!editingPostContent.trim() && !editingPostMedia && !newEditMedia}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Thought Dialog */}
      <Dialog open={isAddThoughtDialogOpen} onOpenChange={setIsAddThoughtDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-xl bg-background/90 backdrop-blur-md border border-blue-200 w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Create New Note</DialogTitle>
            <DialogDescription>
              Add a new note to your collection. These notes help build meaningful connections.
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

      {/* Comments Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-[500px] max-h-[80vh] overflow-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Comments</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[60vh]">
            <div className="p-4 border-b">
              <div className="flex gap-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                  <Image
                    src={user?.profileImage || user?.image || "/placeholder.svg?height=32&width=32"}
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
                        src={comment.user?.profileImage || comment.user?.image || "/placeholder.svg?height=32&width=32"}
                        alt={comment.user?.username || "User"}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.user?.nickname || comment.user?.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {comment.userId === session?.user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
