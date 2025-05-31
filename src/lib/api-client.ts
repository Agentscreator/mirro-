// src/lib/api-client.ts
import { useState, useEffect, useCallback, useRef } from 'react'

export interface ApiResponse<T = any> {
  success?: boolean
  error?: string
  users?: T[]
  data?: T
  [key: string]: any
}

export interface User {
  id: string
  username: string
  nickname?: string
  image?: string
  profileImage?: string
  about?: string
  metro_area?: string
  created_at?: string
  isFollowing?: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private static baseHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      let errorData: any = null

      try {
        errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // If we can't parse the error response, use default message
        errorMessage = response.statusText || errorMessage
      }

      // Map specific HTTP status codes to user-friendly messages
      switch (response.status) {
        case 401:
          errorMessage = 'You need to be logged in to perform this action'
          break
        case 403:
          errorMessage = 'You do not have permission to access this resource'
          break
        case 404:
          errorMessage = 'The requested resource was not found'
          break
        case 500:
          errorMessage = 'A server error occurred. Please try again later'
          break
      }

      throw new ApiError(errorMessage, response.status, errorData?.code)
    }

    try {
      const data = await response.json()
      
      // Check if the API returned an error in the response body
      if (data.error) {
        throw new ApiError(data.error, response.status)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Failed to parse server response')
    }
  }

  static async get<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: this.baseHeaders
    })

    return this.handleResponse<T>(response)
  }

  static async post<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: this.baseHeaders,
      body: data ? JSON.stringify(data) : undefined
    })

    return this.handleResponse<T>(response)
  }

  static async put<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: this.baseHeaders,
      body: data ? JSON.stringify(data) : undefined
    })

    return this.handleResponse<T>(response)
  }

  static async patch<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: this.baseHeaders,
      body: data ? JSON.stringify(data) : undefined
    })

    return this.handleResponse<T>(response)
  }

  static async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.baseHeaders
    })

    return this.handleResponse<T>(response)
  }
}

