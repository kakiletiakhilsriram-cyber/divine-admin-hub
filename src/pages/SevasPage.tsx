import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { ExternalLink } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const SevasPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
          <div className="container mx-auto max-w-5xl">
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-2xl shadow-md animate-pulse overflow-hidden">
                    <div className="h-52 bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-10 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sevas && sevas.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {sevas.map((seva: any, i: number) => (
                  <ScrollReveal key={seva.id} delay={i * 100}>
                    <div className="bg-card rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                      {/* Image Banner */}
                      <div
                        className="relative h-52 bg-muted overflow-hidden cursor-pointer"
                        onClick={() => seva.image_url && setSelectedImage(seva.image_url)}
                      >
                        {seva.image_url ? (
                          <img
                            src={seva.image_url}
                            alt={seva.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full temple-gradient opacity-30" />
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        {/* Text on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <h3 className="font-display font-bold text-white text-xl leading-tight">
                            {seva.title}
                          </h3>
                          {seva.subtitle && (
                            <p className="text-white/70 text-sm mt-1 font-medium">{seva.subtitle}</p>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        {seva.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {seva.description}
                          </p>
                        )}
                        {seva.drive_link && (
                          <a
                            href={seva.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2.5 rounded-lg temple-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity"
                          >
                            View Photos & Videos <ExternalLink className="w-4 h-4 inline-block ml-1 -mt-0.5" />
                          </a>
                        )}
                      </div>
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

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-1 bg-black/90 border-none">
          {selectedImage && (
            <img src={selectedImage} alt="Seva" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SevasPage;
