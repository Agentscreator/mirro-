import { PageLayout } from "@/components/page-layout"
import { Shield, Sparkles, Users, Heart, Zap, Lock } from "lucide-react"

export default function FeaturesPage() {
  return (
    <PageLayout title="Features" subtitle="Discover how Mirro is redefining digital connection">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Core Features Section */}
        <section className="fade-in-delay-1">
          <h2 className="text-2xl sm:text-3xl font-light text-cyan-200 mb-8 mobile-text-shadow text-center">
            Core Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
                <Heart className="h-8 w-8 text-cyan-300" />
              </div>
              <h3 className="text-xl font-medium text-cyan-300 mb-3">Emotional Intelligence</h3>
              <p className="text-white/80">
                Our AI understands emotional context, helping facilitate more meaningful interactions and connections.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
                <Users className="h-8 w-8 text-cyan-300" />
              </div>
              <h3 className="text-xl font-medium text-cyan-300 mb-3">Meaningful Connections</h3>
              <p className="text-white/80">
                Connect with people based on shared values, interests, and emotional resonance, not algorithms.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
                <Lock className="h-8 w-8 text-cyan-300" />
              </div>
              <h3 className="text-xl font-medium text-cyan-300 mb-3">Privacy-First Design</h3>
              <p className="text-white/80">
                Your data remains yours. We've built privacy into the core of our platform, not as an afterthought.
              </p>
            </div>
          </div>
        </section>

        {/* Platform Experience Section */}
        <section className="fade-in-delay-2">
          <h2 className="text-2xl sm:text-3xl font-light text-cyan-200 mb-6 mobile-text-shadow">Platform Experience</h2>
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-cyan-500/10 mb-8">
            <div className="space-y-4 text-white/80 text-base sm:text-lg leading-relaxed">
              <p>
                Mirro reimagines what a digital social experience can be. Our platform is designed to feel like a
                natural extension of human connection, not a replacement for it.
              </p>
              <p>
                Unlike traditional social media that optimizes for time spent and engagement metrics, Mirro optimizes
                for depth of connection and emotional resonance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 mr-4">
                  <Sparkles className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="text-xl font-medium text-cyan-300">Intelligent Spaces</h3>
              </div>
              <p className="text-white/80">
                Dynamic environments that adapt to the nature of your conversations and connections, providing the right
                context for every interaction.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 mr-4">
                  <Zap className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="text-xl font-medium text-cyan-300">Emotional Resonance</h3>
              </div>
              <p className="text-white/80">
                Tools that help you express and understand emotions in digital communication, bridging the gap between
                online and in-person interaction.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 mr-4">
                  <Shield className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="text-xl font-medium text-cyan-300">Safe Environment</h3>
              </div>
              <p className="text-white/80">
                Advanced protection against harassment, misinformation, and manipulation, creating a space where
                authentic connection can flourish.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 mr-4">
                  <Users className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="text-xl font-medium text-cyan-300">Community Focus</h3>
              </div>
              <p className="text-white/80">
                Tools for building and nurturing communities based on shared values, interests, and goals, not just
                content consumption.
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="fade-in-delay-3">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-2xl p-8 border border-cyan-500/20 text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-cyan-200 mb-4 mobile-text-shadow">Coming Soon</h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
              We're constantly evolving and adding new features to enhance your experience on Mirro.
            </p>
            <div className="inline-block rounded-full bg-blue-900/50 backdrop-blur-sm px-6 py-3 text-cyan-300 border border-cyan-500/20">
              Join our waitlist to be the first to experience the future of digital connection
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
