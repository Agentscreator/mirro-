import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Sparkles, Users } from "lucide-react"
import { Logo } from "@/components/logo"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col silver-pattern">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Logo size="md" />
          <span className="text-xl font-bold blue-text">Mirro</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-blue-500/10 rounded-full">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="premium-button">Sign Up</Button>
          </Link>
        </div>
      </header>
      <main className="container flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-4xl py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight blue-text md:text-5xl">Discover. Connect. Feel.</h1>
              <p className="mb-6 text-lg premium-text-muted">
                As humanity reaches new heights of innovation and understanding, Mirro is here to elevate how we connect. We're building a platform that stands at the peak of digital interaction — thoughtful, intelligent, and human.
              </p>
              <div className="mt-8">
                <Link href="/signup">
                  <Button size="lg" className="premium-button px-8 py-6 text-lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <Logo size="lg" className="h-64 w-64" />
                <div
                  className="absolute inset-0 rounded-full animate-pulse opacity-50"
                  style={{
                    background: "radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* What is Mirro Section */}
        <section className="py-16 bg-blue-50/50 rounded-3xl">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold blue-text">Discover</h2>
            <p className="text-center text-lg premium-text-muted max-w-3xl mx-auto">
              Let’s find people who resonate with us — not just follow us. Let’s make digital connection feel real.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="premium-card p-6 premium-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-blue-600 dark:text-blue-400">Privacy</h3>
                <p className="text-sm premium-text-muted">
                  Unlike traditional social media, Mirro puts you in control. Your data remains yours. Your connections
                  are intentional. Your experience prioritizes depth over distraction.
                </p>
              </div>
              <div className="premium-card p-6 premium-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-blue-600 dark:text-blue-400">A New Age</h3>
                <p className="text-sm premium-text-muted">
                  As humanity soars to previously inconceivable heights of civilizational achievement, Mirro will be the
                  wings that allow us to reach those heights. We're creating a social network that stands at the
                  pinnacle of digital connection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 bg-blue-50/50 rounded-3xl">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold blue-text">Join Us in Redefining Digital Connection</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="premium-card p-6 premium-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-blue-600 dark:text-blue-400">Discover</h3>
                <p className="text-sm premium-text-muted">
                  Let's connect with people who resonate with us on a meaningful level. Let our interactions be
                  authentic and purposeful.
                </p>
              </div>
              <div className="premium-card p-6 premium-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path>
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-blue-600 dark:text-blue-400">Hope</h3>
                <p className="text-sm premium-text-muted">
                  Let's build a platform that stands beyond all others in the digital age—a standard for what users
                  deserve in a social network.
                </p>
              </div>
              <div className="premium-card p-6 premium-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-blue-600 dark:text-blue-400">Mission</h3>
                <p className="text-sm premium-text-muted">
                  The Mirro team is committed to serving users by harnessing generative AI and its capabilities to
                  benefit humanity and connect the world in ways never before possible.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Link href="/signup">
                <Button className="premium-button px-8 py-4 text-lg">Join Mirro Today</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t glass-effect py-6">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="premium-text-muted hover:text-blue-600 dark:hover:text-blue-400">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-8 text-center">
            <p className="text-sm premium-text-muted">© {new Date().getFullYear()} Mirro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
