"use client"

import { useEffect, useState } from "react"

interface TypingAnimationProps {
  dots?: number
  speed?: number
}

export function TypingAnimation({ dots = 3, speed = 500 }: TypingAnimationProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => (prev + 1) % (dots + 1))
    }, speed)

    return () => clearInterval(interval)
  }, [dots, speed])

  return (
    <span className="inline-flex items-center">
      <span className="text-2xl font-light tracking-wider bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 bg-clip-text text-transparent drop-shadow-sm">
        Thinking
      </span>
      <span className="ml-2 text-sky-500">
        {Array(count)
          .fill(".")
          .map((dot, i) => (
            <span
              key={i}
              className="inline-block animate-pulse text-xl font-bold"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {dot}
            </span>
          ))}
      </span>
      <span className="inline-block w-6"></span>
    </span>
  )
}
