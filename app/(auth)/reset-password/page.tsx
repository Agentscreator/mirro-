//app/(auth)/reset-password/page.tsx

"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Trim the email to remove any whitespace
      const trimmedEmail = email.trim()
      
      // Basic email validation
      if (!trimmedEmail.includes("@")) {
        setError("Please enter a valid email address")
        setLoading(false)
        return
      }

      // Call your reset password API endpoint
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
        }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const data = await response.json()
        setError(data.error || "An error occurred while sending the reset email")
      }
    } catch (error) {
      console.error("Reset password error:", error)
      setError("An error occurred while sending the reset email")
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
            <CardTitle className="text-2xl font-bold text-center blue-text">Check your email</CardTitle>
            <CardDescription className="text-center premium-subheading">
              We've sent password reset instructions to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm premium-text-muted">
              <p>Didn't receive the email? Check your spam folder or</p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail("")
                }}
                className="premium-link"
              >
                try again
              </button>
            </div>
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 silver-pattern">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2">
        <Logo size="sm" />
        <span className="text-lg font-bold blue-text">Mirro</span>
      </Link>

      <Card className="w-full max-w-md premium-card">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center blue-text">Reset your password</CardTitle>
          <CardDescription className="text-center premium-subheading">
            Enter your email address and we'll send you a link to reset your password
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
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="premium-input"
                disabled={loading}
                onBlur={(e) => {
                  const trimmed = e.target.value.trim()
                  if (trimmed !== e.target.value) {
                    setEmail(trimmed)
                  }
                }}
              />
            </div>
            <Button type="submit" className="w-full premium-button" disabled={loading || !email.trim()}>
              {loading ? "Sending..." : "Send reset link"}
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