// User API methods
export class UserApi {
  /**
   * Get a single user by ID
   */
  static async getUser(userId: string): Promise<User> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID provided')
    }

    const response = await ApiClient.get<ApiResponse<User>>(`/api/users/${userId}`)
    
    // Handle the response format from your API
    if (response.id && response.username) {
      // Direct user object in response
      return {
        id: response.id,
        username: response.username,
        nickname: response.nickname,
        image: response.profileImage || response.image,
        profileImage: response.profileImage,
        about: response.about,
        metro_area: response.metro_area,
        created_at: response.created_at,
        isFollowing: response.isFollowing || false
      }
    }

    throw new ApiError('Invalid user data received from server')
  }

  /**
   * Get user profile with optional tags
   */
  static async getUserProfile(userId: string, includeTags = false): Promise<User & { tags?: any[] }> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID provided')
    }

    const url = `/api/users/profile/${userId}${includeTags ? '?includeTags=true' : ''}`
    const response = await ApiClient.get<ApiResponse<User & { tags?: any[] }>>(url)
    
    if (response.id && response.username) {
      return {
        id: response.id,
        username: response.username,
        nickname: response.nickname,
        image: response.profileImage || response.image,
        profileImage: response.profileImage,
        about: response.about,
        metro_area: response.metro_area,
        created_at: response.created_at,
        isFollowing: response.isFollowing || false,
        tags: response.tags
      }
    }

    throw new ApiError('Invalid user profile data received from server')
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(userId: string): Promise<User[]> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID provided')
    }

    const response = await ApiClient.get<ApiResponse<User>>(`/api/users/${userId}/following`)
    
    if (response.users && Array.isArray(response.users)) {
      return response.users.map(user => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        image: user.profileImage || user.image,
        profileImage: user.profileImage,
        about: user.about,
        metro_area: user.metro_area,
        created_at: user.created_at,
        isFollowing: user.isFollowing || false
      }))
    }

    return []
  }

  /**
   * Get followers of a user
   */
  static async getFollowers(userId: string): Promise<User[]> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID provided')
    }

    const response = await ApiClient.get<ApiResponse<User>>(`/api/users/${userId}/followers`)
    
    if (response.users && Array.isArray(response.users)) {
      return response.users.map(user => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        image: user.profileImage || user.image,
        profileImage: user.profileImage,
        about: user.about,
        metro_area: user.metro_area,
        created_at: user.created_at,
        isFollowing: user.isFollowing || false
      }))
    }

    return []
  }

  /**
   * Follow/unfollow a user
   */
  static async toggleFollow(userId: string, follow: boolean): Promise<{ isFollowing: boolean }> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new ApiError('Invalid user ID provided')
    }

    const endpoint = follow ? `/api/users/${userId}/follow` : `/api/users/${userId}/unfollow`
    const response = await ApiClient.post<ApiResponse<{ isFollowing: boolean }>>(endpoint)
    
    return {
      isFollowing: response.isFollowing ?? follow
    }
  }

  /**
   * Search for users
   */
  static async searchUsers(query: string, limit = 10): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString()
    })

    const response = await ApiClient.get<ApiResponse<User>>(`/api/users/search?${params}`)
    
    if (response.users && Array.isArray(response.users)) {
      return response.users.map(user => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        image: user.profileImage || user.image,
        profileImage: user.profileImage,
        about: user.about,
        metro_area: user.metro_area,
        created_at: user.created_at,
        isFollowing: user.isFollowing || false
      }))
    }

    return []
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(file: File): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new ApiError('No file provided for upload')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new ApiError('Only image files are allowed')
    }

    // Validate file size (e.g., 5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new ApiError('Image file size must be less than 5MB')
    }

    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/users/profile-image', {
      method: 'POST',
      credentials: 'include',
      body: formData // Don't set Content-Type header, let browser set it with boundary
    })

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }

      // Map specific HTTP status codes
      switch (response.status) {
        case 401:
          errorMessage = 'You need to be logged in to upload images'
          break
        case 413:
          errorMessage = 'Image file is too large'
          break
        case 415:
          errorMessage = 'Unsupported image format'
          break
        case 500:
          errorMessage = 'Server error occurred during upload'
          break
      }

      throw new ApiError(errorMessage, response.status)
    }

    try {
      const data = await response.json()
      
      if (data.error) {
        throw new ApiError(data.error, response.status)
      }

      if (!data.imageUrl) {
        throw new ApiError('No image URL received from server')
      }

      return { imageUrl: data.imageUrl }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Failed to parse upload response')
    }
  }
}

// Chat API methods
export class ChatApi {
  /**
   * Create or get a chat channel with another user
   */
  static async createChannel(recipientId: string): Promise<{ channelId: string }> {
    if (!recipientId || recipientId === 'undefined' || recipientId === 'null') {
      throw new ApiError('Invalid recipient ID provided')
    }

    const response = await ApiClient.post<{ channelId: string }>('/api/stream/channel', {
      recipientId
    })

    if (!response.channelId) {
      throw new ApiError('No channel ID received from server')
    }

    return response
  }

  /**
   * Get user's chat channels/conversations
   */
  static async getChannels(): Promise<any[]> {
    const response = await ApiClient.get<ApiResponse<any>>('/api/stream/channels')
    return response.channels || response.data || []
  }
}

// React hooks for easier usage

/**
 * Hook for making API calls with loading, error, and data state management
 */
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    let cancelled = false

    const executeApiCall = async () => {
      if (!mountedRef.current) return

      try {
        setLoading(true)
        setError(null)
        
        const result = await apiCall()
        
        if (!cancelled && mountedRef.current) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          const errorMessage = err instanceof ApiError 
            ? err.message 
            : 'An unexpected error occurred'
          setError(errorMessage)
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
        }
      }
    }

    executeApiCall()

    return () => {
      cancelled = true
    }
  }, dependencies)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refetch = useCallback(() => {
    if (!mountedRef.current) return

    const executeApiCall = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await apiCall()
        
        if (mountedRef.current) {
          setData(result)
        }
      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = err instanceof ApiError 
            ? err.message 
            : 'An unexpected error occurred'
          setError(errorMessage)
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    executeApiCall()
  }, [apiCall])

  return { data, loading, error, refetch }
}

