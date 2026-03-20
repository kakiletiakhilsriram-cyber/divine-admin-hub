import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';

const galleryFallback = [
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeArch2-L1EZ2wEL.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeArch3-CjB0akZN.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior1-n7KheSpe.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior2-DeczylcC.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/templeInterior3-DOvxKLt6.png',
  'https://sree-seetharamachandra-swamy.vercel.app/assets/festival1-Dkw4HfUY.png',
];

const GalleryPage = () => {
  const { data: galleryItems, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const hasDbItems = galleryItems && galleryItems.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <section className="py-24 px-4 temple-gradient-subtle">
          <div className="container mx-auto max-w-4xl text-center">
            <ScrollReveal>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ lineHeight: '1.1' }}>
                Temple Gallery
              </h1>
              <p className="text-muted-foreground">Glimpses of divine moments and sacred celebrations</p>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[4/3] bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(hasDbItems ? galleryItems : galleryFallback.map((url, i) => ({ id: i, media_url: url, title: `Temple ${i + 1}` }))).map((item: any, i: number) => (
                  <ScrollReveal key={item.id} delay={i * 60}>
                    <div className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group aspect-[4/3]">
                      <img src={item.media_url} alt={item.title || 'Gallery'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default GalleryPage;
