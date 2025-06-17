// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path should be protected
  const isProtectedRoute = 
    pathname.startsWith("/feed") || 
    pathname.startsWith("/discover") || 
    pathname.startsWith("/profile") || 
    pathname.startsWith("/messages")
    
  // Check if the path is an auth route
  const isAuthRoute = 
    pathname === "/login" || 
    pathname === "/signup" ||
    pathname === "/auth/reset-password" ||
    pathname === "/auth/new-password" ||
    pathname.startsWith("/auth/reset-password/") ||
    pathname.startsWith("/auth/new-password/")
    
  // Get the session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // If no token and trying to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If has token and trying to access auth route, redirect to feed
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/feed", request.url))
  }
  
  // If has token and at root path, redirect to feed
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/feed", request.url))
  }

  // Special handling for profile routes
  if (token && pathname === "/profile") {
    // If accessing /profile directly, redirect to /profile/[userId]
    return NextResponse.redirect(new URL(`/profile/${token.id}`, request.url))
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Root path
    "/",
    // Protected routes
    "/feed/:path*",
    "/discover/:path*", 
    "/profile/:path*", 
    "/messages/:path*",
    // Auth routes
    "/login",
    "/signup",
    "/auth/reset-password",
    "/auth/new-password",
    "/auth/reset-password/:path*",
    "/auth/new-password/:path*"
  ],
}