"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Logo } from "./logo"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/30 backdrop-blur-md"
        aria-label="Toggle menu"
      >
        <div className="relative flex h-5 w-6 flex-col items-center justify-between">
          <span
            className={`absolute h-0.5 w-full transform rounded-full bg-cyan-300 transition-all duration-300 ${
              isOpen ? "top-2 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute top-2 h-0.5 w-full rounded-full bg-cyan-300 transition-all duration-300 ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute h-0.5 w-full transform rounded-full bg-cyan-300 transition-all duration-300 ${
              isOpen ? "top-2 -rotate-45" : "top-4"
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-blue-900/95 to-blue-950/95 backdrop-blur-lg"
          >
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <span className="text-cyan-300 text-xl font-bold tracking-wider">Mirro</span>
              </div>
            </div>

            <nav className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
              <Link
                href="/about"
                className="text-2xl font-light text-cyan-300 transition-colors hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="/features"
                className="text-2xl font-light text-cyan-300 transition-colors hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/login"
                className="text-2xl font-light text-cyan-300 transition-colors hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-2xl font-light text-cyan-300 transition-colors hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>
            </nav>

            <div className="p-6 text-center">
              <Link
                href="/signup"
                className="inline-block w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-8 py-3 text-lg font-medium text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30"
                onClick={() => setIsOpen(false)}
              >
                Join Mirro Today
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
