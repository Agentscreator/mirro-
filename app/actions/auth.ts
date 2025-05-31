"use server"

import { cookies } from "next/headers"

type SignupData = {
  username: string
  email: string
  password: string
  dateOfBirth: string
}

type LoginData = {
  username: string
  password: string
}

export async function signup(data: SignupData) {
  // This would normally connect to Neon PostgreSQL
  // For demo purposes, we're just simulating the API call

  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simulate storing user in database
  console.log("Creating user in database:", data)

  // Set a cookie to simulate authentication
  cookies().set("auth-token", "demo-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return { success: true }
}

export async function login(data: LoginData) {
  // This would normally verify credentials against Neon PostgreSQL
  // For demo purposes, we're just checking hardcoded values

  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Demo credentials check
  if (data.username === "1234" && data.password === "12345678") {
    // Set a cookie to simulate authentication
    cookies().set("auth-token", "demo-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true }
  }

  return { success: false, error: "Invalid credentials" }
}

export async function logout() {
  cookies().delete("auth-token")
  return { success: true }
}
