"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
  MoreHorizontal,
  Paperclip,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface Post {
  id: number
  content: string
  createdAt: string
  image: string | null
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

export default function ProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const userId = params?.userId as string
  const isOwnProfile = !userId || userId === session?.user?.id

  const [user, setUser] = useState<ProfileUser | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [profileImageUploading, setProfileImageUploading] = useState(false)
  const [newPost, setNewPost] = useState("")
  const [isEditingAbout, setIsEditingAbout] = useState(false)
  const [editedAbout, setEditedAbout] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isFollowersDialogOpen, setIsFollowersDialogOpen] = useState(false)
  const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)

  const cacheKey = `posts-${userId || session?.user?.id}`

  const fetchPosts = useCallback(
    async (targetUserId: string, forceRefresh = false) => {
      try {
        setPostsLoading(true)
        console.log("=== FRONTEND FETCH POSTS DEBUG START ===")
        console.log("Target user ID:", targetUserId)
        console.log("Force refresh:", forceRefresh)
        console.log("Cache key:", cacheKey)
        console.log("Current session user ID:", session?.user?.id)

        if (!forceRefresh) {
          const cachedPosts = sessionStorage.getItem(cacheKey)
          if (cachedPosts) {
            const parsed = JSON.parse(cachedPosts)
            const cacheAge = Date.now() - parsed.timestamp
            console.log("Cache found, age:", cacheAge, "ms")
            if (cacheAge < 5 * 60 * 1000) {
              setPosts(parsed.data)
              console.log("✅ Posts loaded from cache:", parsed.data.length)
              setPostsLoading(false)
              return
            } else {
              console.log("Cache expired, fetching fresh data")
            }
          } else {
            console.log("No cache found")
          }
        }

        const apiUrl = `/api/posts?userId=${targetUserId}&t=${Date.now()}`
        console.log("API URL:", apiUrl)
        console.log("Making fetch request...")

        const postsResponse = await fetch(apiUrl)
        console.log("Response status:", postsResponse.status)
        console.log("Response ok:", postsResponse.ok)
        console.log("Response headers:", Object.fromEntries(postsResponse.headers.entries()))

        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          console.log("Posts data received:", {
            hasPostsArray: Array.isArray(postsData.posts),
            postsCount: postsData.posts?.length || 0,
            rawData: postsData,
          })

          const newPosts = postsData.posts || []
          console.log("Setting posts state:", newPosts.length)
          setPosts(newPosts)

          // Save to cache
          const cacheData = {
            data: newPosts,
            timestamp: Date.now(),
          }
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
          console.log("✅ Posts saved to cache")
          console.log("✅ Successfully fetched posts:", newPosts.length)
        } else {
          const errorText = await postsResponse.text()
          console.error("❌ API Error Response:", errorText)
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          const errorMessage = errorData.message || "Failed to fetch posts"
          console.error("❌ Failed to fetch posts:", errorMessage)
          throw new Error(errorMessage)
        }
      } catch (error: any) {
        console.error("❌ Error fetching posts:", error)
        console.error("Error stack:", error.stack)
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again.",
          variant: "destructive",
        })
      } finally {
        setPostsLoading(false)
        console.log("=== FRONTEND FETCH POSTS DEBUG END ===")
      }
    },
    [cacheKey, session?.user?.id],
  )

  const fetchFollowers = async (targetUserId: string) => {
    try {
      console.log("=== FETCHING FOLLOWERS DEBUG ===")
      console.log(`Fetching followers for user ID: ${targetUserId}`)
      const response = await fetch(`/api/users/${targetUserId}/followers`)
      console.log(`Followers API URL: /api/users/${targetUserId}/followers`)
      console.log("Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Followers data fetched:", data)
        setFollowers(data.followers || [])
        console.log("✅ Successfully fetched followers:", data.followers?.length || 0)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to fetch followers"
        console.error("❌ Failed to fetch followers:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error fetching followers:", error)
    }
  }

  const fetchFollowing = async (targetUserId: string) => {
    try {
      console.log("=== FETCHING FOLLOWING DEBUG ===")
      console.log(`Fetching following for user ID: ${targetUserId}`)
      const response = await fetch(`/api/users/${targetUserId}/following`)
      console.log(`Following API URL: /api/users/${targetUserId}/following`)
      console.log("Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Following data fetched:", data)
        setFollowing(data.following || [])
        console.log("✅ Successfully fetched following:", data.following?.length || 0)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to fetch following"
        console.error("❌ Failed to fetch following:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error fetching following:", error)
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        console.log("=== PROFILE FETCH DEBUG START ===")
        const targetUserId = userId || session?.user?.id
        console.log("Target user ID:", targetUserId)
        console.log("Is own profile:", isOwnProfile)
        console.log("Session user ID:", session?.user?.id)

        if (!targetUserId) {
          console.log("❌ No target user ID, returning")
          return
        }

        console.log(`Fetching profile for user ID: ${targetUserId}`)
        const response = await fetch(`/api/users/profile/${targetUserId}`)
        console.log(`Profile API URL: /api/users/profile/${targetUserId}`)
        console.log("Profile response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("Profile data fetched with counts:", {
            username: data.user.username,
            followers: data.user.followers,
            following: data.user.following,
            visitors: data.user.visitors,
          })
          setUser(data.user)
          setEditedAbout(data.user.about || "")
          console.log("✅ Successfully fetched profile with real counts")
        } else {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.message || "Failed to fetch profile"
          console.error("❌ Failed to fetch profile:", errorMessage)
          throw new Error(errorMessage)
        }

        console.log("Calling fetchPosts...")
        await fetchPosts(targetUserId)

        if (!isOwnProfile) {
          console.log("Fetching follow status...")
          const followResponse = await fetch(`/api/users/${targetUserId}/follow-status`)
          console.log(`Follow status API URL: /api/users/${targetUserId}/follow-status`)
          console.log("Follow status response:", followResponse.status)
          if (followResponse.ok) {
            const followData = await followResponse.json()
            console.log("Follow status data fetched:", followData)
            setIsFollowing(followData.isFollowing)
            console.log("✅ Successfully fetched follow status")
          } else {
            const errorData = await followResponse.json().catch(() => ({}))
            const errorMessage = errorData.message || "Failed to fetch follow status"
            console.error("❌ Failed to fetch follow status:", errorMessage)
          }
        }

        // Track visitors
        if (!isOwnProfile) {
          try {
            console.log("Recording visitor...")
            const visitorResponse = await fetch(`/api/users/${targetUserId}/visit`, {
              method: "POST",
            })
            console.log(`Visit API URL: /api/users/${targetUserId}/visit`)
            console.log("Visitor response status:", visitorResponse.status)
            if (visitorResponse.ok) {
              console.log("✅ Visitor count updated successfully")
              // Refresh profile to get updated visitor count
              const updatedResponse = await fetch(`/api/users/profile/${targetUserId}`)
              if (updatedResponse.ok) {
                const updatedData = await updatedResponse.json()
                setUser(updatedData.user)
                console.log("✅ Profile updated with new visitor count:", updatedData.user.visitors)
              }
            } else {
              console.error("❌ Failed to update visitor count")
            }
          } catch (error) {
            console.error("❌ Error updating visitor count:", error)
          }
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
        console.log("=== PROFILE FETCH DEBUG END ===")
      }
    }

    if (session) {
      console.log("Session available, fetching profile...")
      fetchProfile()
    } else {
      console.log("No session available")
    }
  }, [userId, session, isOwnProfile, fetchPosts])

  const handleOpenComments = async (postId: number) => {
    setSelectedPostId(postId)
    setCommentDialogOpen(true)
    await fetchComments(postId)
  }

  const fetchComments = async (postId: number) => {
    try {
      setCommentsLoading(true)
      console.log("=== FETCHING COMMENTS DEBUG ===")
      console.log("Fetching comments for post ID:", postId)

      const response = await fetch(`/api/posts/${postId}/comments`)
      console.log("Comments response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Comments fetched:", data.comments?.length || 0)
        setComments(data.comments || [])
      } else {
        console.error("Failed to fetch comments")
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
      console.log("=== SUBMIT COMMENT DEBUG ===")
      console.log("Submitting comment for post ID:", selectedPostId)

      const response = await fetch(`/api/posts/${selectedPostId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      console.log("Comment submit response status:", response.status)

      if (response.ok) {
        const newCommentData = await response.json()
        console.log("Comment created:", newCommentData)

        setComments([newCommentData, ...comments])
        setNewComment("")

        // Update post comment count in the posts list
        const updatedPosts = posts.map((post) =>
          post.id === selectedPostId ? { ...post, comments: post.comments + 1 } : post,
        )
        setPosts(updatedPosts)

        toast({
          title: "Success",
          description: "Comment added successfully!",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to add comment")
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

  // Add delete comment handler after handleSubmitComment
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return
    }

    try {
      console.log("=== DELETE COMMENT DEBUG ===")
      console.log("Deleting comment ID:", commentId)

      const response = await fetch(`/api/posts/${selectedPostId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })
      console.log("Delete comment response status:", response.status)

      if (response.ok) {
        // Remove comment from state
        const updatedComments = comments.filter((comment) => comment.id !== commentId)
        setComments(updatedComments)

        // Update post comment count in the posts list
        const updatedPosts = posts.map((post) =>
          post.id === selectedPostId ? { ...post, comments: Math.max(0, post.comments - 1) } : post,
        )
        setPosts(updatedPosts)

        toast({
          title: "Success",
          description: "Comment deleted successfully!",
        })
        console.log("✅ Comment deleted successfully")
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to delete comment"
        console.error("❌ Failed to delete comment:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add delete post handler
  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return
    }

    try {
      console.log("=== DELETE POST DEBUG ===")
      console.log("Deleting post ID:", postId)

      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })
      console.log("Delete response status:", response.status)

      if (response.ok) {
        // Remove post from state
        const updatedPosts = posts.filter((post) => post.id !== postId)
        setPosts(updatedPosts)

        // Update cache
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
        console.log("✅ Post deleted successfully")
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to delete post"
        console.error("❌ Failed to delete post:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error deleting post:", error)
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add share post handler
  const handleSharePost = async (postId: number) => {
    try {
      console.log("=== SHARE POST DEBUG ===")
      console.log("Sharing post ID:", postId)

      const response = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
      })
      console.log("Share response status:", response.status)

      if (response.ok) {
        const shareData = await response.json()
        console.log("Share data received:", shareData)

        // Try to use native Web Share API if available
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareData.title,
              text: shareData.text,
              url: shareData.url,
            })
            console.log("✅ Shared via Web Share API")
            return
          } catch (shareError) {
            console.log("Web Share API failed, falling back to clipboard")
          }
        }

        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.url)
        toast({
          title: "Link Copied!",
          description: "Post link has been copied to your clipboard.",
        })
        console.log("✅ Link copied to clipboard")
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to share post"
        console.error("❌ Failed to share post:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error sharing post:", error)
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    return () => {
      const currentCacheKey = `posts-${userId || session?.user?.id}`
      if (currentCacheKey !== cacheKey) {
        sessionStorage.removeItem(currentCacheKey)
        console.log("Cache cleaned up:", currentCacheKey)
      }
    }
  }, [userId, session?.user?.id, cacheKey])

  const handlePostSubmit = async () => {
    if (!newPost.trim() && !imagePreview) return

    try {
      console.log("=== POST SUBMIT DEBUG START ===")
      const formData = new FormData()
      formData.append("content", newPost)
      if (imageFile) {
        formData.append("image", imageFile)
        console.log("Image file added to form data:", {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type,
        })
      }

      console.log("Form data contents:")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes)`)
        } else {
          console.log(`${key}: ${value}`)
        }
      }

      console.log("Creating new post...")
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      })
      console.log("Create post API URL: /api/posts")
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      if (response.ok) {
        const newPostData = await response.json()
        console.log("New post created:", newPostData)

        // Clear cache to force refresh
        sessionStorage.removeItem(cacheKey)
        console.log("Cache cleared for fresh data")

        const updatedPosts = [newPostData, ...posts]
        setPosts(updatedPosts)
        console.log("Posts state updated, new count:", updatedPosts.length)

        // Save updated posts to cache
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedPosts,
            timestamp: Date.now(),
          }),
        )
        console.log("Updated posts saved to cache")

        setNewPost("")
        setImageFile(null)
        setImagePreview(null)

        toast({
          title: "Success",
          description: "Post created successfully!",
        })
        console.log("✅ Successfully created post")

        // Force refresh posts to verify persistence
        console.log("Force refreshing posts to verify persistence...")
        const targetUserId = userId || session?.user?.id
        if (targetUserId) {
          await fetchPosts(targetUserId, true)
        }
      } else {
        const errorText = await response.text()
        console.error("❌ API Error Response:", errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        const errorMessage = errorData.message || "Failed to create post"
        console.error("❌ Failed to create post:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error("❌ Error creating post:", error)
      console.error("Error stack:", error.stack)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log("=== POST SUBMIT DEBUG END ===")
    }
  }

  const handleLikePost = async (postId: number) => {
    try {
      console.log("=== LIKE POST DEBUG ===")
      console.log(`Liking post with ID: ${postId}`)
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      console.log(`Like post API URL: /api/posts/${postId}/like`)
      console.log("Like response status:", response.status)

      if (response.ok) {
        const updatedPost = await response.json()
        console.log("Post liked:", updatedPost)
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
        console.log("Posts saved to cache")
        console.log("✅ Successfully liked post")
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to like post"
        console.error("❌ Failed to like post:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error liking post:", error)
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageChange = (file: File | null) => {
    console.log("=== IMAGE CHANGE DEBUG ===")
    console.log(
      "File selected:",
      file
        ? {
            name: file.name,
            size: file.size,
            type: file.type,
          }
        : "null",
    )

    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        console.log("✅ Image preview set")
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
      console.log("Image preview cleared")
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
      console.log("=== PROFILE IMAGE UPLOAD DEBUG ===")
      console.log("Uploading profile image...")

      const formData = new FormData()
      formData.append("profileImage", file)

      const response = await fetch("/api/users/profile-image", {
        method: "POST",
        body: formData,
      })
      console.log("Profile image API URL: /api/users/profile-image")
      console.log("Profile image response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Profile image uploaded:", data)

        setUser((prev) =>
          prev
            ? {
                ...prev,
                profileImage: data.imageUrl,
                image: data.imageUrl,
              }
            : null,
        )

        const profileCacheKeys = Object.keys(sessionStorage).filter(
          (key) => key.startsWith("profile-") || key.startsWith("posts-"),
        )
        profileCacheKeys.forEach((key) => sessionStorage.removeItem(key))
        console.log("Profile cache cleared")

        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        })
        console.log("✅ Successfully updated profile picture")
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to upload image"
        console.error("❌ Failed to upload image:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error("❌ Error uploading profile image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProfileImageUploading(false)
      event.target.value = ""
    }
  }

  const handleSaveAbout = async () => {
    try {
      console.log("=== SAVE ABOUT DEBUG ===")
      console.log("Updating about section...")
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about: editedAbout,
        }),
      })
      console.log("Update about API URL: /api/users/profile")
      console.log("About response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("About section updated:", data)
        setUser((prev) => (prev ? { ...prev, about: data.user?.about || editedAbout } : null))
        setIsEditingAbout(false)

        toast({
          title: "Success",
          description: "About section updated successfully!",
        })
        console.log("✅ Successfully updated about section")
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to update about section"
        console.error("❌ Failed to update about section:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error updating about:", error)
      toast({
        title: "Error",
        description: "Failed to update about section. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile) return

    try {
      console.log("=== FOLLOW TOGGLE DEBUG ===")
      console.log(`Toggling follow status for user ID: ${user.id}, isFollowing: ${isFollowing}`)
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      })
      console.log(`Follow toggle API URL: /api/users/${user.id}/follow`)
      console.log("Follow toggle response status:", response.status)

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
        console.log("✅ Successfully toggled follow status")
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || "Failed to toggle follow status"
        console.error("❌ Failed to toggle follow status:", errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("❌ Error toggling follow:", error)
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMessage = async () => {
    if (!user || isOwnProfile) return

    try {
      console.log("=== MESSAGE DEBUG ===")
      console.log(`Creating message channel for user ID: ${user.id}`)
      const response = await fetch("/api/stream/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: user.id }),
      })
      console.log("Create channel API URL: /api/stream/channel")
      console.log("Channel response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Channel created:", data)
        router.push(`/messages/${user.id}`)
        console.log("✅ Successfully created channel")
      } else {
        console.log("Channel creation failed, redirecting anyway")
        router.push(`/messages/${user.id}`)
      }
    } catch (error) {
      console.error("❌ Error creating channel:", error)
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

  // Debug component state
  useEffect(() => {
    console.log("=== COMPONENT STATE DEBUG ===")
    console.log("Posts state:", posts.length)
    console.log("User state:", user ? { id: user.id, username: user.username } : null)
    console.log("Loading state:", loading)
    console.log("Posts loading state:", postsLoading)
    console.log("Session state:", session ? { id: session.user?.id, email: session.user?.email } : null)
  }, [posts, user, loading, postsLoading, session])

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
      {/* Enhanced Mobile-Optimized Hero Section */}
      <div className="relative mb-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl sm:rounded-3xl"></div>

        {/* Content */}
        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* Mobile: Stack profile picture and info vertically */}
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            {/* Profile Picture */}
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

            {/* Profile Info */}
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

                {/* Mobile-optimized Action Buttons */}
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
                          <span className="hidden sm:inline">Following</span>
                          <span className="sm:hidden">Following</span>
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

          {/* About Section - Full width on mobile */}
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

      {/* Mobile-Optimized Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-1 rounded-xl sm:rounded-2xl bg-blue-50 p-1 mb-6">
          <TabsTrigger
            value="posts"
            className="rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium text-sm sm:text-base py-2"
          >
            Posts ({posts.length})
            {postsLoading && <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 sm:space-y-6">
          {/* Posts header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {isOwnProfile ? "Your Posts" : `${user.username}'s Posts`}
            </h2>
            <div className="text-sm text-gray-500">Total: {posts.length}</div>
          </div>

          {/* Mobile-Optimized Post Creation Widget */}
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
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              handleImageChange(file)
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

          {/* Mobile-Optimized Posts */}
          <div className="space-y-4 sm:space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className="rounded-xl sm:rounded-2xl border-blue-100 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden"
                >
                  <CardContent className="p-3 sm:p-6">
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
                                onClick={() => handleDeletePost(post.id)}
                                className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                                title="Delete post"
                              >
                                <svg
                                  className="h-3 w-3 sm:h-4 sm:w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-gray-100 flex-shrink-0"
                              >
                                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          )}
                          {!isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-gray-100 flex-shrink-0"
                            >
                              <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>

                        <p className="text-gray-800 leading-relaxed text-sm sm:text-base break-words">{post.content}</p>

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
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
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
      </Tabs>

      {/* Comments Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-[500px] max-h-[80vh] overflow-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">Comments</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[60vh]">
            {/* Comment Input */}
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

            {/* Comments List */}
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
                        {/* Show delete button only for own comments */}
                        {comment.userId === session?.user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete comment"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
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
