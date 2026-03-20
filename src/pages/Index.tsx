import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

const HERO_IMAGE = 'https://sree-seetharamachandra-swamy.vercel.app/assets/templeArch1-BMGjgUGS.png';
const TEMPLE_IMAGE = 'https://sree-seetharamachandra-swamy.vercel.app/assets/temple_2-CUF5XeKU.png';

const deities = [
  { name: 'Lord Rama', desc: 'The seventh avatar of Vishnu, embodiment of dharma and righteousness.', image: 'https://d3ehumack2xlu4.cloudfront.net/uploads/products/1737528546.Ramar%20Pattabhishekam%20Photo%20Frame.jpg' },
  { name: 'Goddess Sita', desc: 'The divine consort of Lord Rama, symbol of purity and devotion.', image: 'https://i.pinimg.com/474x/5c/fa/5a/5cfa5ad47ea68bc67a94047cde6ad4b2.jpg' },
  { name: 'Lakshmana', desc: 'The devoted brother of Rama, epitome of loyalty and service.', image: 'https://sree-seetharamachandra-swamy.vercel.app/assets/lakshmana-Dtnn4uSU.jpg' },
  { name: 'Lord Hanuman', desc: 'The ultimate devotee, symbol of strength and unwavering faith.', image: 'https://t3.ftcdn.net/jpg/13/98/33/96/360_F_1398339672_myfUYPdopTzVJHfCjNOM0qKjDje4e8FU.jpg' },
];

const galleryImages = [
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeArch2-L1EZ2wEL.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeArch3-CjB0akZN.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior1-n7KheSpe.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior2-DeczylcC.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior3-DOvxKLt6.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/festival1-Dkw4HfUY.png',
];

const Index = () => {
  const { data: events } = useQuery({
    queryKey: ['events-home'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true }).limit(3);
      return data || [];
    },
  });

  const { data: sevas } = useQuery({
    queryKey: ['sevas-home'],
    queryFn: async () => {
      const { data } = await supabase.from('sevas').select('*').order('created_at', { ascending: false }).limit(4);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Sri Ramalayam Temple" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-temple-dark/60" />
        </div>
        <div className="relative text-center px-4 max-w-3xl" style={{ animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-temple-cream mb-2" style={{ lineHeight: '1.1' }}>
            Sree Seethaaramachandra Swamy
          </h1>
          <p className="font-display text-xl md:text-2xl text-temple-gold/90 mb-2">
            శ్రీ సీతా రామచంద్ర స్వామి
          </p>
          <p className="text-temple-cream/80 text-lg mb-2">Yenugupalli Village</p>
          <p className="text-temple-cream/60 text-sm mb-8">A sacred place of devotion and peace</p>
          <Link to="/about">
            <Button className="temple-gradient text-primary-foreground px-8 py-3 h-auto text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-shadow active:scale-[0.97]">
              Explore Temple <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 temple-gradient-subtle">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-8 text-foreground">
              Our Sacred Heritage
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <ScrollReveal delay={100}>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>Sri Ramalayam Temple stands as a beacon of spiritual devotion in Yenugupalli Village, dedicated to Lord Rama and his divine family. For generations, this sacred space has been the heart of our community&apos;s spiritual life.</p>
                <p>Built with devotion and maintained through the collective faith of countless devotees, our temple continues to serve as a place of worship, meditation, and cultural preservation.</p>
                <p className="text-xs">1966 లో స్థాపించబడిన పవిత్ర ప్రార్థనా స్థలం మరియు సమాజం అయిన ఏనుగుపల్లిలోని రామాలయానికి స్వాగతం.</p>
                <Link to="/about" className="inline-flex items-center text-primary font-medium text-sm hover:underline">
                  Learn More About Us <ArrowRight className="ml-1 w-3 h-3" />
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img src={TEMPLE_IMAGE} alt="Temple Architecture" className="w-full h-72 object-cover" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Deities Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3 text-foreground">Divine Deities</h2>
            <p className="text-center text-muted-foreground mb-10 text-sm">Worship and seek blessings from the divine presence at our temple</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {deities.map((deity, i) => (
              <ScrollReveal key={deity.name} delay={i * 80}>
                <div className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img src={deity.image} alt={deity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-sm text-foreground">{deity.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{deity.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-4 temple-gradient-subtle">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3 text-foreground">Temple Gallery</h2>
            <p className="text-center text-muted-foreground mb-10 text-sm">Glimpses of divine moments and sacred celebrations</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((img, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group aspect-[4/3]">
                  <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/gallery">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                View Full Gallery <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3 text-foreground">Upcoming Events</h2>
            <p className="text-center text-muted-foreground mb-10 text-sm">Join us in celebrating sacred festivals</p>
          </ScrollReveal>

          {events && events.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event: any, i: number) => (
                <ScrollReveal key={event.id} delay={i * 80}>
                  <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                    {event.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-primary mb-2">
                        <Calendar className="w-3 h-3" />
                        {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                      </div>
                      <h3 className="font-display font-semibold text-foreground">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No upcoming events scheduled. Check back soon!</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Sevas Section */}
      {sevas && sevas.length > 0 && (
        <section className="py-20 px-4 temple-gradient-subtle">
          <div className="container mx-auto max-w-5xl">
            <ScrollReveal>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3 text-foreground">Temple Sevas</h2>
              <p className="text-center text-muted-foreground mb-10 text-sm">Sacred rituals and services</p>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-5">
              {sevas.map((seva: any, i: number) => (
                <ScrollReveal key={seva.id} delay={i * 80}>
                  <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="font-display font-semibold text-foreground text-lg">{seva.title}</h3>
                    {seva.date && <p className="text-xs text-primary mt-1">{seva.date}</p>}
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{seva.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/sevas">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                  View All Sevas <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
