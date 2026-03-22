import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import eventsHeroImage from '../assets/Events/eventsHeroImage.png';

const EventsPage = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <section 
          className="relative py-32 px-4 flex items-center justify-center min-h-[40vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${eventsHeroImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="container mx-auto max-w-4xl text-center relative z-10 mt-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
                Events & Festivals
              </h1>
              <p className="text-xl md:text-2xl text-white/95 font-medium drop-shadow">
                Celebrate Divine Occasions with Us
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4 bg-background overflow-hidden relative">
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal className="text-center mb-24 mt-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Upcoming Festivals</h2>
              <p className="text-muted-foreground text-lg">Join us in celebrating sacred occasions and experience divine blessings</p>
            </ScrollReveal>

            {isLoading ? (
              <div className="space-y-20">
                {[1, 2].map((i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-12 animate-pulse">
                    <div className="w-full md:w-1/2 h-64 bg-muted rounded-2xl" />
                    <div className="flex-1 space-y-4">
                      <div className="h-6 bg-muted rounded w-1/4" />
                      <div className="h-10 bg-muted rounded w-3/4" />
                      <div className="h-24 bg-muted rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-32">
                {events.map((event: any, i: number) => {
                  const isEven = i % 2 === 0;

                  return (
                    <div key={event.id} className={`flex flex-col gap-12 md:gap-16 items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      
                      {/* Image Output Container */}
                      <div className="relative w-full md:w-1/2 shrink-0">
                        {/* Divine Glow Animation */}
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 1.4] }}
                          transition={{ duration: 2, ease: "easeOut", times: [0, 0.4, 1] }}
                          viewport={{ once: true, margin: "-10%" }}
                          className="absolute inset-0 bg-gradient-to-tr from-[#d03b00]/40 to-yellow-400/30 rounded-full blur-[60px] z-0 -m-8"
                        />

                        {event.image_url && (
                          <motion.div 
                            initial={{ opacity: 0, x: isEven ? -60 : 60 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            viewport={{ once: true, margin: "-10%" }}
                            className="relative z-10 rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] max-h-[450px]"
                          >
                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700" />
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Text Content */}
                      <motion.div 
                        initial={{ opacity: 0, x: isEven ? 60 : -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true, margin: "-10%" }}
                        className="flex-1 relative z-10 w-full"
                      >
                        <div className="flex flex-col gap-3 mb-6 mt-6 md:mt-0">
                          <div className="flex items-center gap-2 text-[#d03b00] font-semibold text-base">
                            <Calendar className="w-5 h-5" />
                            {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                            <Clock className="w-4 h-4" />
                            {event.time || "8:00 AM - 10:00 PM"}
                          </div>
                        </div>

                        <h3 className="font-display font-semibold text-foreground text-4xl mb-6">{event.title}</h3>
                        
                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                          {event.description}
                        </p>

                        <div className="space-y-4 bg-muted/20 p-6 rounded-xl border border-border/50">
                          <h4 className="font-display text-xl font-semibold text-foreground">Event Highlights</h4>
                          <ul className="space-y-3">
                            {(event.highlights || ['Special Abhishekam', 'Ramayana Parayanam']).map((highlight: string, idx: number) => (
                              <li key={idx} className="flex items-start text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-[#d03b00] mt-2 mr-3 shrink-0 shadow-sm shadow-[#d03b00]/50"></span>
                                <span className="text-base">{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>No upcoming events. Check back soon!</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;
