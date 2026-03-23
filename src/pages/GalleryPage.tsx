import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import overlayImage from '../assets/gallery/overlay.jpg';

const CATEGORY_ORDER = [
  { key: 'architecture', label: 'Temple Architecture' },
  { key: 'interior', label: 'Temple Interior' },
  { key: 'festivals', label: 'Festivals & Celebrations' },
  { key: 'trustees', label: 'Trustee & Devotees' },
];

const galleryFallback = [
  { id: 'f1', media_url: 'https://sree-seetharamachandra-swamy.vercel.app/assets/templeArch2-L1EZ2wEL.png', title: 'Temple Architecture 1', category: 'architecture' },
  { id: 'f2', media_url: 'https://sree-seetharamachandra-swamy.vercel.app/assets/templeArch3-CjB0akZN.png', title: 'Temple Architecture 2', category: 'architecture' },
  { id: 'f3', media_url: 'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior1-n7KheSpe.png', title: 'Temple Interior 1', category: 'interior' },
  { id: 'f4', media_url: 'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior2-DeczylcC.png', title: 'Temple Interior 2', category: 'interior' },
  { id: 'f5', media_url: 'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior3-DOvxKLt6.png', title: 'Temple Interior 3', category: 'interior' },
  { id: 'f6', media_url: 'https://sree-seetharamachandra-swamy.vercel.app/assets/festival1-Dkw4HfUY.png', title: 'Festival 1', category: 'festivals' },
];

const GalleryPage = () => {
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  const { data: galleryItems, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const hasDbItems = galleryItems && galleryItems.length > 0;
  const items = hasDbItems
    ? galleryItems.map((item: any) => ({ ...item, category: item.category || 'architecture' }))
    : galleryFallback;

  const groupedItems = CATEGORY_ORDER.map((cat) => ({
    ...cat,
    images: items.filter((item: any) => item.category === cat.key),
  })).filter((cat) => cat.images.length > 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <section 
          className="relative py-32 px-4 flex items-center justify-center min-h-[40vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${overlayImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mt-8">
            <ScrollReveal>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
                Temple Gallery
              </h1>
              <p className="text-xl md:text-2xl text-white/95 font-medium drop-shadow">
                Glimpses of Divine Moments
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Gallery Sections */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="space-y-16">
                {[1, 2, 3].map((s) => (
                  <div key={s}>
                    <div className="h-8 bg-muted rounded w-48 mx-auto mb-8 animate-pulse" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-20">
                {groupedItems.map((section, sIdx) => (
                  <div key={section.key}>
                    <ScrollReveal>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10 italic">
                        {section.label}
                      </h2>
                    </ScrollReveal>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {section.images.map((item: any, i: number) => (
                        <ScrollReveal key={item.id} delay={i * 80}>
                          <div
                            className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer bg-card border border-border"
                            onClick={() => setLightbox({ url: item.media_url, title: item.title || section.label })}
                          >
                            <div className="aspect-[4/3] overflow-hidden">
                              <img
                                src={item.media_url}
                                alt={item.title || section.label}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Experience the Divine CTA */}
        <section className="py-16 px-4 temple-gradient-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Experience the Divine
              </h2>
              <p className="text-muted-foreground">
                Visit Sri Ramalayam Temple to witness these beautiful moments in person
              </p>
            </ScrollReveal>
          </div>
        </section>
      </div>
      <Footer />

      {/* Lightbox Modal */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-2 right-2 z-50 bg-foreground/60 hover:bg-foreground/80 text-background rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {lightbox && (
            <img
              src={lightbox.url}
              alt={lightbox.title}
              className="w-full max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
