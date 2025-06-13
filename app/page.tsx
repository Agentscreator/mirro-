import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Particles } from "@/components/particles"
import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/mobile-nav"

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/floating-island.png"
          alt="Floating island with a child looking up"
          fill
          priority
          className="object-cover object-center sm:object-right-top"
        />
      </div>

      {/* Overlay gradient - stronger on mobile */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/80 to-blue-900/50 md:from-blue-900/90 md:via-blue-900/70 md:to-transparent z-10"></div>

      {/* Subtle particles */}
      <Particles className="absolute inset-0 z-20" quantity={30} />

      {/* Content */}
      <div className="relative z-30 w-full h-full flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-5 md:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-cyan-300 text-xl font-bold tracking-wider">Mirro</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="px-6 py-2 text-cyan-300 border border-cyan-300/30 rounded-full hover:bg-cyan-900/20 transition-all">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full text-white font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:translate-y-[-2px]">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
        </nav>

        {/* Hero Section - Optimized for mobile */}
        <div className="flex flex-col px-5 py-8 md:p-10 lg:p-16 md:pt-12 lg:pt-16 grow">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight text-cyan-300 leading-tight tracking-tight mb-6 fade-in">
              <span className="block mobile-text-shadow">Connect.</span>
              <span className="block mobile-text-shadow">Feel.</span>
              <span className="block mobile-text-shadow">Discover.</span>
            </h1>

            <p className="text-white/90 text-base sm:text-lg md:text-xl max-w-2xl mt-4 md:mt-6 leading-relaxed fade-in-delay-1 mobile-text-shadow">
              As humanity reaches new heights of innovation and understanding, Mirro is here to elevate how we connect.
              We're building a platform that stands at the peak of digital interaction — thoughtful, intelligent, and
              human.
            </p>

            {/* Mobile Get Started Button */}
            <div className="mt-8 md:hidden fade-in-delay-1">
              <Link href="/signup">
                <Button size="lg" className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full text-white font-medium text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all transform hover:translate-y-[-2px]">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Desktop Get Started Button */}
            <div className="mt-8 hidden md:block fade-in-delay-1">
              <Link href="/signup">
                <Button size="lg" className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full text-white font-medium text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:translate-y-[-2px]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Vision Section - Optimized for mobile */}
          <div className="max-w-4xl mx-auto mt-12 sm:mt-16 md:mt-24 lg:mt-32 fade-in-delay-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-cyan-200 mb-6 md:mb-8 tracking-wide mobile-text-shadow">
              Our Vision
            </h2>

            <div className="space-y-4 md:space-y-6 text-white/80 text-base sm:text-lg leading-relaxed">
              <p className="max-w-3xl mobile-text-shadow">
                What if technology could make us feel more connected, not less? What if AI could deepen our
                relationships rather than replace them?
              </p>

              <p className="max-w-3xl mobile-text-shadow">
                At Mirro, we believe the future of social connection isn't about more features—it's about more meaning.
                We're building a network that honors the complexity of human emotion, the nuance of real relationships,
                and the beauty of authentic connection.
              </p>

              <p className="max-w-3xl mobile-text-shadow">
                AI isn't just our tool; it's our canvas. We're using it to create experiences that don't just enhance
                what you can do, but transform how you feel when you do it. Every interaction is designed to bring you
                closer to others, not further apart.
              </p>

              <p className="max-w-3xl mobile-text-shadow">
                Mirro isn't another platform competing for your attention. It's a space designed to earn your trust—and
                maybe, eventually, your love.
              </p>
            </div>

            {/* Desktop CTA Button */}
            <div className="mt-12 md:mt-16 hidden md:block">
              <Link href="/signup">
                <Button size="lg" className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full text-white font-medium text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:translate-y-[-2px]">
                  Join Mirro Today
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-30 p-5 md:p-10 text-center">
          <p className="text-cyan-200/70 text-sm md:text-base font-light tracking-widest mobile-text-shadow">
            Where technology meets humanity.
          </p>
        </footer>
      </div>

      {/* Mobile scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 md:hidden animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-cyan-300/50 flex justify-center items-start p-1">
          <div className="w-1.5 h-3 bg-cyan-300/70 rounded-full animate-scroll"></div>
        </div>
      </div>
    </main>
  )
}