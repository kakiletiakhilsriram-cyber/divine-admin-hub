import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="bg-temple-dark text-temple-cream/80">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display text-lg text-temple-gold mb-3">Sri Ramalayam</h3>
          <p className="text-sm leading-relaxed">
            A sacred place of devotion and peace in Yenugupalli Village, Konaseema.
            Established in 1966.
          </p>
        </div>
        <div>
          <h4 className="font-display text-base text-temple-gold mb-3">Quick Links</h4>
          <div className="space-y-2">
            {[
              { label: 'About', path: '/about' },
              { label: 'Sevas', path: '/sevas' },
              { label: 'Events', path: '/events' },
              { label: 'Gallery', path: '/gallery' },
              { label: 'Contact', path: '/contact' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block text-sm hover:text-temple-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display text-base text-temple-gold mb-3">Contact</h4>
          <p className="text-sm leading-relaxed">
            Yenugupalli Village, Konaseema<br />
            Andhra Pradesh, India
          </p>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-temple-cream/10 text-center text-xs text-temple-cream/50">
        © {new Date().getFullYear()} Sri Seetharamachandra Swamy Temple. All rights reserved.
      </div>
    </div>
  </footer>
);
