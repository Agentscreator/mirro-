import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { Particles } from "@/components/particles"
import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/mobile-nav"

interface PageLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function PageLayout({ children, title, subtitle }: PageLayoutProps) {
  return (
    <main className="min-h-screen relative overflow-hidden font-sans">
      {/* Desktop Background Image - hidden on mobile */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <Image
          src="/images/floating-island.png"
          alt="Floating island with a child looking up"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      {/* Mobile Background Image - hidden on desktop */}
      <div className="absolute inset-0 z-0 block md:hidden">
        <Image
          src="/images/mobile-floating-island.png"
          alt="Floating island with a child looking up"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      {/* Overlay gradient - stronger on mobile */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/90 to-blue-900/80 md:from-blue-900/90 md:via-blue-900/80 md:to-blue-900/70 z-10"></div>

      {/* Subtle particles */}
      <Particles className="absolute inset-0 z-20" quantity={30} />

      {/* Content */}
      <div className="relative z-30 w-full h-full flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-5 md:p-8 lg:p-10">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-cyan-300 text-xl font-bold tracking-wider">Mirro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-cyan-300 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/features" className="text-cyan-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link
              href="/login"
              className="ml-2 px-6 py-2 text-cyan-300 border border-cyan-300/30 rounded-full hover:bg-cyan-900/20 transition-all"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 text-cyan-300 border border-cyan-300/30 rounded-full hover:bg-cyan-900/20 transition-all"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
        </nav>

        {/* Page Header */}
        <div className="flex flex-col px-5 py-8 md:p-10 lg:p-16 md:pt-12 lg:pt-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extralight text-cyan-300 leading-tight tracking-tight mb-4 fade-in">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/90 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mt-4 leading-relaxed fade-in-delay-1 mobile-text-shadow">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 px-5 md:px-10 lg:px-16 pb-16">{children}</div>

        {/* Footer */}
        <footer className="relative z-30 p-5 md:p-10 text-center border-t border-white/10">
          <p className="text-cyan-200/70 text-sm md:text-base font-light tracking-widest mobile-text-shadow">
            Where technology meets humanity.
          </p>
        </footer>
      </div>
    </main>
  )
}
