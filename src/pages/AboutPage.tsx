import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import aboutHeroImage from '../assets/About/AP-Dindi_Feature.jpg';

const AboutPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-16">
      {/* Hero */}
      <section 
        className="relative py-32 px-4 flex items-center justify-center min-h-[40vh] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${aboutHeroImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto max-w-4xl text-center relative z-10 mt-8">
          <ScrollReveal>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
              About Our Temple
            </h1>
            <p className="text-xl md:text-2xl text-white/95 font-medium drop-shadow">
              A Sacred Heritage of Devotion
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
