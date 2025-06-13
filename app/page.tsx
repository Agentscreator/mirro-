import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Particles } from "@/components/particles"
import { Logo } from "@/components/logo"

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
          className="object-cover"
        />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/70 to-transparent z-10"></div>

      {/* Subtle particles */}
      <Particles className="absolute inset-0 z-20" quantity={50} />

      {/* Content */}
      <div className="relative z-30 w-full h-full flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 md:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-cyan-300 text-xl font-bold tracking-wider">Mirro</span>
          </div>

          <div className="flex items-center gap-4">
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
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col p-6 md:p-10 lg:p-16 pt-8 md:pt-12 lg:pt-16 grow">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight text-cyan-300 leading-tight tracking-tight mb-6 fade-in">
              <span className="block">Connect.</span>
              <span className="block">Feel.</span>
              <span className="block">Discover.</span>
            </h1>

            <p className="text-white/90 text-lg md:text-xl max-w-2xl mt-6 leading-relaxed fade-in-delay-1">
              As humanity reaches new heights of innovation and understanding, Mirro is here to elevate how we connect.
              We're building a platform that stands at the peak of digital interaction — thoughtful, intelligent, and
              human.
            </p>

            <div className="mt-8 fade-in-delay-1">
              <Link href="/signup">
                <Button size="lg" className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full text-white font-medium text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:translate-y-[-2px]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Vision Section */}
          <div className="max-w-4xl mx-auto mt-16 md:mt-24 lg:mt-32 fade-in-delay-2">
            <h2 className="text-3xl md:text-4xl font-light text-cyan-200 mb-8 tracking-wide">Our Vision</h2>

            <div className="space-y-6 text-white/80 text-lg leading-relaxed">
              <p className="max-w-3xl">
                What if technology could make us feel more connected, not less? What if AI could deepen our
                relationships rather than replace them?
              </p>

              <p className="max-w-3xl">
                At Mirro, we believe the future of social connection isn't about more features—it's about more meaning.
                We're building a network that honors the complexity of human emotion, the nuance of real relationships,
                and the beauty of authentic connection.
              </p>

              <p className="max-w-3xl">
                AI isn't just our tool; it's our canvas. We're using it to create experiences that don't just enhance
                what you can do, but transform how you feel when you do it. Every interaction is designed to bring you
                closer to others, not further apart.
              </p>

              <p className="max-w-3xl">
                Mirro isn't another platform competing for your attention. It's a space designed to earn your trust—and
                maybe, eventually, your love.
              </p>
            </div>

            <div className="mt-12 md:mt-16">
              <Link href="/signup">
                <Button size="lg" className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full text-white font-medium text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:translate-y-[-2px]">
                  Join Mirro Today
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-30 p-6 md:p-10 text-center">
          <p className="text-cyan-200/70 text-sm md:text-base font-light tracking-widest">
            Where technology meets humanity.
          </p>
        </footer>
      </div>
    </main>
  )
}