import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';

const deities = [
  {
    name: 'Lord Rama',
    subtitle: 'The Seventh Avatar of Vishnu',
    description: 'Lord Rama is the embodiment of dharma (righteousness) and the ideal king. His life as depicted in the Ramayana serves as a moral compass for millions. He represents truth, virtue, and unwavering devotion to duty.',
    image: 'https://d3ehumack2xlu4.cloudfront.net/uploads/products/1737528546.Ramar%20Pattabhishekam%20Photo%20Frame.jpg',
    attributes: ['Righteousness', 'Compassion', 'Wisdom', 'Valor'],
  },
  {
    name: 'Goddess Sita',
    subtitle: 'The Divine Consort',
    description: 'Goddess Sita is revered as the epitome of purity, devotion, and virtue. Her unwavering faith in Lord Rama and her strength during trials make her a symbol of feminine power and grace.',
    image: 'https://i.pinimg.com/474x/5c/fa/5a/5cfa5ad47ea68bc67a94047cde6ad4b2.jpg',
    attributes: ['Purity', 'Devotion', 'Strength', 'Grace'],
  },
  {
    name: 'Lakshmana',
    subtitle: 'The Devoted Brother',
    description: 'Lakshmana exemplifies the ideal of selfless service and brotherly love. His unwavering loyalty to Lord Rama and his sacrifice during the exile period serve as inspiration for devotion and duty.',
    image: 'https://sree-seetharamachandra-swamy.vercel.app/assets/lakshmana-Dtnn4uSU.jpg',
    attributes: ['Loyalty', 'Service', 'Discipline', 'Courage'],
  },
  {
    name: 'Lord Hanuman',
    subtitle: 'The Ultimate Devotee',
    description: 'Lord Hanuman is celebrated as the greatest devotee of Lord Rama. His extraordinary strength, intelligence, and unwavering devotion make him one of the most beloved deities in Hinduism.',
    image: 'https://t3.ftcdn.net/jpg/13/98/33/96/360_F_1398339672_myfUYPdopTzVJHfCjNOM0qKjDje4e8FU.jpg',
    attributes: ['Devotion', 'Strength', 'Wisdom', 'Humility'],
  },
];

const attributeColors = [
  'text-primary',
  'text-accent',
  'text-[hsl(var(--temple-gold))]',
  'text-[hsl(var(--temple-maroon))]',
];

const attributeBgColors = [
  'bg-primary/10',
  'bg-accent/10',
  'bg-[hsl(var(--temple-gold)/0.1)]',
  'bg-[hsl(var(--temple-maroon)/0.1)]',
];

const DeitiesPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-24 px-4 temple-gradient-subtle">
        <div className="container mx-auto max-w-4xl text-center">
          <ScrollReveal>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ lineHeight: '1.1' }}>
              Divine Deities
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Meet the sacred deities worshipped at Sri Ramalayam Temple
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Deity Cards - alternating layout */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl space-y-20">
          {deities.map((deity, index) => {
            const isEven = index % 2 === 0;
            return (
              <ScrollReveal key={deity.name} delay={index * 100}>
                <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16`}>
                  {/* Image */}
                  <div className="w-full md:w-1/2 shrink-0">
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={deity.image}
                        alt={deity.name}
                        className="w-full h-72 md:h-96 object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="w-full md:w-1/2 space-y-4">
                    <span className="text-primary font-medium text-sm tracking-wide">
                      Deity {index + 1}
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                      {deity.name}
                    </h2>
                    <p className="text-primary/80 font-display text-lg italic">
                      {deity.subtitle}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {deity.description}
                    </p>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-3">Divine Attributes</h3>
                      <div className="flex flex-wrap gap-2">
                        {deity.attributes.map((attr, attrIdx) => (
                          <span
                            key={attr}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium ${attributeColors[attrIdx % attributeColors.length]} ${attributeBgColors[attrIdx % attributeBgColors.length]}`}
                          >
                            {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Darshan Timings */}
      <section className="py-20 px-4 temple-gradient text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              Visit Us for Darshan
            </h2>
            <p className="font-display text-lg md:text-xl italic opacity-90">
              Experience the divine presence and seek blessings at Sri Ramalayam Temple
            </p>
            <div className="space-y-2 text-lg md:text-xl font-medium pt-4">
              <p>Morning: 6:00 AM - 12:00 PM</p>
              <p>Evening: 4:00 PM - 8:00 PM</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
    <Footer />
  </div>
);

export default DeitiesPage;
