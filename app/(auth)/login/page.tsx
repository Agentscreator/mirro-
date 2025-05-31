"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    identifier: "", // Can be either email or username
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Trim the identifier to remove any whitespace
      const trimmedIdentifier = formData.identifier.trim()
      const isEmail = trimmedIdentifier.includes("@")
     
      const result = await signIn("credentials", {
        // Always pass both fields - NextAuth will use whichever one has a value
        email: isEmail ? trimmedIdentifier : "",
        username: isEmail ? "" : trimmedIdentifier,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email/username or password")
      } else if (result?.ok) {
        router.push("/discover")
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 silver-pattern">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2">
        <Logo size="sm" />
        <span className="text-lg font-bold blue-text">Mirro</span>
      </Link>

      <Card className="w-full max-w-md premium-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center blue-text">Welcome back</CardTitle>
          <CardDescription className="text-center premium-subheading">
            Enter your credentials to access your account
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
                name="identifier"
                type="text"
                placeholder="Email or Username"
                value={formData.identifier}
                onChange={handleChange}
                required
                className="premium-input"
                disabled={loading}
                // Add onBlur to trim whitespace as user types
                onBlur={(e) => {
                  const trimmed = e.target.value.trim()
                  if (trimmed !== e.target.value) {
                    setFormData(prev => ({ ...prev, identifier: trimmed }))
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="premium-input"
                disabled={loading}
              />
              <div className="text-right">
                <Link
                  href="/auth/reset-password"
                  className="text-xs premium-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full premium-button" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="premium-link">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}