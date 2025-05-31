//app/(authenticated)/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Bell, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AgeRangeSelector } from "@/components/age-range-selector"
import { GENDER_PREFERENCES, PROXIMITY_OPTIONS } from "@/lib/constants"
import { TagSelector, type Tag as TagSelectorTag } from "@/components/tag-selector"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  id: string
  username: string
  nickname?: string
  email: string
  about?: string
  metro_area: string
  gender?: string
  genderPreference: string
  preferredAgeMin: number
  preferredAgeMax: number
  proximity: string
  image?: string
  profileImage?: string
}

interface UserTag {
  tagId: number
  tagName: string
  tagCategory: string
}

interface Tag {
  id: string
  name: string
  category: string
  color: string
}

type TagSelectorCompatibleTag = TagSelectorTag

// Gender options for the user's own gender
const GENDER_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-binary" },
  { id: "prefer-not-to-say", label: "Prefer not to say" },
]

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userTags, setUserTags] = useState<UserTag[]>([])
  const [availableTags, setAvailableTags] = useState<TagSelectorCompatibleTag[]>([])
  const [notifications, setNotifications] = useState(true)

  // Form state (removed age)
  const [formData, setFormData] = useState({
    nickname: "",
    gender: "",
    genderPreference: "no-preference",
    preferredAgeMin: 13,
    preferredAgeMax: 40,
    proximity: "local",
  })

  // Tag states by category
  const [interestTags, setInterestTags] = useState<string[]>([])
  const [contextTags, setContextTags] = useState<string[]>([])
  const [intentionTags, setIntentionTags] = useState<string[]>([])

  // Fetch user data and tags
  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.id) {
      router.push("/auth/login")
      return
    }

    fetchUserData()
    fetchTags()
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      // Use the new settings endpoint
      const response = await fetch('/api/users/settings')
      if (!response.ok) throw new Error("Failed to fetch user data")

      const data = await response.json()

      if (data.success && data.user) {
        setUserData(data.user)
        setUserTags(data.tags || [])

        // Set form data with proper defaults (removed age)
        setFormData({
          nickname: data.user.nickname || "",
          gender: data.user.gender || "",
          genderPreference: data.user.genderPreference || "no-preference",
          preferredAgeMin: data.user.preferredAgeMin || 13,
          preferredAgeMax: data.user.preferredAgeMax || 40,
          proximity: data.user.proximity || "local",
        })

        // Organize tags by category
        const interests =
          data.tags
            ?.filter((tag: UserTag) => tag.tagCategory === "interest")
            .map((tag: UserTag) => tag.tagId.toString()) || []
        const contexts =
          data.tags
            ?.filter((tag: UserTag) => tag.tagCategory === "context")
            .map((tag: UserTag) => tag.tagId.toString()) || []
        const intentions =
          data.tags
            ?.filter((tag: UserTag) => tag.tagCategory === "intention")
            .map((tag: UserTag) => tag.tagId.toString()) || []

        setInterestTags(interests)
        setContextTags(contexts)
        setIntentionTags(intentions)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to generate a default color based on category
  const getDefaultColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      interest: "#3b82f6", // blue
      context: "#10b981", // emerald
      intention: "#f59e0b", // amber
    }
    return colorMap[category] || "#6b7280" // default gray
  }

  // Type guard to ensure category is valid
  const isValidTagCategory = (category: string): category is "interest" | "context" | "intention" => {
    return ["interest", "context", "intention"].includes(category)
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (!response.ok) throw new Error("Failed to fetch tags")

      const data = await response.json()
      if (data.tags) {
        // Convert to the format expected by TagSelector, adding color if missing
        const formattedTags: TagSelectorCompatibleTag[] = data.tags
          .filter((tag: any) => isValidTagCategory(tag.category)) // Only include valid categories
          .map((tag: any) => ({
            id: tag.id.toString(),
            name: tag.name,
            category: tag.category as "interest" | "context" | "intention",
            color: tag.color || getDefaultColor(tag.category), // Add default color if missing
          }))
        setAvailableTags(formattedTags)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAgeRangeChange = (minAge: number, maxAge: number) => {
    setFormData((prev) => ({ ...prev, preferredAgeMin: minAge, preferredAgeMax: maxAge }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const allTagIds = [...interestTags, ...contextTags, ...intentionTags]

      // Use the new settings endpoint
      const response = await fetch("/api/users/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tagIds: allTagIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Settings updated successfully",
        })
        // Refresh user data
        await fetchUserData()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="text-center">
        <p>Failed to load user data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl sm:text-3xl font-bold blue-text">Settings</h1>

      <div className="space-y-6">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="premium-heading">Profile Information</CardTitle>
            <CardDescription className="premium-subheading">Update your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={userData.username} disabled className="premium-input bg-muted" />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => handleInputChange("nickname", e.target.value)}
                placeholder="How you'd like to be called"
                className="premium-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {GENDER_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`gender-${option.id}`} />
                    <Label htmlFor={`gender-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="premium-heading">Connection Preferences</CardTitle>
            <CardDescription className="premium-subheading">Customize who you connect with</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>I'd like to connect with</Label>
              <RadioGroup
                value={formData.genderPreference}
                onValueChange={(value) => handleInputChange("genderPreference", value)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                {GENDER_PREFERENCES.map((pref) => (
                  <div key={pref.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={pref.id} id={`pref-${pref.id}`} />
                    <Label htmlFor={`pref-${pref.id}`}>{pref.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <AgeRangeSelector
              minAge={formData.preferredAgeMin}
              maxAge={formData.preferredAgeMax}
              onChange={handleAgeRangeChange}
            />

            <div className="space-y-2">
              <Label>Proximity of recommendations</Label>
              <Select value={formData.proximity} onValueChange={(value) => handleInputChange("proximity", value)}>
                <SelectTrigger className="premium-input">
                  <SelectValue placeholder="Select proximity" />
                </SelectTrigger>
                <SelectContent>
                  {PROXIMITY_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="premium-heading">Your Tags</CardTitle>
            <CardDescription className="premium-subheading">
              Update your interests, context, and intentions to improve connection recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-medium text-blue-600">Your Interests</h3>
              <p className="mb-3 text-sm text-muted-foreground">Choose up to 5 topics that interest you the most</p>
              <TagSelector
                tags={availableTags}
                selectedTags={interestTags}
                onChange={setInterestTags}
                maxSelections={5}
                category="interest"
              />
            </div>

            <div>
              <h3 className="mb-3 text-lg font-medium text-blue-600">Your Context</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Select up to 3 situations that describe where you are in life right now
              </p>
              <TagSelector
                tags={availableTags}
                selectedTags={contextTags}
                onChange={setContextTags}
                maxSelections={3}
                category="context"
              />
            </div>

            <div>
              <h3 className="mb-3 text-lg font-medium text-blue-600">Your Intentions</h3>
              <p className="mb-3 text-sm text-muted-foreground">Select up to 3 intentions for using Mirro</p>
              <TagSelector
                tags={availableTags}
                selectedTags={intentionTags}
                onChange={setIntentionTags}
                maxSelections={3}
                category="intention"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="premium-heading">Notifications</CardTitle>
            <CardDescription className="premium-subheading">Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="notifications" className="premium-text">
                    Enable notifications
                  </Label>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="premium-switch"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="premium-heading">Account</CardTitle>
            <CardDescription className="premium-subheading">Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full rounded-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}