import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';

const AboutPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-24 px-4 temple-gradient-subtle">
        <div className="container mx-auto max-w-4xl text-center">
          <ScrollReveal>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ lineHeight: '1.1' }}>
              About Sri Ramalayam
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A sacred temple dedicated to Lord Rama, located in the serene Yenugupalli Village, Konaseema, Andhra Pradesh.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl space-y-6">
          <ScrollReveal>
            <div className="bg-card rounded-xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Our Heritage</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Established in 1966, Sri Ramalayam Temple has been the spiritual center of Yenugupalli Village for over six decades.
                The temple is dedicated to Lord Seetharamachandra Swamy and serves as a beacon of faith, devotion, and community service.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="bg-card rounded-xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Temple Activities</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                The temple conducts daily pujas, special festivals, and religious ceremonies. Major celebrations include
                Sri Rama Navami, Mukkoti Ekadashi, and the annual temple anniversary. Cultural programs, bhajans,
                and spiritual discourses are regularly organized.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="bg-card rounded-xl p-8 shadow-md">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                To preserve and promote Hindu spiritual traditions, serve the devotee community, and maintain the temple
                as a sacred space for worship, meditation, and cultural activities for generations to come.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
    <Footer />
  </div>
);

export default AboutPage;
