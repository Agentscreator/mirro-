import { PageLayout } from "@/components/page-layout"

export default function AboutPage() {
  return (
    <PageLayout title="About Mirro" subtitle="Discover the story behind our mission to transform digital connection">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Our Story Section */}
        <section className="fade-in-delay-1">
          <h2 className="text-2xl sm:text-3xl font-light text-cyan-200 mb-6 mobile-text-shadow">Our Story</h2>
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-cyan-500/10">
            <div className="space-y-4 text-white/80 text-base sm:text-lg leading-relaxed">
              <p>
                Mirro began with a simple question: What if digital connection could feel as meaningful as in-person
                interaction?
              </p>
              <p>
                Founded in 2025 by a team of technologists, designers, and social scientists, Mirro emerged from a
                shared frustration with existing social platforms that seemed to prioritize engagement metrics over
                genuine human connection.
              </p>
              <p>
                We saw how traditional social media was creating more isolation than connection, more anxiety than joy,
                more division than understanding. And we believed there had to be a better way.
              </p>
              <p>
                Our team set out to build something fundamentally different—a platform designed from the ground up to
                foster meaningful connection, emotional resonance, and authentic expression.
              </p>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="fade-in-delay-2">
          <h2 className="text-2xl sm:text-3xl font-light text-cyan-200 mb-6 mobile-text-shadow">Our Mission</h2>
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-cyan-500/10">
            <div className="space-y-4 text-white/80 text-base sm:text-lg leading-relaxed">
              <p>
                At Mirro, we believe technology should enhance our humanity, not diminish it. Our mission is to create
                digital spaces that reflect the depth, nuance, and beauty of human connection.
              </p>
              <p>We're committed to building technology that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prioritizes quality of connection over quantity of engagement</li>
                <li>Respects user privacy and agency</li>
                <li>Promotes emotional well-being and authentic expression</li>
                <li>Bridges divides rather than amplifying them</li>
                <li>Uses AI to enhance human connection, not replace it</li>
              </ul>
              <p>
                We envision a world where digital connection feels as meaningful, fulfilling, and human as face-to-face
                interaction—where technology brings us closer together rather than driving us further apart.
              </p>
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="fade-in-delay-3">
          <h2 className="text-2xl sm:text-3xl font-light text-cyan-200 mb-6 mobile-text-shadow">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <h3 className="text-xl font-medium text-cyan-300 mb-3">Authenticity</h3>
              <p className="text-white/80">
                We believe in creating spaces where people can be their true selves, without the pressure to perform or
                present a curated image.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <h3 className="text-xl font-medium text-cyan-300 mb-3">Empathy</h3>
              <p className="text-white/80">
                We design with deep empathy for human needs, emotions, and experiences, recognizing the complexity of
                what it means to be human.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <h3 className="text-xl font-medium text-cyan-300 mb-3">Trust</h3>
              <p className="text-white/80">
                We build trust through transparency, consistency, and by always putting our users' interests first.
              </p>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/10">
              <h3 className="text-xl font-medium text-cyan-300 mb-3">Innovation</h3>
              <p className="text-white/80">
                We push the boundaries of what's possible, using technology in service of human connection rather than
                as an end in itself.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
