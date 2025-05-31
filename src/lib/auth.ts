// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { db, withRetry } from "../db";
import { usersTable } from "../db/schema";
import { eq, or } from "drizzle-orm";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorization attempt started");
        
        try {
          if (!credentials?.password) {
            console.log("❌ No password provided");
            return null;
          }

          const { email, username, password } = credentials;
          // Trim whitespace from inputs to handle copy-paste and typing errors
          const identifier = (email || username)?.trim();

          if (!identifier) {
            console.log("❌ No identifier provided after trimming");
            return null;
          }

          console.log(`🔍 Looking for user with identifier: "${identifier}" (length: ${identifier.length})`);

          // Debug: Let's also check what users exist that start with similar text
          if (process.env.NODE_ENV === 'development') {
            try {
              const similarUsers = await db
                .select({ username: usersTable.username, email: usersTable.email })
                .from(usersTable)
                .where(
                  or(
                    eq(usersTable.username, identifier.trim()),
                    eq(usersTable.email, identifier.trim()),
                    // Also check for the identifier without trimming in case DB has spaces
                    eq(usersTable.username, identifier),
                    eq(usersTable.email, identifier)
                  )
                )
                .limit(5);
              console.log('🔍 Similar users found:', similarUsers);
            } catch (debugError) {
              console.log('Debug query failed:', debugError);
            }
          }

          // Optimized query with retry for Neon serverless
          const queryStart = Date.now();
          
          const user = await withRetry(async () => {
            return await db
              .select({
                id: usersTable.id,
                email: usersTable.email,
                username: usersTable.username,
                password: usersTable.password,
                image: usersTable.image,
              })
              .from(usersTable)
              .where(
                or(
                  // Check trimmed identifier first
                  eq(usersTable.email, identifier),
                  eq(usersTable.username, identifier),
                  // Also check original credentials in case DB has spaces
                  eq(usersTable.email, email || ''),
                  eq(usersTable.username, username || '')
                )
              )
              .limit(1);
          }, 2, 300); // 2 retries with 300ms delay

          const queryTime = Date.now() - queryStart;
          console.log(`⏱️ Database query took: ${queryTime}ms`);

          if (!Array.isArray(user) || !user[0]) {
            console.log("❌ User not found");
            return null;
          }

          console.log(`👤 User found: ${user[0].email}`);

          // Password comparison with timeout
          const compareStart = Date.now();
          
          const passwordMatch = await Promise.race([
            compare(password, user[0].password),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Password comparison timeout')), 5000)
            )
          ]);

          const compareTime = Date.now() - compareStart;
          console.log(`⏱️ Password comparison took: ${compareTime}ms`);

          if (!passwordMatch) {
            console.log("❌ Password mismatch");
            return null;
          }

          console.log("✅ Authentication successful");

          return {
            id: user[0].id.toString(),
            email: user[0].email,
            username: user[0].username,
            image: user[0].image || null,
          };
        } catch (error) {
          console.error("🚨 Authorization error:", error instanceof Error ? error.message : String(error));
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.id;
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.username = token.username;
          session.user.image = token.image;
        }
        return session;
      } catch (error) {
        console.error("🚨 Session callback error:", error instanceof Error ? error.message : String(error));
        return session;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.username;
          token.username = user.username;
          token.image = user.image;
        }
        return token;
      } catch (error) {
        console.error("🚨 JWT callback error:", error instanceof Error ? error.message : String(error));
        return token;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export const auth = () => getServerSession(authOptions);

// TypeScript declarations remain the same
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      username: string;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    username: string;
    image?: string | null;
  }
}