/**
 * Hook for making API calls that can be triggered manually
 */
export function useApiMutation<T, P = any>(
  apiCall: (params: P) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mutate = useCallback(async (params: P) => {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      setError(null)
      
      const result = await apiCall(params)
      
      if (mountedRef.current) {
        setData(result)
        return result
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof ApiError 
          ? err.message 
          : 'An unexpected error occurred'
        setError(errorMessage)
        throw err
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [apiCall])

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setData(null)
      setError(null)
      setLoading(false)
    }
  }, [])

  return { data, loading, error, mutate, reset }
}

/**
 * Hook for fetching a single user
 */
export function useUser(userId: string | null) {
  return useApiCall(
    () => {
      if (!userId) throw new ApiError('User ID is required')
      return UserApi.getUser(userId)
    },
    [userId]
  )
}

/**
 * Hook for fetching user profile with tags
 */
export function useUserProfile(userId: string | null, includeTags = false) {
  return useApiCall(
    () => {
      if (!userId) throw new ApiError('User ID is required')
      return UserApi.getUserProfile(userId, includeTags)
    },
    [userId, includeTags]
  )
}

/**
 * Hook for user search with debouncing
 */
export function useUserSearch(query: string, limit = 10, debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  return useApiCall(
    () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        return Promise.resolve([])
      }
      return UserApi.searchUsers(debouncedQuery, limit)
    },
    [debouncedQuery, limit]
  )
}

/**
 * Hook for following/unfollowing users
 */
export function useFollowUser() {
  return useApiMutation<{ isFollowing: boolean }, { userId: string; follow: boolean }>(
    ({ userId, follow }) => UserApi.toggleFollow(userId, follow)
  )
}

/**
 * Hook for uploading profile images
 */
export function useUploadProfileImage() {
  return useApiMutation<{ imageUrl: string }, { file: File }>(
    ({ file }) => UserApi.uploadProfileImage(file)
  )
}

/**
 * Hook for creating chat channels
 */
export function useCreateChannel() {
  return useApiMutation<{ channelId: string }, { recipientId: string }>(
    ({ recipientId }) => ChatApi.createChannel(recipientId)
  )
}

/**
 * Hook for fetching user's chat channels
 */
export function useChannels() {
  return useApiCall(() => ChatApi.getChannels(), [])
}

/**
 * Utility function to handle async operations with error boundaries
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    console.error('API operation failed:', error)
    
    if (fallback !== undefined) {
      return fallback
    }
    
    // Re-throw ApiErrors to let components handle them
    if (error instanceof ApiError) {
      throw error
    }
    
    // Convert other errors to ApiErrors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    )
  }
}

/**
 * Utility to create a cache for API responses
 */
export class ApiCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  static set<T>(key: string, data: T, ttlMinutes = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }

  static clear(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear()
      return
    }
    
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(keyPattern)
    )
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  static has(key: string): boolean {
    const cached = this.cache.get(key)
    
    if (!cached) return false
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

/**
 * Enhanced API call hook with caching support
 */
export function useCachedApiCall<T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  cacheTtlMinutes = 5,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(() => {
    return ApiCache.get<T>(cacheKey)
  })
  const [loading, setLoading] = useState(!ApiCache.has(cacheKey))
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    let cancelled = false

    const executeApiCall = async () => {
      if (!mountedRef.current) return

      // Check cache first
      const cachedData = ApiCache.get<T>(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const result = await apiCall()
        
        if (!cancelled && mountedRef.current) {
          setData(result)
          ApiCache.set(cacheKey, result, cacheTtlMinutes)
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          const errorMessage = err instanceof ApiError 
            ? err.message 
            : 'An unexpected error occurred'
          setError(errorMessage)
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
        }
      }
    }

    executeApiCall()

    return () => {
      cancelled = true
    }
  }, [...dependencies, cacheKey])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const invalidateCache = useCallback(() => {
    ApiCache.clear(cacheKey)
  }, [cacheKey])

  return { data, loading, error, invalidateCache }
}