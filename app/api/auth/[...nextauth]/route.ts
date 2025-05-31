// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/src/lib/auth"

// This correctly sets up the catch-all route handler
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }