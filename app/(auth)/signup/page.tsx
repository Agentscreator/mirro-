"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { TagSelector } from "@/components/tag-selector"
import { AgeRangeSelector } from "@/components/age-range-selector"
import { TAGS, GENDERS, GENDER_PREFERENCES, PROXIMITY_OPTIONS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [dobError, setDobError] = useState("")
  const [locationStatus, setLocationStatus] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    gender: "",
    genderPreference: "no-preference",
    proximity: "local",
    preferredAgeMin: 18,
    preferredAgeMax: 40,
    interestTags: [] as string[],
    contextTags: [] as string[],
    intentionTags: [] as string[],
    // Location data
    metro_area: "",
    latitude: 0,
    longitude: 0,
    timezone: "",
  })

  // Get user's location and timezone on component mount
  useEffect(() => {
    // Set timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setFormData(prev => ({ ...prev, timezone: userTimezone }))

    // Get user's location
    if (navigator.geolocation) {
      setLocationStatus("Getting your location...")
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Use reverse geocoding to get metro area
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            const data = await response.json()
            
            const metro_area = data.city || data.locality || data.countryName || "Unknown"
            
            setFormData(prev => ({
              ...prev,
              latitude,
              longitude,
              metro_area
            }))
            setLocationStatus(`Location detected: ${metro_area}`)
          } catch (error) {
            console.error("Error getting location details:", error)
            setFormData(prev => ({
              ...prev,
              latitude,
              longitude,
              metro_area: "Unknown"
            }))
            setLocationStatus("Location detected")
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationStatus("Location access denied - using defaults")
          setFormData(prev => ({
            ...prev,
            latitude: 0,
            longitude: 0,
            metro_area: "Unknown"
          }))
        }
      )
    } else {
      setLocationStatus("Geolocation not supported - using defaults")
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear errors when typing
    if (name === "email") {
      setEmailError("")
    }
    if (name === "username") {
      setUsernameError("")
    }
    if (name === "dob") {
      setDobError("")
    }
    setError("")
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAgeRangeChange = (minAge: number, maxAge: number) => {
    setFormData((prev) => ({ ...prev, preferredAgeMin: minAge, preferredAgeMax: maxAge }))
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateDOB = (dob: string) => {
    // Check format DD/MM/YYYY
    const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dob.match(dobRegex)
    
    if (!match) {
      return { valid: false, message: "Please enter date in DD/MM/YYYY format" }
    }

    const [, day, month, year] = match
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    // Check if the date is valid
    if (date.getDate() !== parseInt(day) || 
        date.getMonth() !== parseInt(month) - 1 || 
        date.getFullYear() !== parseInt(year)) {
      return { valid: false, message: "Please enter a valid date" }
    }

    // Check if user is at least 13 years old
    const today = new Date()
    let age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--
    }

    if (age < 13) {
      return { valid: false, message: "You must be at least 13 years old" }
    }

    if (age > 100) {
      return { valid: false, message: "Please enter a valid birth year" }
    }

    return { valid: true, message: "" }
  }

  const formatDOBForAPI = (dob: string) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dob.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const checkUsernameUnique = async (username: string) => {
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
      const data = await response.json()
      return data.available
    } catch (error) {
      console.error("Error checking username:", error)
      return true
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate first step
      if (!validateEmail(formData.email)) {
        setEmailError("Please enter a valid email address")
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long")
        return
      }

      const dobValidation = validateDOB(formData.dob)
      if (!dobValidation.valid) {
        setDobError(dobValidation.message)
        return
      }

      setCurrentStep(2)
    } else if (currentStep === 2) {
      // Validate second step
      if (!formData.gender) {
        setError("Please select your gender")
        return
      }

      setCurrentStep(3)
    } else if (currentStep === 3) {
      // Validate third step
      if (formData.interestTags.length === 0) {
        setError("Please select at least one interest")
        return
      }

      setCurrentStep(4)
    } else if (currentStep === 4) {
      // Validate fourth step
      if (formData.contextTags.length === 0) {
        setError("Please select at least one context")
        return
      }

      setCurrentStep(5)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate final step
    if (formData.intentionTags.length === 0) {
      setError("Please select at least one intention")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Prepare data to match API schema
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname || formData.username,
        dob: formatDOBForAPI(formData.dob),
        gender: formData.gender,
        genderPreference: formData.genderPreference,
        preferredAgeMin: formData.preferredAgeMin,
        preferredAgeMax: formData.preferredAgeMax,
        proximity: formData.proximity,
        timezone: formData.timezone,
        metro_area: formData.metro_area,
        latitude: formData.latitude,
        longitude: formData.longitude,
        interestTags: formData.interestTags,
        contextTags: formData.contextTags,
        intentionTags: formData.intentionTags,
      }

      console.log('Sending registration data:', registrationData)

      // Register user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError)
        throw new Error('Server returned invalid response')
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to register")
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Failed to login after registration")
      }

      // Redirect to discover page
      router.push("/discover")
      router.refresh()
    } catch (error) {
      console.error("Registration error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during registration")
      setLoading(false)
    }
  }

  // Convert readonly TAGS array to mutable array to fix TypeScript error
  const mutableTags = [...TAGS]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 silver-pattern">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2">
        <Logo size="sm" />
        <span className="text-lg font-bold blue-text">Mirro</span>
      </Link>

      <Card className="w-full max-w-2xl premium-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center blue-text">Create your account</CardTitle>
          <CardDescription className="text-center premium-subheading">
            Step {currentStep} of 5:{" "}
            {currentStep === 1
              ? "Basic Information"
              : currentStep === 2
                ? "Preferences"
                : currentStep === 3
                  ? "Your Interests"
                  : currentStep === 4
                    ? "Your Context"
                    : "Your Intentions"}
          </CardDescription>
          {locationStatus && (
            <p className="text-xs text-center text-muted-foreground">{locationStatus}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className={`premium-input ${usernameError ? "border-red-500" : ""}`}
                  />
                  {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    placeholder="How you'd like to be called"
                    value={formData.nickname}
                    onChange={handleChange}
                    className="premium-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`premium-input ${emailError ? "border-red-500" : ""}`}
                  />
                  {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    placeholder="DD/MM/YYYY"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className={`premium-input ${dobError ? "border-red-500" : ""}`}
                    maxLength={10}
                  />
                  {dobError && <p className="text-xs text-red-500">{dobError}</p>}
                  <p className="text-xs text-muted-foreground">Enter your date of birth (you must be 18+)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="premium-input"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="premium-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => handleSelectChange("gender", value)}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                  >
                    {GENDERS.map((gender) => (
                      <div key={gender.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={gender.id} id={`gender-${gender.id}`} />
                        <Label htmlFor={`gender-${gender.id}`}>{gender.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>I'd like to connect with</Label>
                  <RadioGroup
                    value={formData.genderPreference}
                    onValueChange={(value) => handleSelectChange("genderPreference", value)}
                    className="grid grid-cols-3 gap-2"
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
                  <Select value={formData.proximity} onValueChange={(value) => handleSelectChange("proximity", value)}>
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
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-blue-600 dark:text-blue-400">Select your interests</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Choose up to 5 topics that interest you the most</p>
                  <TagSelector
                    tags={mutableTags}
                    selectedTags={formData.interestTags}
                    onChange={(tags) => setFormData((prev) => ({ ...prev, interestTags: tags }))}
                    maxSelections={5}
                    category="interest"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-blue-600 dark:text-blue-400">What's your context?</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Select up to 3 situations that describe where you are in life right now
                  </p>
                  <TagSelector
                    tags={mutableTags}
                    selectedTags={formData.contextTags}
                    onChange={(tags) => setFormData((prev) => ({ ...prev, contextTags: tags }))}
                    maxSelections={3}
                    category="context"
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-blue-600 dark:text-blue-400">
                    What are your intentions?
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">Select up to 3 intentions for using Mirro</p>
                  <TagSelector
                    tags={mutableTags}
                    selectedTags={formData.intentionTags}
                    onChange={(tags) => setFormData((prev) => ({ ...prev, intentionTags: tags }))}
                    maxSelections={3}
                    category="intention"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="rounded-full bg-background/50"
                >
                  Back
                </Button>
              ) : (
                <div></div>
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm premium-text-muted">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="premium-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="premium-link">
              Privacy Policy
            </Link>
          </div>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="premium-link">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}