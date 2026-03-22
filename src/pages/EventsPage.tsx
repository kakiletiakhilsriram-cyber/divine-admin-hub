import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Calendar } from 'lucide-react';
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
            <ScrollReveal>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
                Events & Festivals
              </h1>
              <p className="text-xl md:text-2xl text-white/95 font-medium drop-shadow">
                Celebrate Divine Occasions with Us
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {isLoading ? (
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl p-6 shadow-md animate-pulse">
                    <div className="h-5 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-6 bg-muted rounded w-1/2 mb-3" />
                    <div className="h-12 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-5">
                {events.map((event: any, i: number) => (
                  <ScrollReveal key={event.id} delay={i * 80}>
                    <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col md:flex-row">
                      {event.image_url && (
                        <div className="md:w-64 h-48 md:h-auto overflow-hidden shrink-0">
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-6 flex-1">
                        <div className="flex items-center gap-2 text-xs text-primary mb-2 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                        <h3 className="font-display font-semibold text-foreground text-xl">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
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
