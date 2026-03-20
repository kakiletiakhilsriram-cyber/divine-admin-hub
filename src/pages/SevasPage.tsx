import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';

const SevasPage = () => {
  const { data: sevas, isLoading } = useQuery({
    queryKey: ['sevas'],
    queryFn: async () => {
      const { data } = await supabase.from('sevas').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <section className="py-24 px-4 temple-gradient-subtle">
          <div className="container mx-auto max-w-4xl text-center">
            <ScrollReveal>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ lineHeight: '1.1' }}>
                Temple Sevas
              </h1>
              <p className="text-muted-foreground">Sacred rituals and services offered at the temple</p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-xl p-6 shadow-md animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : sevas && sevas.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {sevas.map((seva: any, i: number) => (
                  <ScrollReveal key={seva.id} delay={i * 80}>
                    <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                      <h3 className="font-display font-semibold text-foreground text-lg">{seva.title}</h3>
                      {seva.date && <p className="text-xs text-primary mt-1 font-medium">{seva.date}</p>}
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{seva.description}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>No sevas listed yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default SevasPage;
