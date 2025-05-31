// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path should be protected
  const isProtectedRoute = 
    pathname.startsWith("/discover") || 
    pathname.startsWith("/profile") || 
    pathname.startsWith("/messages")
    
  // Check if the path is an auth route
  const isAuthRoute = 
    pathname.startsWith("/auth/login") || 
    pathname.startsWith("/auth/signup")
    
  // Get the session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // If no token and trying to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If has token and trying to access auth route, redirect to discover
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/discover", request.url))
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Protected routes
    "/discover/:path*", 
    "/profile/:path*", 
    "/messages/:path*",
    // Auth routes
    "/auth/login",
    "/auth/signup"
  ],
}