import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import aboutHeroImage from '../assets/About/AP-Dindi_Feature.jpg';
import historyImage from '../assets/Home/templeHeroImage.png';
import missionImage from '../assets/Home/temple_2.png';
import { Clock, MapPin, Users, Heart } from 'lucide-react';

const AboutPage = () => (
  <div className="min-h-screen bg-background">
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

      {/* Our History */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal className="order-2 md:order-1">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">Our History</h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  The Sri Ramalayam Temple has been a cornerstone of spiritual life in Yenugupalli Village for many generations. Established with deep devotion to Lord Rama, the temple has witnessed countless moments of faith, prayer, and divine grace.
                </p>
                <p>
                  Through the ages, the temple has been lovingly maintained by generations of devotees who have dedicated their lives to preserving this sacred space. The architecture reflects traditional South Indian temple design, creating an atmosphere that inspires reverence and spiritual contemplation.
                </p>
                <p>
                  Today, the temple continues to serve as a spiritual beacon, hosting daily worship services, annual festivals, and community gatherings that strengthen the bonds of faith and tradition.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal className="order-1 md:order-2" delay={100}>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src={historyImage} alt="Temple History" className="w-full h-auto object-cover aspect-[4/3] hover:scale-105 transition-transform duration-700" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Highlight Features */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollReveal delay={0}>
              <div className="bg-card rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow border border-border">
                <div className="w-16 h-16 rounded-full bg-[#d03b00] text-white flex items-center justify-center mb-6">
                  <Clock size={28} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Temple Timings</h3>
                <p className="text-sm text-muted-foreground">Morning: 6:00 AM - 12:00 PM<br />Evening: 4:00 PM - 8:00 PM</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="bg-card rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow border border-border">
                <div className="w-16 h-16 rounded-full bg-[#d03b00] text-white flex items-center justify-center mb-6">
                  <MapPin size={28} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Location</h3>
                <p className="text-sm text-muted-foreground">Yenugupalli Village, Andhra Pradesh, India</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="bg-card rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow border border-border">
                <div className="w-16 h-16 rounded-full bg-[#d03b00] text-white flex items-center justify-center mb-6">
                  <Users size={28} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Community Service</h3>
                <p className="text-sm text-muted-foreground">Serving devotees and the community for generations</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="bg-card rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow border border-border">
                <div className="w-16 h-16 rounded-full bg-[#d03b00] text-white flex items-center justify-center mb-6">
                  <Heart size={28} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Daily Pujas</h3>
                <p className="text-sm text-muted-foreground">Regular worship services and special ceremonies</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src={missionImage} alt="Our Mission" className="w-full h-auto object-cover aspect-[4/3] hover:scale-105 transition-transform duration-700" />
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">Our Mission</h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Our mission is to preserve and promote the spiritual teachings of Lord Rama, providing a sacred space where devotees can connect with the divine and find peace, guidance, and spiritual fulfillment.
                </p>
                <p>We are committed to:</p>
                <ul className="space-y-4 ml-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 rounded-full bg-[#d03b00] mt-2 mr-3 shrink-0"></span>
                    <span>Maintaining the temple as a center of spiritual excellence and devotion</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 rounded-full bg-[#d03b00] mt-2 mr-3 shrink-0"></span>
                    <span>Conducting daily pujas and special ceremonies with authenticity and reverence</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 rounded-full bg-[#d03b00] mt-2 mr-3 shrink-0"></span>
                    <span>Organizing cultural and religious festivals that celebrate our heritage</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 rounded-full bg-[#d03b00] mt-2 mr-3 shrink-0"></span>
                    <span>Serving the community through charitable activities and social services</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 rounded-full bg-[#d03b00] mt-2 mr-3 shrink-0"></span>
                    <span>Preserving traditional values while welcoming devotees from all backgrounds</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Temple Activities */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Temple Activities</h2>
            <p className="text-muted-foreground text-lg">Regular worship services and spiritual programs</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-border h-full">
                <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">Daily Pujas</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Morning and evening aartis performed with traditional rituals, including Abhishekam, Alankaram, and Naivedyam offerings to the deities.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-border h-full">
                <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">Special Ceremonies</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Conducting special pujas for devotees on auspicious occasions, festivals, and personal celebrations with proper Vedic procedures.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-border h-full">
                <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">Religious Discourses</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Regular spiritual talks and bhajan sessions sharing the teachings from Ramayana and other sacred texts to inspire devotion.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

    </div>
    <Footer />
  </div>
);

export default AboutPage;
