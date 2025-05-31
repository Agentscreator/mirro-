"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, MessageCircle, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/user-card"
import { TypingAnimation } from "@/components/typing-animation"
import type { RecommendedUser } from "@/src/lib/recommendationService"
import { fetchRecommendations, generateExplanation } from "@/src/lib/apiServices"
import type { RecommendedUser as ApiRecommendedUser } from "@/src/lib/apiServices"
import { useRouter } from "next/navigation"
import { debounce } from "lodash"
import { useStreamContext } from "@/components/providers/StreamProvider"
import { toast } from "@/hooks/use-toast"

// Define search user type
interface SearchUser {
  id: string
  username: string
  nickname?: string
  image?: string
  profileImage?: string
}

// Extended RecommendedUser type to include profileImage
interface ExtendedRecommendedUser extends RecommendedUser {
  profileImage?: string
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<ExtendedRecommendedUser[]>([])
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [explanationLoading, setExplanationLoading] = useState<number>(-1)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [messagingUser, setMessagingUser] = useState<string | null>(null)
  const router = useRouter()
  const { client: streamClient, isReady } = useStreamContext()

  // Helper function to get the best available image URL
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

  // Helper function to convert API user to local user type
  const convertApiUserToLocalUser = (apiUser: ApiRecommendedUser): ExtendedRecommendedUser => {
    console.log("Converting API user:", apiUser)
    
    const bestImageUrl = getBestImageUrl(apiUser as any)
    
    return {
      id: apiUser.id,
      username: apiUser.username,
      image: bestImageUrl || "", // Use best image or empty string
      profileImage: (apiUser as any).profileImage,
      reason: apiUser.reason,
      tags: apiUser.tags ?? [],
      score: (apiUser as any).score ?? 0,
    }
  }

