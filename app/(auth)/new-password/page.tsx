"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"

export default function NewPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate password
      if (password.length < 8) {
        setError("Password must be at least 8 characters long")
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }

      if (!token) {
        setError("Invalid reset token")
        setLoading(false)
        return
      }

      // Call API to update password
      const response = await fetch("/api/auth/new-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to reset password")
      }
    } catch (error) {
      console.error("New password error:", error)
      setError("An error occurred while setting your new password")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 silver-pattern">
        <Link href="/" className="absolute left-4 top-4 flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-lg font-bold blue-text">Mirro</span>
        </Link>

        <Card className="w-full max-w-md premium-card">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center blue-text">Password Updated!</CardTitle>
            <CardDescription className="text-center premium-subheading">
              Your password has been successfully reset. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 silver-pattern">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2">
        <Logo size="sm" />
        <span className="text-lg font-bold blue-text">Mirro</span>
      </Link>

      <Card className="w-full max-w-md premium-card">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Lock className="h-16 w-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center blue-text">Set New Password</CardTitle>
          <CardDescription className="text-center premium-subheading">
            Please enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="premium-input"
                disabled={loading}
              />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="premium-input"
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full premium-button" 
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? "Setting new password..." : "Set new password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-sm premium-link"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 