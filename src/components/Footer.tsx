import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

export const Footer = () => (
  <footer className="bg-temple-dark text-temple-cream/80">
    <div className="container mx-auto px-4 py-14">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src="/images/logo.png" alt="Sri Ramalayam Logo" className="w-10 h-10" />
            <div>
              <h3 className="font-display text-lg text-temple-cream font-semibold">Sri Ramalayam</h3>
              <p className="text-xs text-temple-cream/60">Yenugupalli</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-temple-cream/60">
            A sacred spiritual center dedicated to Lord Rama and a place of devotion for generations.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display text-base text-temple-cream font-semibold mb-4">Quick Links</h4>
          <div className="space-y-3">
            {[
              { label: 'About Temple', path: '/about' },
              { label: 'Deities', path: '/about' },
              { label: 'Events & Festivals', path: '/events' },
              { label: 'Gallery', path: '/gallery' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="block text-sm text-temple-cream/60 hover:text-temple-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact Us */}
        <div>
          <h4 className="font-display text-base text-temple-cream font-semibold mb-4">Contact Us</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-temple-gold mt-0.5 shrink-0" />
              <p className="text-sm text-temple-cream/60">
                Sri Ramalayam Temple<br />
                Yenugupalli Village<br />
                Andhra Pradesh, India
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-temple-gold shrink-0" />
              <a href="tel:+919XXXXXXXXX" className="text-sm text-temple-cream/60 hover:text-temple-gold transition-colors">
                +91 9XXXXXXXXX
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-temple-gold shrink-0" />
              <a href="mailto:ramalayamkyp@gmail.com" className="text-sm text-temple-cream/60 hover:text-temple-gold transition-colors">
                ramalayamkyp@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Temple Timings & Social */}
        <div>
          <h4 className="font-display text-base text-temple-cream font-semibold mb-4">Temple Timings</h4>
          <div className="space-y-2 text-sm text-temple-cream/60 mb-6">
            <p>Morning: 6:00 AM - 12:00 PM</p>
            <p>Evening: 4:00 PM - 8:00 PM</p>
          </div>
          <h4 className="font-display text-sm text-temple-gold font-semibold mb-3">Follow Us</h4>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-temple-cream/10 flex items-center justify-center hover:bg-temple-gold/20 transition-colors" aria-label="Facebook">
              <Facebook className="w-4 h-4 text-temple-cream/70" />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-temple-cream/10 flex items-center justify-center hover:bg-temple-gold/20 transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4 text-temple-cream/70" />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-temple-cream/10 flex items-center justify-center hover:bg-temple-gold/20 transition-colors" aria-label="YouTube">
              <Youtube className="w-4 h-4 text-temple-cream/70" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-temple-cream/10 text-center text-xs text-temple-cream/40">
        © {new Date().getFullYear()} Sri Ramalayam Temple, Yenugupalli. All rights reserved.
      </div>
    </div>
  </footer>
);
