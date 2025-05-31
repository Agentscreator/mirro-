import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 overflow-hidden rounded-full bg-blue-gradient blue-glow">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M50 0A50 50 0 0 1 100 50 50 50 0 0 1 50 100 50 50 0 0 1 0 50"
            fill="none"
            stroke="white"
            strokeWidth="12"
            strokeDasharray="209 105"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