  // Search users function
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}&limit=10`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const { users } = await response.json();
        console.log("Search results:", users) // Debug log
        
        // Process search results to ensure consistent image handling
        const processedUsers = users.map((user: any) => ({
          ...user,
          image: getBestImageUrl(user) || "" // Ensure we get the best available image
        }))
        
        setSearchResults(processedUsers);
        setShowSearchResults(true);
      } else {
        console.warn("Search returned status", response.status);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => searchUsers(query), 300),
    [],
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      debouncedSearch(value)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  // Handle search input focus/blur
  const handleSearchFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowSearchResults(true)
    }
  }

  const handleSearchBlur = (e: React.FocusEvent) => {
    // Check if the blur is happening because user clicked inside the dropdown
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget.closest('[data-search-dropdown]')) {
      return // Don't hide if clicking inside dropdown
    }
    setTimeout(() => setShowSearchResults(false), 200)
  }

  // Navigate to user profile
  const handleViewProfile = (userId: string) => {
    setShowSearchResults(false)
    router.push(`/profile/${userId}`)
  }

  // Start conversation with user
  const handleMessage = async (userId: string) => {
    if (!streamClient || !isReady) {
      toast({
        title: "Error",
        description: "Chat is not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    setMessagingUser(userId)
    setShowSearchResults(false)

    try {
      const response = await fetch("/api/stream/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create channel")
      }

      router.push(`/messages/${userId}`)
    } catch (error) {
      console.error("Error creating channel:", error)
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMessagingUser(null)
    }
  }

  // Initial load of recommendations
  useEffect(() => {
    async function loadInitialRecommendations() {
      try {
        setLoading(true)
        const { users: recommendedUsers, hasMore: moreAvailable, nextPage } = await fetchRecommendations(1, 2)
        const usersWithReasons: ExtendedRecommendedUser[] = []
        for (const user of recommendedUsers) {
          const convertedUser = convertApiUserToLocalUser(user)
          convertedUser.reason = await generateExplanation(user)
          usersWithReasons.push(convertedUser)
        }
        setUsers(usersWithReasons)
        setHasMore(moreAvailable)
        setCurrentPage(nextPage ?? 1)
        setExplanationLoading(-1)
      } catch (error) {
        console.error("Failed to load recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialRecommendations()
  }, [])

  // Filter users based on search query
  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))

  // Load more recommendations
  const loadMore = async () => {
    if (!hasMore || loadingMore) return

    try {
      setLoadingMore(true)
      const { users: newUsers, hasMore: moreAvailable, nextPage } = await fetchRecommendations(currentPage, 2)
      const usersWithReasons = [...users]
      const existingUserIds = new Set(users.map(user => user.id))

      for (const newUser of newUsers) {
        // Skip if user already exists
        if (existingUserIds.has(newUser.id)) {
          continue
        }

        let userId = -1
        if (typeof newUser.id === "string") {
          const parsed = Number.parseInt(newUser.id, 10)
          if (!isNaN(parsed)) {
            userId = parsed
          }
        } else if (typeof newUser.id === "number") {
          userId = newUser.id
        }

        if (userId > 0) {
          setExplanationLoading(userId)
        }

        const explanation = await generateExplanation(newUser)
        const convertedUser = convertApiUserToLocalUser(newUser)
        convertedUser.reason = explanation
        usersWithReasons.push(convertedUser)
        existingUserIds.add(newUser.id) // Add to set to track new additions
        setExplanationLoading(-1)
      }

      setUsers(usersWithReasons)
      setHasMore(moreAvailable)
      setCurrentPage(nextPage ?? currentPage)
    } catch (error) {
      console.error("Failed to load more recommendations:", error)
    } finally {
      setLoadingMore(false)
      setExplanationLoading(-1)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <TypingAnimation />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-blue-600">Discover</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for users..."
          className="pl-10 rounded-full border-blue-200 bg-white"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
            data-search-dropdown
          >
            {searchLoading ? (
              <div className="p-4 text-center">
                <TypingAnimation />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((user) => {
                  const imageUrl = getBestImageUrl(user)
                  console.log("Search result image URL:", imageUrl, "for user:", user.username)
                  
                  return (
                    <div
                      key={user.id}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 overflow-hidden rounded-full">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={user.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log("Image failed to load:", imageUrl)
                                  // Fallback to initials if image fails to load
                                  e.currentTarget.style.display = 'none'
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                  if (fallback) fallback.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
                              style={{ display: imageUrl ? 'none' : 'flex' }}
                            >
                              {user.username[0]?.toUpperCase() || "?"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            {user.nickname && <div className="text-sm text-gray-500">{user.nickname}</div>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleViewProfile(user.id)
                            }}
                            className="rounded-full"
                          >
                            <User className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleMessage(user.id)
                            }}
                            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={messagingUser === user.id || !isReady}
                          >
                            {messagingUser === user.id ? (
                              <div className="h-3 w-3 mr-1 animate-spin rounded-full border-b border-white"></div>
                            ) : (
                              <MessageCircle className="h-3 w-3 mr-1" />
                            )}
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No users found</div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {!showSearchResults && (
          <>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                console.log("Rendering user card for:", user.username, "image:", user.image)
                return (
                  <UserCard
                    key={user.id}
                    user={{
                      id: user.id,
                      username: user.username,
                      image: user.image || "", // This should now contain the best available image
                      profileImage: user.profileImage,
                      reason: user.reason || "Calculating why you'd be a good match...",
                      tags: user.tags || [],
                    }}
                    onMessage={() => handleMessage(user.id.toString())}
                    onViewProfile={() => handleViewProfile(user.id.toString())}
                    isMessaging={messagingUser === user.id.toString()}
                  />
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No matching users found</div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="rounded-full border-blue-200 hover:bg-blue-50"
                  disabled={loadingMore}
                >
                  {loadingMore ? <TypingAnimation /> : "Load more"}
                </Button>
              </div>
            )}

            {explanationLoading !== -1 && (
              <div className="text-center text-sm text-gray-500">Generating connection explanation...</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}