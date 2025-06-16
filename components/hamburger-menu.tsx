"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Menu, Settings, CreditCard, HelpCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface HamburgerMenuProps {
  className?: string
}

export function HamburgerMenu({ className }: HamburgerMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleAccountSettings = () => {
    router.push("/settings")
    setIsOpen(false)
  }

  const handlePlanBilling = () => {
    router.push("/billing")
    setIsOpen(false)
  }

  const handleHelpSupport = () => {
    router.push("/help")
    setIsOpen(false)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-10 w-10 rounded-full hover:bg-blue-50 text-blue-600 transition-all duration-200", className)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white/95 backdrop-blur-xl border-blue-100/50 shadow-xl rounded-xl"
        sideOffset={8}
      >
        <DropdownMenuItem
          onClick={handleAccountSettings}
          className="flex items-center gap-3 px-4 py-3 text-blue-700 hover:bg-blue-50 cursor-pointer rounded-lg mx-1 my-1"
        >
          <Settings className="h-4 w-4" />
          <span className="font-medium">Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handlePlanBilling}
          className="flex items-center gap-3 px-4 py-3 text-blue-700 hover:bg-blue-50 cursor-pointer rounded-lg mx-1 my-1"
        >
          <CreditCard className="h-4 w-4" />
          <span className="font-medium">Plan & Billing</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleHelpSupport}
          className="flex items-center gap-3 px-4 py-3 text-blue-700 hover:bg-blue-50 cursor-pointer rounded-lg mx-1 my-1"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="font-medium">Help/Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-blue-100/50" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 cursor-pointer rounded-lg mx-1 my-1"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
