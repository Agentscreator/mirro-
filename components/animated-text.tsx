"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number // Base delay before animation starts (ms)
  speed?: number // Speed of typing effect (ms per character)
}

export function AnimatedText({ text, className, delay = 300, speed = 30 }: AnimatedTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Reset state
    setDisplayedText("")
    setIsComplete(false)

    let currentIndex = 0

    // Start typing after initial delay
    timeoutRef.current = setTimeout(() => {
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1))
          currentIndex++
          timeoutRef.current = setTimeout(typeNextChar, speed)
        } else {
          setIsComplete(true)
        }
      }

      typeNextChar()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, delay, speed])

  return <p className={cn("text-sm text-gray-700", className, !isComplete ? "typing-cursor" : "")}>{displayedText}</p>
}
