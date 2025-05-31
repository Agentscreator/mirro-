"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Lock, User, MessageSquare, Settings } from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/discover",
      icon: Search,
      label: "Discover",
      active: pathname === "/discover",
    },
    {
      href: "/inner-world",
      icon: Lock,
      label: "Thoughts (Private)",
      active: pathname === "/inner-world",
    },
    {
      href: "/profile",
      icon: User,
      label: "You",
      active: pathname === "/profile",
    },
    {
      href: "/messages",
      icon: MessageSquare,
      label: "Messages",
      active: pathname === "/messages",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      active: pathname === "/settings",
    },
  ]

  return (
    <>
      {/* Desktop navigation (side) */}
      <div className="fixed left-0 top-0 z-50 hidden h-screen w-16 border-r border-blue-100/50 bg-white/80 backdrop-blur-md md:flex md:flex-col md:items-center md:justify-between md:py-6">
        <Link href="/discover" className="flex items-center justify-center">
          <Logo size="md" />
        </Link>
        <div className="flex flex-col items-center space-y-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-blue-500/10",
                route.active && "bg-blue-500/20 blue-glow",
              )}
              aria-label={route.label}
            >
              <route.icon className={cn("h-5 w-5", route.active ? "text-blue-600" : "text-muted-foreground")} />
              <span className="sr-only">{route.label}</span>
            </Link>
          ))}
        </div>
        <div className="h-10"></div> {/* Spacer */}
      </div>

      {/* Mobile navigation (bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-100/50 bg-white/80 backdrop-blur-md pb-safe-bottom md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-full p-2 transition-colors",
                route.active ? "text-blue-600" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  route.active && "bg-blue-500/20 blue-glow",
                )}
              >
                <route.icon className="h-5 w-5" />
              </div>
              <span className="mt-0.5 text-[10px] font-medium">{route.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
